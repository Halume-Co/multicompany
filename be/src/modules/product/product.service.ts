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

  async create(dto: CreateProductDto, user: AuthenticatedUser) {
    const companyId = user.companyId!;

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException(`Category not found`);

    const product = await this.prisma.product.create({
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

    const company = await this.registryPrisma.company.findUnique({ where: { id: companyId } });
    return this.serializeProduct(product, company);
  }

  async findAllCategories() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findAll(query: QueryProductDto) {
    if (query.companyId) {
      const tenantPrisma = this.tenantManager.getTenantClient(query.companyId);
      const company = await this.registryPrisma.company.findUnique({ where: { id: query.companyId } });
      const where: any = { isActive: true };
      if (query.categoryId) where.categoryId = query.categoryId;
      if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

      const products = await tenantPrisma.product.findMany({
        where,
        include: { sizes: true, category: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return products.map((p: any) => this.serializeProduct(p, company));
    }

    const companies = await this.registryPrisma.company.findMany({ where: { isActive: true } });
    let allProducts: any[] = [];
    for (const company of companies) {
      const tenantPrisma = this.tenantManager.getTenantClient(company.id);
      const where: any = { isActive: true };
      if (query.categoryId) where.categoryId = query.categoryId;
      if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

      const products = await tenantPrisma.product.findMany({
        where,
        include: { sizes: true, category: { select: { id: true, name: true } } },
        take: 20,
      });
      allProducts = allProducts.concat(products.map((p: any) => this.serializeProduct(p, company)));
    }
    return allProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findOne(id: string) {
    const companies = await this.registryPrisma.company.findMany();
    for (const company of companies) {
        const tenantPrisma = this.tenantManager.getTenantClient(company.id);
        const product = await tenantPrisma.product.findUnique({
            where: { id },
            include: { sizes: true, category: { select: { id: true, name: true } } },
        });
        if (product && product.isActive) return this.serializeProduct(product, company);
    }
    throw new NotFoundException(`Product not found`);
  }

  async update(id: string, dto: UpdateProductDto, user: AuthenticatedUser) {
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
    const company = await this.registryPrisma.company.findUnique({ where: { id: user.companyId! } });
    return this.serializeProduct(product, company);
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    return { message: `Deleted successfully` };
  }
}
