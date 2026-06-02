import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { RemoveFromCartDto } from './dto/remove-from-cart.dto';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  //  Ensure cart exists (or create it)
  // ---------------------------------------------------------------------------

  private async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
  }

  // ---------------------------------------------------------------------------
  //  GET /cart
  // ---------------------------------------------------------------------------

  async getCart(user: AuthenticatedUser) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                company: { select: { id: true, name: true } },
                sizes: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      return { id: null, userId: user.id, items: [], totalItems: 0, subtotal: 0 };
    }

    // Compute subtotal
    const subtotal = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items,
      totalItems: cart.items.length,
      subtotal: parseFloat(subtotal.toFixed(2)),
    };
  }

  // ---------------------------------------------------------------------------
  //  POST /cart/add
  // ---------------------------------------------------------------------------

  async addToCart(dto: AddToCartDto, user: AuthenticatedUser) {
    // 1. Validate product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: { sizes: true },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException(
        `Product with id "${dto.productId}" not found`,
      );
    }

    // 2. Validate size exists
    const productSize = product.sizes.find((s) => s.size === dto.size);
    if (!productSize) {
      throw new NotFoundException(
        `Size ${dto.size} is not available for product "${product.name}"`,
      );
    }

    // 3. Validate stock
    if (productSize.stock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock for size ${dto.size}. Available: ${productSize.stock}`,
      );
    }

    // 4. Get or create cart
    const cart = await this.getOrCreateCart(user.id);

    // 5. Upsert cart item (add to existing or create new)
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId_size: {
          cartId: cart.id,
          productId: dto.productId,
          size: dto.size,
        },
      },
    });

    let cartItem;
    if (existingItem) {
      // Validate combined quantity doesn't exceed stock
      const newQty = existingItem.quantity + dto.quantity;
      if (newQty > productSize.stock) {
        throw new BadRequestException(
          `Total quantity (${newQty}) exceeds available stock (${productSize.stock}) for size ${dto.size}`,
        );
      }

      cartItem = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
        include: { product: { include: { company: { select: { id: true, name: true } } } } },
      });
    } else {
      cartItem = await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          size: dto.size,
          quantity: dto.quantity,
        },
        include: { product: { include: { company: { select: { id: true, name: true } } } } },
      });
    }

    return {
      message: 'Item added to cart successfully',
      cartItem,
    };
  }

  // ---------------------------------------------------------------------------
  //  DELETE /cart/remove
  // ---------------------------------------------------------------------------

  async removeFromCart(dto: RemoveFromCartDto, user: AuthenticatedUser) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId: user.id },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const cartItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId_size: {
          cartId: cart.id,
          productId: dto.productId,
          size: dto.size,
        },
      },
    });

    if (!cartItem) {
      throw new NotFoundException(
        `No cart item found for product "${dto.productId}" size ${dto.size}`,
      );
    }

    await this.prisma.cartItem.delete({ where: { id: cartItem.id } });

    return { message: 'Item removed from cart successfully' };
  }

  // ---------------------------------------------------------------------------
  //  INTERNAL: Get cart items with product info (used by checkout)
  // ---------------------------------------------------------------------------

  async getCartItemsForCheckout(userId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                company: true,
                sizes: true,
              },
            },
          },
        },
      },
    });

    return cart;
  }

  async clearCart(cartId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
