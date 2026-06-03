import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Company, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { TenantConnectionService } from '../tenant/tenant.module';

@Injectable()
export class OrderService {
  constructor(
    @Inject('TENANT_PRISMA') private readonly prisma: any,
    private readonly registryPrisma: PrismaService,
    private readonly tenantManager: TenantConnectionService,
  ) {}

  private serializeOrder(order: any, companyInfo?: { id: string, name: string }) {
    return {
      id: order.id,
      buyerId: order.userId,
      sellerId: companyInfo?.id || order.companyId,
      sellerName: companyInfo?.name || "Official Store",
      status: order.status.toLowerCase(),
      total: Number(order.totalPrice),
      subtotal: Number(order.totalPrice),
      tax: 0,
      shippingAddress: null,
      items: order.items.map((item: any) => ({
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

  private serializeSellerOrder(order: any) {
    return {
      id: order.id,
      buyerName: order.user?.name || "Unknown Buyer",
      buyerEmail: order.user?.email || "",
      status: order.status.toLowerCase(),
      total: Number(order.totalPrice),
      date: order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt,
      items: order.items.map((item: any) => ({
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
    const cart = await this.registryPrisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: true },
    }) as any;

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Your cart is empty.');
    }

    const companies = await this.registryPrisma.company.findMany();
    const cartItemsWithDetails: any[] = [];

    for (const item of cart.items) {
        let productDetails: any = null;
        let companyInfo: any = null;
        for (const company of companies) {
            const tenantPrisma = await this.tenantManager.getTenantClient(company.id);
            const product = await tenantPrisma.product.findUnique({
                where: { id: item.productId },
                include: { sizes: true }
            });
            if (product) {
                productDetails = { ...product, company };
                companyInfo = company;
                break;
            }
        }
        if (productDetails) cartItemsWithDetails.push({ ...item, product: productDetails, company: companyInfo });
    }

    const groups = this.groupItemsByCompany(cartItemsWithDetails);
    const createdOrders: any[] = [];

    for (const group of groups) {
      const tenantPrisma = await this.tenantManager.getTenantClient(group.companyId);

      const order = await tenantPrisma.$transaction(async (tx: any) => {
        for (const item of group.items) {
          const productSize = item.product.sizes.find((s: any) => s.size === item.size);
          if (!productSize || productSize.stock < item.quantity) {
            throw new BadRequestException(`Insufficient stock for ${item.product.name}`);
          }
          await tx.productSize.update({ where: { id: productSize.id }, data: { stock: { decrement: item.quantity } } });
        }

        return tx.order.create({
          data: {
            userId: user.id,
            totalPrice: group.totalPrice,
            status: 'PENDING',
            notes: dto.notes,
            items: {
              create: group.items.map((item: any) => ({
                productId: item.productId,
                size: item.size,
                quantity: item.quantity,
                unitPrice: item.product.price,
              })),
            },
          },
          include: {
            items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
          },
        });
      });

      createdOrders.push({ order, company: group.company });
    }

    await this.registryPrisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    const grandTotal = createdOrders.reduce((sum, o) => sum + Number(o.order.totalPrice), 0);

    return {
      message: 'Checkout successful!',
      ordersCreated: createdOrders.length,
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      orders: createdOrders.map((o) => this.serializeOrder(o.order, o.company)),
    };
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order not found`);

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      include: {
        items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
      },
    });

    const company = await this.registryPrisma.company.findUnique({ where: { id: user.companyId! } });
    return this.serializeOrder(updated, company || undefined);
  }

  async getBuyerOrders(user: AuthenticatedUser) {
    const companies = await this.registryPrisma.company.findMany({ where: { isActive: true } });
    let allOrders: any[] = [];

    for (const company of companies) {
      const tenantPrisma = await this.tenantManager.getTenantClient(company.id);
      const orders = await tenantPrisma.order.findMany({
        where: { userId: user.id },
        include: {
          items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
        },
      });
      allOrders = allOrders.concat(orders.map((o: any) => this.serializeOrder(o, company)));
    }

    return allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getSellerOrders(user: AuthenticatedUser) {
    const orders = await this.prisma.order.findMany({
      include: {
        items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const results: any[] = [];
    for (const order of orders) {
        const buyer = await this.registryPrisma.user.findUnique({ where: { id: order.userId } });
        results.push(this.serializeSellerOrder({ ...order, user: buyer }));
    }
    return results;
  }

  async getOrderById(orderId: string, user: AuthenticatedUser) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
      },
    });

    if (order) {
        const company = user.companyId ? await this.registryPrisma.company.findUnique({ where: { id: user.companyId } }) : null;
        return this.serializeOrder(order, company || undefined);
    }

    const companies = await this.registryPrisma.company.findMany();
    for (const comp of companies) {
        const tenantPrisma = await this.tenantManager.getTenantClient(comp.id);
        const o = await tenantPrisma.order.findUnique({
            where: { id: orderId },
            include: {
              items: { include: { product: { select: { id: true, name: true, imageUrl: true } } } },
            },
        });
        if (o && (o.userId === user.id || user.role === 'ADMIN')) {
            return this.serializeOrder(o, comp);
        }
    }

    throw new NotFoundException(`Order not found`);
  }

  private groupItemsByCompany(items: any[]): any[] {
    const groupMap = new Map<string, any>();
    for (const item of items) {
      const { companyId, company } = item.product;
      const itemTotal = Number(item.product.price) * item.quantity;
      if (groupMap.has(companyId)) {
        const group = groupMap.get(companyId)!;
        group.items.push(item);
        group.totalPrice = parseFloat((group.totalPrice + itemTotal).toFixed(2));
      } else {
        groupMap.set(companyId, { companyId, company, items: [item], totalPrice: parseFloat(itemTotal.toFixed(2)) });
      }
    }
    return Array.from(groupMap.values());
  }
}
