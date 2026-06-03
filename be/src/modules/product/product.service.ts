import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Prisma } from '@prisma/client';
import { TenantConnectionService } from '../tenant/tenant.module';

@Injectable()
export class ProductService {
  constructor(
    @Inject('TENANT_PRISMA') private readonly prisma: any,
    private readonly registryPrisma: PrismaService,
    private readonly tenantManager: TenantConnectionService,
  ) {}

  private serializeProduct(product: any, companyInfo?: any) {
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
      images: product.imageUrl ? [product.imageUrl] : [],
      sizes: product.sizes
        ? product.sizes.sort((a, b) => a.size - b.size).map((s: any) => ({ size: String(s.size), stock: s.stock }))
        : [],
      sellerId: companyInfo?.id || product.companyId,
      sellerName: companyInfo?.name || "Official Store",
      sellerLogo: companyInfo?.logoUrl || null,
      category: product.category?.name || "Uncategorized",
      rating: 0,
      reviewCount: 0,
      createdAt: product.createdAt instanceof Date ? product.createdAt.toISOString() : product.createdAt,
    };
  }

  /**
   * CREATE: Dual-Write Pattern (Option B)
   * 1. Save to Tenant Silo (Source of Truth)
   * 2. Save to Public Registry (Fast Search Index)
   */
  async create(dto: CreateProductDto, user: AuthenticatedUser) {
    const companyId = user.companyId!;

    // 1. Write to Tenant Silo
    const productInSilo = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        companyId,
        sizes: { create: dto.sizes.map((s) => ({ size: s.size, stock: s.stock })) },
      },
      include: { sizes: true, category: { select: { id: true, name: true } } },
    });

    // 2. Write to Public Index (No stock/sizes here)
    await this.registryPrisma.product.upsert({
      where: { id: productInSilo.id },
      update: {
        name: dto.name,
        price: dto.price,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        companyId,
      },
      create: {
        id: productInSilo.id,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        companyId,
      }
    });

    const company = await this.registryPrisma.company.findUnique({ where: { id: companyId } });
    return this.serializeProduct(productInSilo, company);
  }

  async findAllCategories() {
    // Categories are shared/cached in Registry for fast filtering
    return this.registryPrisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * FIND ALL: Fast Search Pattern (Option B)
   * Query the Public Registry database (The Index) instead of looping through all Silos.
   */
  async findAll(query: QueryProductDto) {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.companyId) where.companyId = query.companyId;
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

    // This is secepat kilat (Lightning Fast) because it's only 1 query to the public schema
    const products = await this.registryPrisma.product.findMany({
      where,
      include: { 
        category: { select: { id: true, name: true } },
        // Note: In B approach, we don't fetch real-time sizes here for homepage
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // For logos and company names, we aggregate from Company registry
    const results: any[] = [];
    for (const p of products) {
        const company = await this.registryPrisma.company.findUnique({ 
            where: { id: p.companyId },
            select: { id: true, name: true, logoUrl: true }
        });
        results.push(this.serializeProduct(p, company));
    }

    return results;
  }

  /**
   * FIND ONE: Detailed Silo View
   * When user clicks a product, we fetch the TRUTH (stock) from the Silo.
   */
  async findOne(id: string) {
    // 1. Get registry info first to find out who owns this product
    const registryProduct = await this.registryPrisma.product.findUnique({ where: { id } });
    if (!registryProduct) throw new NotFoundException('Product not found');

    // 2. Fetch the TRUTH from the owner's silo
    const tenantPrisma = this.tenantManager.getTenantClient(registryProduct.companyId);
    const product = await tenantPrisma.product.findUnique({
        where: { id },
        include: { sizes: true, category: { select: { id: true, name: true } } },
    });

    if (!product || !product.isActive) throw new NotFoundException(`Product not found`);

    const company = await this.registryPrisma.company.findUnique({ where: { id: registryProduct.companyId } });
    return this.serializeProduct(product, company);
  }

  async update(id: string, dto: UpdateProductDto, user: AuthenticatedUser) {
    // 1. Update Silo (Truth)
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price && { price: dto.price }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
      },
      include: { sizes: true, category: { select: { id: true, name: true } } },
    });

    // 2. Sync to Public Index
    await this.registryPrisma.product.update({
        where: { id },
        data: {
            ...(dto.name && { name: dto.name }),
            ...(dto.price && { price: dto.price }),
            ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
            ...(dto.categoryId && { categoryId: dto.categoryId }),
        }
    });

    const company = await this.registryPrisma.company.findUnique({ where: { id: user.companyId! } });
    return this.serializeProduct(product, company);
  }

  async remove(id: string, user: AuthenticatedUser) {
    // Soft delete in both
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    await this.registryPrisma.product.update({ where: { id }, data: { isActive: false } });
    return { message: `Deleted successfully` };
  }
}
