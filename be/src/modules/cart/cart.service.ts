import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { RemoveFromCartDto } from './dto/remove-from-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { TenantConnectionService } from '../tenant/tenant.module';

@Injectable()
export class CartService {
  constructor(
    @Inject('TENANT_PRISMA') private readonly prisma: any,
    private readonly registryPrisma: PrismaService,
    private readonly tenantManager: TenantConnectionService,
  ) {}

  private serializeProduct(product: any, company?: any) {
    return {
      id: product.id,
      name: product.name,
      description: product.description ?? '',
      price: Number(product.price),
      images: product.imageUrl ? [product.imageUrl] : [],
      sizes: product.sizes
        ? product.sizes.sort((a, b) => a.size - b.size).map((s: any) => ({ size: String(s.size), stock: s.stock }))
        : [],
      sellerId: company?.id || product.companyId,
      sellerName: company?.name || "Official Store",
      category: product.category?.name || "Uncategorized",
      rating: 0,
      reviewCount: 0,
      createdAt: product.createdAt.toISOString(),
    };
  }

  async getCart(user: AuthenticatedUser) {
    const cart = await this.registryPrisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      return { items: [], subtotal: 0, tax: 0, total: 0 };
    }

    const companies = await this.registryPrisma.company.findMany();
    const itemsWithDetails: any[] = [];

    for (const item of cart.items) {
        let productDetails: any = null;
        let companyInfo: any = null;

        for (const company of companies) {
            const tenantPrisma = await this.tenantManager.getTenantClient(company.id);
            const product = await tenantPrisma.product.findUnique({
                where: { id: item.productId },
                include: { category: true, sizes: true }
            });
            if (product) {
                productDetails = product;
                companyInfo = company;
                break;
            }
        }

        if (productDetails) {
            itemsWithDetails.push({
                productId: item.productId,
                size: String(item.size),
                quantity: item.quantity,
                price: Number(productDetails.price),
                product: this.serializeProduct(productDetails, companyInfo),
            });
        }
    }

    const subtotal = itemsWithDetails.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return {
      items: itemsWithDetails,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: 0,
      total: parseFloat(subtotal.toFixed(2)),
    };
  }

  async addToCart(dto: AddToCartDto, user: AuthenticatedUser) {
    const companies = await this.registryPrisma.company.findMany();
    let productDetails: any = null;

    for (const company of companies) {
        const tenantPrisma = await this.tenantManager.getTenantClient(company.id);
        const product = await tenantPrisma.product.findUnique({
            where: { id: dto.productId },
            include: { sizes: true }
        });
        if (product && product.isActive) {
            productDetails = product;
            break;
        }
    }

    if (!productDetails) throw new NotFoundException('Product not found');

    const productSize = productDetails.sizes.find((s: any) => s.size === dto.size);
    if (!productSize || productSize.stock < dto.quantity) {
        throw new BadRequestException('Insufficient stock');
    }

    const cart = await this.registryPrisma.cart.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    const existingItem = await this.registryPrisma.cartItem.findUnique({
      where: { cartId_productId_size: { cartId: cart.id, productId: dto.productId, size: dto.size } }
    });

    if (existingItem) {
      await this.registryPrisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + dto.quantity }
      });
    } else {
      await this.registryPrisma.cartItem.create({
        data: { cartId: cart.id, productId: dto.productId, size: dto.size, quantity: dto.quantity }
      });
    }

    return { message: 'Item added to cart' };
  }

  async updateQuantity(dto: UpdateCartItemDto, user: AuthenticatedUser) {
    const cart = await this.registryPrisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) throw new NotFoundException('Cart not found');

    await this.registryPrisma.cartItem.update({
      where: { cartId_productId_size: { cartId: cart.id, productId: dto.productId, size: dto.size } },
      data: { quantity: dto.quantity }
    });

    return this.getCart(user);
  }

  async removeFromCart(dto: RemoveFromCartDto, user: AuthenticatedUser) {
    const cart = await this.registryPrisma.cart.findUnique({ where: { userId: user.id } });
    if (!cart) throw new NotFoundException('Cart not found');

    await this.registryPrisma.cartItem.delete({
      where: { cartId_productId_size: { cartId: cart.id, productId: dto.productId, size: dto.size } }
    });

    return { message: 'Item removed' };
  }

  async clearCart(cartId: string) {
    await this.registryPrisma.cartItem.deleteMany({ where: { cartId } });
  }
}
