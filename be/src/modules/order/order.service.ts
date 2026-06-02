import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartItem, Company, Prisma, Product, ProductSize } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CheckoutDto } from './dto/checkout.dto';

type CartItemWithProduct = CartItem & {
  product: Product & { company: Company; sizes: ProductSize[] };
};

interface CompanyOrderGroup {
  companyId: string;
  company: Company;
  items: CartItemWithProduct[];
  totalPrice: number;
}

type OrderWithCompany = Prisma.OrderGetPayload<{
  include: {
    company: { select: { id: true; name: true } };
    items: {
      include: {
        product: { select: { id: true; name: true; imageUrl: true } };
      };
    };
  };
}>;

type OrderWithUser = Prisma.OrderGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true } };
    items: {
      include: {
        product: { select: { id: true; name: true; imageUrl: true } };
      };
    };
  };
}>;

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeOrder(order: OrderWithCompany) {
    return {
      id: order.id,
      buyerId: order.userId,
      sellerId: order.companyId,
      status: order.status.toLowerCase(),
      total: Number(order.totalPrice),
      subtotal: Number(order.totalPrice),
      tax: 0,
      shippingAddress: null,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        size: String(item.size),
        quantity: item.quantity,
        price: Number(item.unitPrice),
        image: item.product.imageUrl ?? '',
      })),
      createdAt: order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
      updatedAt: order.updatedAt instanceof Date
        ? order.updatedAt.toISOString()
        : order.updatedAt,
    };
  }

  private serializeSellerOrder(order: OrderWithUser) {
    return {
      id: order.id,
      buyerName: order.user.name,
      buyerEmail: order.user.email,
      status: order.status.toLowerCase(),
      total: Number(order.totalPrice),
      date: order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
      items: order.items.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        size: String(item.size),
        quantity: item.quantity,
        price: Number(item.unitPrice),
        image: item.product.imageUrl ?? '',
      })),
    };
  }

  async checkout(dto: CheckoutDto, user: AuthenticatedUser) {
    const createdOrders = await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId: user.id },
        include: {
          items: {
            include: {
              product: { include: { company: true, sizes: true } },
            },
          },
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new BadRequestException(
          'Your cart is empty. Add items before checking out.',
        );
      }

      const cartItems = cart.items as CartItemWithProduct[];

      const cartItemVersionConditions = cartItems.map((item) => ({
        id: item.id,
        updatedAt: item.updatedAt,
      }));

      const claimedCartItems = await tx.cartItem.deleteMany({
        where: { cartId: cart.id, OR: cartItemVersionConditions },
      });

      if (claimedCartItems.count !== cartItems.length) {
        throw new BadRequestException(
          'Your cart changed during checkout. Please review it and try again.',
        );
      }

      const groups = this.groupItemsByCompany(cartItems);
      const orders: OrderWithCompany[] = [];

      for (const group of groups) {
        for (const item of group.items) {
          const productSize = item.product.sizes.find(
            (size) => size.size === item.size,
          );

          if (!item.product.isActive) {
            throw new BadRequestException(
              `Product "${item.product.name}" is no longer available.`,
            );
          }

          if (!productSize || productSize.stock < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for "${item.product.name}" size ${item.size}. ` +
                `Requested: ${item.quantity}, Available: ${productSize?.stock ?? 0}`,
            );
          }

          const stockUpdate = await tx.productSize.updateMany({
            where: {
              productId: item.productId,
              size: item.size,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });

          if (stockUpdate.count !== 1) {
            throw new BadRequestException(
              `Stock changed for "${item.product.name}" size ${item.size}. Please review your cart and try again.`,
            );
          }
        }

        const order = await tx.order.create({
          data: {
            userId: user.id,
            companyId: group.companyId,
            totalPrice: group.totalPrice,
            status: 'PENDING',
            notes: dto.notes,
            items: {
              create: group.items.map((item) => ({
                productId: item.productId,
                size: item.size,
                quantity: item.quantity,
                unitPrice: item.product.price,
              })),
            },
          },
          include: {
            company: { select: { id: true, name: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, imageUrl: true } },
              },
            },
          },
        });

        orders.push(order as OrderWithCompany);
      }

      return orders;
    });

    const grandTotal = createdOrders.reduce(
      (sum, order) => sum + Number(order.totalPrice),
      0,
    );

    return {
      message: 'Checkout successful! Orders have been created.',
      ordersCreated: createdOrders.length,
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      orders: createdOrders.map((o) => this.serializeOrder(o)),
    };
  }

  async getBuyerOrders(user: AuthenticatedUser) {
    const orders = await this.prisma.order.findMany({
      where: { userId: user.id },
      include: {
        company: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.serializeOrder(o as OrderWithCompany));
  }

  async getSellerOrders(user: AuthenticatedUser) {
    if (!user.companyId) {
      throw new BadRequestException('You are not associated with any company.');
    }

    const orders = await this.prisma.order.findMany({
      where: { companyId: user.companyId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => this.serializeSellerOrder(o as OrderWithUser));
  }

  async getOrderById(orderId: string, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        company: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with id "${orderId}" not found`);
    }

    const isBuyer = order.userId === user.id;
    const isSeller = order.companyId === user.companyId;

    if (!isBuyer && !isSeller && user.role !== 'ADMIN') {
      throw new NotFoundException(`Order with id "${orderId}" not found`);
    }

    return this.serializeOrder(order as OrderWithCompany);
  }

  private groupItemsByCompany(items: CartItemWithProduct[]): CompanyOrderGroup[] {
    const groupMap = new Map<string, CompanyOrderGroup>();

    for (const item of items) {
      const { companyId, company } = item.product;
      const itemTotal = Number(item.product.price) * item.quantity;

      if (groupMap.has(companyId)) {
        const group = groupMap.get(companyId)!;
        group.items.push(item);
        group.totalPrice = parseFloat((group.totalPrice + itemTotal).toFixed(2));
      } else {
        groupMap.set(companyId, {
          companyId,
          company,
          items: [item],
          totalPrice: parseFloat(itemTotal.toFixed(2)),
        });
      }
    }

    return Array.from(groupMap.values());
  }
}
