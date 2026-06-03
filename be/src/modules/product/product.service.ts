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
   * [PRESENTATION] SLIDE 12: SUPPLY SERVICE - TAMBAH PRODUK
   * Memungkinkan brand (Silo) meng-input produk baru ke katalog mandiri mereka.
   * Logic: INSERT INTO products (...) VALUES (...) di isolated database.
   */
  async create(dto: CreateProductDto, user: AuthenticatedUser) {
    const companyId = user.companyId!;

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
    return this.registryPrisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  /**
   * [PRESENTATION] SLIDE 7: DISCOVERY SERVICE - PENCARIAN BARANG
   * Melakukan pencarian cross-company real-time melalui Registry Index.
   * Logic: SELECT p.*, c.name FROM products p JOIN companies c ... WHERE p.name LIKE ?
   */
  async findAll(query: QueryProductDto) {
    if (query.companyId) {
      const tenantPrisma = await this.tenantManager.getTenantClient(query.companyId);
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

    const where: Prisma.ProductWhereInput = { isActive: true };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.search) where.name = { contains: query.search, mode: 'insensitive' };

    const products = await this.registryPrisma.product.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

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

  async findOne(id: string) {
    const registryProduct = await this.registryPrisma.product.findUnique({ where: { id } });
    if (!registryProduct) throw new NotFoundException('Product not found');

    const tenantPrisma = await this.tenantManager.getTenantClient(registryProduct.companyId);
    const product = await tenantPrisma.product.findUnique({
        where: { id },
        include: { sizes: true, category: { select: { id: true, name: true } } },
    });

    if (!product || !product.isActive) throw new NotFoundException(`Product not found in Silo`);

    const company = await this.registryPrisma.company.findUnique({ where: { id: registryProduct.companyId } });
    return this.serializeProduct(product, company);
  }

  async update(id: string, dto: UpdateProductDto, user: AuthenticatedUser) {
    // Defensive Check: Ensure product exists in this specific tenant silo
    const existingInSilo = await this.prisma.product.findUnique({ where: { id } });
    if (!existingInSilo) {
        throw new NotFoundException(`Product with ID ${id} not found in your company's database.`);
    }

    try {
        // 1. Update Silo (Truth)
        const product = await this.prisma.product.update({
          where: { id },
          data: {
            ...(dto.name && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.price && { price: dto.price }),
            ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
            ...(dto.categoryId && { categoryId: dto.categoryId }),
            ...(dto.sizes && {
              sizes: {
                deleteMany: {},
                create: dto.sizes.map((s) => ({ size: s.size, stock: s.stock })),
              },
            }),
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
        }).catch(err => console.error('Registry sync failed, but silo update succeeded:', err.message));

        const company = await this.registryPrisma.company.findUnique({ where: { id: user.companyId! } });
        return this.serializeProduct(product, company);
    } catch (err) {
        console.error('Silo update failed:', err);
        throw new ForbiddenException(`Failed to update product in silo database: ${err.message}`);
    }
  }

  async remove(id: string, user: AuthenticatedUser) {
    await this.prisma.product.update({ where: { id }, data: { isActive: false } });
    await this.registryPrisma.product.update({ where: { id }, data: { isActive: false } }).catch(() => {});
    return { message: `Deleted successfully` };
  }
}
