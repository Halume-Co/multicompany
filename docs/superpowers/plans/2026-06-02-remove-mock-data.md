# Remove Mock Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hapus semua mock/hardcoded data di frontend dan hubungkan ke backend NestJS + database.

**Architecture:** Tambah serializer methods di BE services untuk mengubah Prisma shape → FE types yang sudah ada. FE pages ganti mock data dengan useEffect + API calls dari `lib/api.ts` beserta loading dan error state.

**Tech Stack:** NestJS (BE), Next.js App Router + TypeScript (FE), `lib/api.ts` (existing API functions)

---

## File Map

**BE — dimodifikasi:**
- `be/src/modules/product/product.service.ts` — tambah `serializeProduct()`, apply ke semua return
- `be/src/modules/order/order.service.ts` — tambah `serializeOrder()` + `serializeSellerOrder()`
- `be/src/modules/cart/cart.service.ts` — tambah category ke cart include query

**FE — dimodifikasi:**
- `fe/app/page.tsx` — hapus `mockProducts[]`, fetch `getProducts()`
- `fe/app/products/[id]/page.tsx` — hapus `mockProduct`, fetch `getProduct(id)`
- `fe/app/seller/products/page.tsx` — hapus `mockProducts[]`, fetch `getSellerProducts()`
- `fe/app/seller/orders/page.tsx` — hapus `mockOrders[]`, fetch `getSellerOrders()`
- `fe/app/seller/dashboard/page.tsx` — hapus `mockStats`/`mockRecentOrders`, compute dari API

---

## Task 1: BE — Product Serializer

**Files:**
- Modify: `be/src/modules/product/product.service.ts`

- [ ] **Step 1: Tambah method `serializeProduct` dan update semua return**

Ganti seluruh isi `be/src/modules/product/product.service.ts` dengan:

```typescript
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
```

- [ ] **Step 2: Verifikasi BE compile tanpa error**

```bash
cd be && npx tsc --noEmit 2>&1 | head -20
```

Expected: tidak ada error (atau hanya warning yang tidak blocking).

- [ ] **Step 3: Test endpoint produk via curl**

```bash
curl -s http://localhost:3001/products | python3 -m json.tool | head -40
```

Expected: array JSON dengan field `images`, `sellerId`, `sellerName`, `category` (string), `rating: 0`, `sizes[].size` berupa string.

- [ ] **Step 4: Commit**

```bash
cd be && git add src/modules/product/product.service.ts
git commit -m "feat(be): serialize product response to match FE types"
```

---

## Task 2: BE — Order Serializer

**Files:**
- Modify: `be/src/modules/order/order.service.ts`

- [ ] **Step 1: Tambah dua serializer dan apply ke semua return**

Ganti seluruh isi `be/src/modules/order/order.service.ts` dengan:

```typescript
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

type OrderWithDetails = Prisma.OrderGetPayload<{
  include: {
    company: { select: { id: true; name: true } };
    items: {
      include: {
        product: { select: { id: true; name: true; imageUrl: true } };
      };
    };
  };
}>;

type SellerOrderWithUser = Prisma.OrderGetPayload<{
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

  private serializeOrder(order: OrderWithDetails & { totalPrice: number; updatedAt: Date }) {
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

  private serializeSellerOrder(order: SellerOrderWithUser & { totalPrice: number }) {
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
      const orders: OrderWithDetails[] = [];

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

        orders.push(order as OrderWithDetails);
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
      orders: createdOrders.map((o) => this.serializeOrder(o as any)),
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

    return orders.map((o) => this.serializeOrder(o as any));
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

    return orders.map((o) => this.serializeSellerOrder(o as any));
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

    return this.serializeOrder(order as any);
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
```

- [ ] **Step 2: Verifikasi BE compile**

```bash
cd be && npx tsc --noEmit 2>&1 | head -20
```

Expected: tidak ada error baru.

- [ ] **Step 3: Commit**

```bash
cd be && git add src/modules/order/order.service.ts
git commit -m "feat(be): serialize order response to match FE types"
```

---

## Task 3: FE — Homepage (app/page.tsx)

**Files:**
- Modify: `fe/app/page.tsx`

- [ ] **Step 1: Ganti seluruh isi `fe/app/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Product } from "@/lib/types";
import * as api from "@/lib/api";

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getProducts().then((res) => {
      if (res.success && res.data) setProducts(res.data);
      setIsLoading(false);
    });
  }, []);

  return (
    <>
      <Header />
      <main className="bg-background">
        <section className="bg-secondary">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-2xl px-lg py-3xl lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]">
            <div className="w-full max-w-[520px] space-y-lg">
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                Multi-Company Shoe Marketplace
              </p>
              <h1 className="text-5xl font-semibold leading-[1.07] tracking-[-0.28px] text-foreground max-md:text-4xl">
                Buy premium shoes or manage your own storefront.
              </h1>
              <p className="max-w-[460px] text-lg text-muted-foreground">
                Browse premium footwear, build a cart, and manage seller tools
                in one clean marketplace.
              </p>
              <div className="flex flex-wrap gap-md">
                {!isAuthenticated ? (
                  <>
                    <Button asChild size="lg">
                      <Link href="/auth/register">Create Account</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link href="/auth/login">Sign In</Link>
                    </Button>
                  </>
                ) : user?.role === "seller" ? (
                  <Button asChild size="lg">
                    <Link href={user.companyId ? "/seller/dashboard" : "/seller/company"}>
                      {user.companyId ? "Open Seller Dashboard" : "Finish Seller Setup"}
                    </Link>
                  </Button>
                ) : (
                  <Button asChild size="lg">
                    <Link href="/cart">View Cart</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid min-w-0 gap-lg sm:grid-cols-2">
              {isLoading
                ? Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-border animate-pulse" />
                  ))
                : products.slice(0, 2).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-lg py-3xl">
          <div className="mb-xl max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground mb-sm">
              Featured Styles
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.374px] text-foreground">
              Explore the current showcase
            </h2>
            <p className="mt-md text-base text-muted-foreground">
              Product browsing is public. Checkout and seller tools use secure sessions.
            </p>
          </div>

          {isLoading ? (
            <div className="grid gap-xl md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-lg bg-border animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-muted-foreground">No products yet.</p>
          ) : (
            <div className="grid gap-xl md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/dika/projects/multicompany && git add fe/app/page.tsx
git commit -m "feat(fe): replace mock products on homepage with API data"
```

---

## Task 4: FE — Product Detail Page (app/products/[id]/page.tsx)

**Files:**
- Modify: `fe/app/products/[id]/page.tsx`

- [ ] **Step 1: Ganti seluruh isi file**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/contexts/CartContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Product } from "@/lib/types";
import * as api from "@/lib/api";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showNotification, setShowNotification] = useState(false);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.getProduct(id).then((res) => {
      if (res.success && res.data) {
        setProduct(res.data);
      } else {
        setError("Product not found.");
      }
      setIsLoading(false);
    });
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (!selectedSize) {
      alert("Please select a size");
      return;
    }
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    addToCart(product, selectedSize, quantity);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="bg-background">
          <div className="max-w-7xl mx-auto px-lg py-3xl">
            <div className="grid gap-3xl lg:grid-cols-2">
              <div className="aspect-square rounded-lg bg-border animate-pulse" />
              <div className="space-y-lg">
                <div className="h-8 bg-border rounded animate-pulse w-1/3" />
                <div className="h-12 bg-border rounded animate-pulse" />
                <div className="h-6 bg-border rounded animate-pulse w-2/3" />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <Header />
        <main className="bg-background">
          <div className="max-w-7xl mx-auto px-lg py-3xl text-center">
            <p className="text-muted-foreground mb-lg">{error || "Product not found."}</p>
            <Button asChild variant="outline">
              <Link href="/">Back to Shop</Link>
            </Button>
          </div>
        </main>
      </>
    );
  }

  const selectedSizeData = product.sizes.find((s) => s.size === selectedSize);

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-lg py-lg">
            <div className="flex items-center gap-sm text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition">Shop</Link>
              <span>/</span>
              <span className="text-foreground">{product.category}</span>
              <span>/</span>
              <span className="text-foreground">{product.name}</span>
            </div>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-lg py-3xl">
          <div className="grid gap-3xl lg:grid-cols-[minmax(0,1fr)_560px]">
            <div className="space-y-lg">
              <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
                {product.images[selectedImageIndex] ? (
                  <img
                    src={product.images[selectedImageIndex]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-3 gap-md sm:grid-cols-4">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square overflow-hidden rounded-sm border transition ${
                        index === selectedImageIndex
                          ? "border-primary"
                          : "border-border hover:border-muted"
                      }`}
                    >
                      <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-lg">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-sm">
                  {product.category}
                </p>
                <h1 className="text-4xl font-semibold leading-[1.1] text-foreground mb-md">
                  {product.name}
                </h1>
                <p className="text-lg text-muted-foreground">{product.description}</p>
              </div>

              <div className="flex items-center gap-md pb-lg border-b border-border">
                <div className="flex gap-xs">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-5 h-5 ${i < Math.round(product.rating) ? "fill-primary" : "fill-border"}`} viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating} ({product.reviewCount} reviews)
                </span>
              </div>

              <div className="space-y-sm">
                <span className="text-4xl font-bold text-foreground">${product.price.toFixed(2)}</span>
                <p className="text-sm text-muted-foreground">
                  Sold by: <span className="font-medium text-foreground">{product.sellerName}</span>
                </p>
              </div>

              <div className="space-y-sm">
                <label className="block text-sm font-medium text-foreground">Select Size</label>
                <div className="grid grid-cols-4 gap-sm">
                  {product.sizes.map((sizeOption) => (
                    <button
                      key={sizeOption.size}
                      onClick={() => setSelectedSize(sizeOption.size)}
                      disabled={sizeOption.stock === 0}
                      className={`min-h-11 rounded-pill border font-medium transition ${
                        selectedSize === sizeOption.size
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-foreground hover:border-primary"
                      } ${sizeOption.stock === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {sizeOption.size}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSize && (
                <div className="space-y-sm">
                  <label className="block text-sm font-medium text-foreground">Quantity</label>
                  <div className="flex items-center gap-md">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-11 w-11 rounded-full border border-border hover:bg-secondary transition">-</button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={selectedSizeData?.stock || 1}
                      className="h-11 w-20 rounded-pill border border-border px-md text-center"
                    />
                    <button onClick={() => setQuantity(Math.min(selectedSizeData?.stock || 1, quantity + 1))} className="h-11 w-11 rounded-full border border-border hover:bg-secondary transition">+</button>
                    <span className="text-sm text-muted-foreground ml-auto">{selectedSizeData?.stock} available</span>
                  </div>
                </div>
              )}

              <div className="space-y-md pt-lg">
                <Button onClick={handleAddToCart} disabled={!selectedSize} className="w-full" size="lg">
                  {!isAuthenticated ? "Sign In to Buy" : "Add to Cart"}
                </Button>
              </div>

              {showNotification && (
                <div className="bg-primary/10 text-primary text-sm p-md rounded-md">
                  Added to cart!{" "}
                  <Link href="/cart" className="font-medium hover:underline">View cart</Link>
                </div>
              )}

              <div className="border-t border-border pt-lg space-y-md">
                <div>
                  <h3 className="font-medium text-foreground mb-sm">Free Shipping</h3>
                  <p className="text-sm text-muted-foreground">On orders over $50 to most locations</p>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-sm">Easy Returns</h3>
                  <p className="text-sm text-muted-foreground">30-day returns on all orders</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/dika/projects/multicompany && git add "fe/app/products/[id]/page.tsx"
git commit -m "feat(fe): replace mock product detail with API fetch by id"
```

---

## Task 5: FE — Seller Products Page (app/seller/products/page.tsx)

**Files:**
- Modify: `fe/app/seller/products/page.tsx`

- [ ] **Step 1: Ganti seluruh isi file**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";
import { Product } from "@/lib/types";
import * as api from "@/lib/api";

export default function SellerProductsPage() {
  const { user, canRender } = useSellerAccess();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) return;
    api.getSellerProducts(user.companyId).then((res) => {
      if (res.success && res.data) setProducts(res.data);
      setIsLoading(false);
    });
  }, [user?.companyId]);

  if (!canRender) return null;

  const totalStock = products.reduce(
    (sum, p) => sum + p.sizes.reduce((s, sz) => s + sz.stock, 0),
    0
  );

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="max-w-7xl mx-auto px-lg py-3xl">
          <div className="flex justify-between items-center mb-3xl">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-sm">My Products</h1>
              <p className="text-muted-foreground">Manage your product inventory and listings</p>
            </div>
            <Button asChild>
              <Link href="/seller/products/new">Add New Product</Link>
            </Button>
          </div>

          <div className="flex gap-lg border-b border-border mb-3xl">
            <Link href="/seller/dashboard" className="text-muted-foreground hover:text-foreground transition pb-md">Overview</Link>
            <Link href="/seller/products" className="text-foreground font-medium pb-md border-b-2 border-primary">Products</Link>
            <Link href="/seller/orders" className="text-muted-foreground hover:text-foreground transition pb-md">Orders</Link>
          </div>

          <div className="grid md:grid-cols-3 gap-lg mb-3xl">
            <div className="border border-border rounded-lg p-lg bg-secondary/30">
              <p className="text-sm text-muted-foreground mb-sm">Total Products</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : products.length}</p>
            </div>
            <div className="border border-border rounded-lg p-lg bg-secondary/30">
              <p className="text-sm text-muted-foreground mb-sm">Total Stock</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : totalStock}</p>
            </div>
            <div className="border border-border rounded-lg p-lg bg-secondary/30">
              <p className="text-sm text-muted-foreground mb-sm">Active Listings</p>
              <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : products.length}</p>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/30 px-lg py-md border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Products</h2>
            </div>
            {isLoading ? (
              <div className="p-lg space-y-md">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-border rounded animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="p-3xl text-center text-muted-foreground">
                No products yet.{" "}
                <Link href="/seller/products/new" className="text-primary hover:underline">Add your first product</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">Product Name</th>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">Category</th>
                      <th className="text-right px-lg py-md text-sm font-medium text-foreground">Price</th>
                      <th className="text-right px-lg py-md text-sm font-medium text-foreground">Stock</th>
                      <th className="text-center px-lg py-md text-sm font-medium text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => {
                      const stock = product.sizes.reduce((s, sz) => s + sz.stock, 0);
                      return (
                        <tr key={product.id} className={`border-b border-border hover:bg-secondary/20 transition ${index % 2 ? "bg-secondary/10" : ""}`}>
                          <td className="px-lg py-md text-sm font-medium text-foreground">
                            <Link href={`/products/${product.id}`} className="hover:text-primary transition">{product.name}</Link>
                          </td>
                          <td className="px-lg py-md text-sm text-muted-foreground">{product.category}</td>
                          <td className="px-lg py-md text-sm font-medium text-foreground text-right">${product.price.toFixed(2)}</td>
                          <td className="px-lg py-md text-sm font-medium text-right">
                            <span className={stock > 10 ? "text-primary" : stock > 0 ? "text-yellow-600" : "text-destructive"}>{stock}</span>
                          </td>
                          <td className="px-lg py-md text-sm text-center">
                            <div className="flex justify-center gap-sm">
                              <Link href={`/seller/products/${product.id}/edit`} className="text-primary hover:text-primary/80 transition font-medium">Edit</Link>
                              <button className="text-destructive hover:text-destructive/80 transition font-medium">Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/dika/projects/multicompany && git add fe/app/seller/products/page.tsx
git commit -m "feat(fe): replace mock seller products with API data"
```

---

## Task 6: FE — Seller Orders Page (app/seller/orders/page.tsx)

**Files:**
- Modify: `fe/app/seller/orders/page.tsx`

Catatan: BE `getSellerOrders()` mengembalikan array dengan shape: `{ id, buyerName, buyerEmail, status, total, date, items: [{productName, size, quantity, price, image}] }`.

- [ ] **Step 1: Ganti seluruh isi file**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";
import * as api from "@/lib/api";

interface SellerOrder {
  id: string;
  buyerName: string;
  buyerEmail: string;
  status: string;
  total: number;
  date: string;
  items: Array<{ productName: string; size: string; quantity: number; price: number; image: string }>;
}

type StatusFilter = "all" | "pending" | "paid" | "shipped" | "delivered" | "cancelled";

function getStatusColor(status: string) {
  switch (status) {
    case "delivered": return "bg-primary/10 text-primary";
    case "shipped": return "bg-blue-100 text-blue-700";
    case "paid": return "bg-green-100 text-green-700";
    case "pending": return "bg-gray-100 text-gray-700";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export default function SellerOrdersPage() {
  const { canRender } = useSellerAccess();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");

  useEffect(() => {
    api.getSellerOrders().then((res) => {
      if (res.success && res.data) setOrders(res.data as SellerOrder[]);
      setIsLoading(false);
    });
  }, []);

  if (!canRender) return null;

  const filtered = selectedStatus === "all"
    ? orders
    : orders.filter((o) => o.status === selectedStatus);

  const count = (s: string) => orders.filter((o) => o.status === s).length;

  const statusButtons: { label: string; value: StatusFilter; count: number }[] = [
    { label: "All Orders", value: "all", count: orders.length },
    { label: "Pending", value: "pending", count: count("pending") },
    { label: "Paid", value: "paid", count: count("paid") },
    { label: "Shipped", value: "shipped", count: count("shipped") },
    { label: "Delivered", value: "delivered", count: count("delivered") },
  ];

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="max-w-7xl mx-auto px-lg py-3xl">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-sm">Orders</h1>
            <p className="text-muted-foreground">Manage and track customer orders</p>
          </div>

          <div className="flex gap-lg border-b border-border my-3xl">
            <Link href="/seller/dashboard" className="text-muted-foreground hover:text-foreground transition pb-md">Overview</Link>
            <Link href="/seller/products" className="text-muted-foreground hover:text-foreground transition pb-md">Products</Link>
            <Link href="/seller/orders" className="text-foreground font-medium pb-md border-b-2 border-primary">Orders</Link>
          </div>

          <div className="flex gap-lg mb-3xl overflow-x-auto pb-sm">
            {statusButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setSelectedStatus(btn.value)}
                className={`border rounded-lg p-lg transition min-w-[120px] text-left ${
                  selectedStatus === btn.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary"
                }`}
              >
                <p className="text-sm text-muted-foreground mb-sm">{btn.label}</p>
                <p className="text-3xl font-bold text-foreground">{isLoading ? "—" : btn.count}</p>
              </button>
            ))}
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/30 px-lg py-md border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {selectedStatus === "all" ? "All Orders" : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
              </h2>
            </div>
            {isLoading ? (
              <div className="p-lg space-y-md">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-border rounded animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-3xl text-center text-muted-foreground">No orders found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">Order ID</th>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">Customer</th>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">Items</th>
                      <th className="text-right px-lg py-md text-sm font-medium text-foreground">Amount</th>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">Status</th>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">Date</th>
                      <th className="text-center px-lg py-md text-sm font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order, index) => {
                      const firstItem = order.items[0];
                      const itemLabel = firstItem
                        ? `${firstItem.productName}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}`
                        : "—";
                      const totalQty = order.items.reduce((s, i) => s + i.quantity, 0);

                      return (
                        <tr key={order.id} className={`border-b border-border hover:bg-secondary/20 transition ${index % 2 ? "bg-secondary/10" : ""}`}>
                          <td className="px-lg py-md text-sm font-medium text-primary">
                            <Link href={`/seller/orders/${order.id}`} className="hover:underline">
                              {order.id.slice(0, 8).toUpperCase()}
                            </Link>
                          </td>
                          <td className="px-lg py-md text-sm">
                            <p className="text-foreground font-medium">{order.buyerName}</p>
                            <p className="text-xs text-muted-foreground">{order.buyerEmail}</p>
                          </td>
                          <td className="px-lg py-md text-sm text-foreground">{itemLabel} × {totalQty}</td>
                          <td className="px-lg py-md text-sm font-medium text-foreground text-right">${order.total.toFixed(2)}</td>
                          <td className="px-lg py-md text-sm">
                            <span className={`px-md py-xs rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-lg py-md text-sm text-muted-foreground">
                            {new Date(order.date).toLocaleDateString()}
                          </td>
                          <td className="px-lg py-md text-center">
                            <Link href={`/seller/orders/${order.id}`} className="text-sm text-primary hover:text-primary/80 transition font-medium">View</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/dika/projects/multicompany && git add fe/app/seller/orders/page.tsx
git commit -m "feat(fe): replace mock seller orders with API data"
```

---

## Task 7: FE — Seller Dashboard Page (app/seller/dashboard/page.tsx)

**Files:**
- Modify: `fe/app/seller/dashboard/page.tsx`

- [ ] **Step 1: Ganti seluruh isi file**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";
import * as api from "@/lib/api";

interface SellerOrder {
  id: string;
  buyerName: string;
  status: string;
  total: number;
  date: string;
  items: Array<{ productName: string; quantity: number }>;
}

interface DashboardStats {
  totalProducts: number;
  orders: number;
  revenue: number;
}

function getStatusColor(status: string) {
  switch (status) {
    case "delivered": return "bg-primary/10 text-primary";
    case "shipped": return "bg-blue-100 text-blue-700";
    case "paid": return "bg-green-100 text-green-700";
    case "pending": return "bg-gray-100 text-gray-700";
    case "cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export default function SellerDashboardPage() {
  const { user, canRender } = useSellerAccess();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) return;

    Promise.all([
      api.getSellerProducts(user.companyId),
      api.getSellerOrders(),
    ]).then(([productsRes, ordersRes]) => {
      const products = productsRes.success && productsRes.data ? productsRes.data : [];
      const orders = ordersRes.success && ordersRes.data ? (ordersRes.data as SellerOrder[]) : [];

      const revenue = orders.reduce((sum, o) => sum + o.total, 0);

      setStats({
        totalProducts: products.length,
        orders: orders.length,
        revenue,
      });

      setRecentOrders(orders.slice(0, 5));
      setIsLoading(false);
    });
  }, [user?.companyId]);

  if (!canRender) return null;

  const statCards = stats
    ? [
        { label: "Total Products", value: stats.totalProducts },
        { label: "Total Orders", value: stats.orders },
        { label: "Revenue", value: `$${stats.revenue.toFixed(2)}` },
      ]
    : [
        { label: "Total Products", value: "—" },
        { label: "Total Orders", value: "—" },
        { label: "Revenue", value: "—" },
      ];

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="max-w-7xl mx-auto px-lg py-3xl">
          <div className="flex justify-between items-center mb-3xl">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-sm">Seller Dashboard</h1>
              <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
            <Button asChild>
              <Link href="/seller/products/new">Add New Product</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-lg mb-3xl">
            {statCards.map((stat, index) => (
              <div key={index} className="border border-border rounded-lg p-lg bg-secondary/30">
                <p className="text-sm text-muted-foreground mb-sm">{stat.label}</p>
                <p className={`text-3xl font-bold text-foreground ${isLoading ? "animate-pulse" : ""}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-lg border-b border-border mb-3xl">
            <Link href="/seller/dashboard" className="text-foreground font-medium pb-md border-b-2 border-primary">Overview</Link>
            <Link href="/seller/products" className="text-muted-foreground hover:text-foreground transition pb-md">Products</Link>
            <Link href="/seller/orders" className="text-muted-foreground hover:text-foreground transition pb-md">Orders</Link>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/30 px-lg py-md border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Recent Orders</h2>
            </div>
            {isLoading ? (
              <div className="p-lg space-y-md">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-border rounded animate-pulse" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-3xl text-center text-muted-foreground">No orders yet.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/30 border-b border-border">
                      <tr>
                        <th className="text-left px-lg py-md text-sm font-medium text-foreground">Order ID</th>
                        <th className="text-left px-lg py-md text-sm font-medium text-foreground">Customer</th>
                        <th className="text-left px-lg py-md text-sm font-medium text-foreground">Product</th>
                        <th className="text-right px-lg py-md text-sm font-medium text-foreground">Amount</th>
                        <th className="text-left px-lg py-md text-sm font-medium text-foreground">Status</th>
                        <th className="text-right px-lg py-md text-sm font-medium text-foreground">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, index) => {
                        const firstItem = order.items[0];
                        const itemLabel = firstItem
                          ? `${firstItem.productName}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ""}`
                          : "—";

                        return (
                          <tr key={order.id} className={`border-b border-border hover:bg-secondary/20 transition ${index % 2 ? "bg-secondary/10" : ""}`}>
                            <td className="px-lg py-md text-sm font-medium text-primary">
                              <Link href={`/seller/orders/${order.id}`} className="hover:underline">
                                {order.id.slice(0, 8).toUpperCase()}
                              </Link>
                            </td>
                            <td className="px-lg py-md text-sm text-foreground">{order.buyerName}</td>
                            <td className="px-lg py-md text-sm text-foreground">{itemLabel}</td>
                            <td className="px-lg py-md text-sm font-medium text-foreground text-right">${order.total.toFixed(2)}</td>
                            <td className="px-lg py-md text-sm">
                              <span className={`px-md py-xs rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-lg py-md text-sm text-muted-foreground text-right">
                              {new Date(order.date).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-lg py-md border-t border-border">
                  <Link href="/seller/orders" className="text-sm text-primary font-medium hover:underline">
                    View all orders →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /home/dika/projects/multicompany && git add fe/app/seller/dashboard/page.tsx
git commit -m "feat(fe): replace mock dashboard stats with real API data"
```

---

## Selesai — Verifikasi Akhir

- [ ] Pastikan BE jalan: `curl http://localhost:3001/products` mengembalikan array JSON dengan field `images`, `sellerId`, `sellerName`, `category` (string)
- [ ] Homepage menampilkan produk dari DB (kosong jika DB belum ada data)
- [ ] Product detail `/products/:id` fetch berdasarkan ID dari URL
- [ ] Seller products menampilkan produk milik company yang login
- [ ] Seller orders menampilkan order milik company yang login
- [ ] Seller dashboard menampilkan stats dihitung dari data real
