import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Prisma } from '@prisma/client';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    sizes: true;
    category: { select: { id: true; name: true } };
    company: { select: { id: true; name: true; logoUrl: true } };
  };
}>;

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeProduct(product: ProductWithRelations) {
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
      images: product.imageUrl ? [product.imageUrl] : [],
      sizes: product.sizes
        .sort((a, b) => a.size - b.size)
        .map((s) => ({ size: String(s.size), stock: s.stock })),
      sellerId: product.companyId,
      sellerName: product.company.name,
      category: product.category.name,
      rating: 0,
      reviewCount: 0,
      createdAt: product.createdAt.toISOString(),
    };
  }

  async create(dto: CreateProductDto, user: AuthenticatedUser) {
    const companyId = user.companyId!;

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Category with id "${dto.categoryId}" not found`,
      );
    }

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        companyId,
        sizes: {
          create: dto.sizes.map((s) => ({ size: s.size, stock: s.stock })),
        },
      },
      include: {
        sizes: true,
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    return this.serializeProduct(product);
  }

  async findAll(query: QueryProductDto) {
    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.companyId) where.companyId = query.companyId;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        sizes: true,
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => this.serializeProduct(p));
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        sizes: true,
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return this.serializeProduct(product);
  }

  async update(id: string, dto: UpdateProductDto, user: AuthenticatedUser) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
    this.assertOwnership(existing.companyId, user);

    const sizesUpdate = dto.sizes
      ? {
          deleteMany: {},
          create: dto.sizes.map((s) => ({ size: s.size, stock: s.stock })),
        }
      : undefined;

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price && { price: dto.price }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.categoryId && { categoryId: dto.categoryId }),
        ...(sizesUpdate && { sizes: sizesUpdate }),
      },
      include: {
        sizes: true,
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    return this.serializeProduct(product);
  }

  async remove(id: string, user: AuthenticatedUser) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing || !existing.isActive) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
    this.assertOwnership(existing.companyId, user);

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: `Product "${existing.name}" deleted successfully` };
  }

  private assertOwnership(productCompanyId: string, user: AuthenticatedUser) {
    if (user.role === 'ADMIN') return;
    if (productCompanyId !== user.companyId) {
      throw new ForbiddenException(
        'You can only manage products belonging to your company',
      );
    }
  }
}
