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

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  //  CREATE
  // ---------------------------------------------------------------------------

  async create(dto: CreateProductDto, user: AuthenticatedUser) {
    const companyId = user.companyId!;

    // Verify category exists
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
          create: dto.sizes.map((s) => ({
            size: s.size,
            stock: s.stock,
          })),
        },
      },
      include: {
        sizes: { orderBy: { size: 'asc' } },
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    return product;
  }

  // ---------------------------------------------------------------------------
  //  READ ALL
  // ---------------------------------------------------------------------------

  async findAll(query: QueryProductDto) {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.companyId) {
      where.companyId = query.companyId;
    }

    if (query.search) {
      where.name = {
        contains: query.search,
        mode: 'insensitive',
      };
    }

    return this.prisma.product.findMany({
      where,
      include: {
        sizes: { orderBy: { size: 'asc' } },
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  //  READ ONE
  // ---------------------------------------------------------------------------

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        sizes: { orderBy: { size: 'asc' } },
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true, logoUrl: true } },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }

    return product;
  }

  // ---------------------------------------------------------------------------
  //  UPDATE
  // ---------------------------------------------------------------------------

  async update(id: string, dto: UpdateProductDto, user: AuthenticatedUser) {
    const product = await this.findOne(id);
    this.assertOwnership(product.companyId, user);

    // If sizes are being updated, replace all sizes
    const sizesUpdate = dto.sizes
      ? {
          deleteMany: {},
          create: dto.sizes.map((s) => ({ size: s.size, stock: s.stock })),
        }
      : undefined;

    return this.prisma.product.update({
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
        sizes: { orderBy: { size: 'asc' } },
        category: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });
  }

  // ---------------------------------------------------------------------------
  //  DELETE (soft delete)
  // ---------------------------------------------------------------------------

  async remove(id: string, user: AuthenticatedUser) {
    const product = await this.findOne(id);
    this.assertOwnership(product.companyId, user);

    await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: `Product "${product.name}" deleted successfully` };
  }

  // ---------------------------------------------------------------------------
  //  HELPERS
  // ---------------------------------------------------------------------------

  private assertOwnership(
    productCompanyId: string,
    user: AuthenticatedUser,
  ): void {
    if (user.role === 'ADMIN') return; // Admins bypass ownership check
    if (productCompanyId !== user.companyId) {
      throw new ForbiddenException(
        'You can only manage products belonging to your company',
      );
    }
  }
}
