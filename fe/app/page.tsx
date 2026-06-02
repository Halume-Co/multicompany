"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Product } from "@/lib/types";

const mockProducts: Product[] = [
  {
    id: "1",
    name: "Classic Air Max",
    description: "Timeless design with maximum comfort",
    price: 129.99,
    images: ["/api/placeholder?type=product&id=1"],
    sizes: [
      { size: "7", stock: 5 },
      { size: "8", stock: 8 },
    ],
    sellerId: "seller1",
    sellerName: "Nike Store",
    category: "Running",
    rating: 4.5,
    reviewCount: 328,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Urban Street Style",
    description: "Perfect for casual everyday wear",
    price: 89.99,
    images: ["/api/placeholder?type=product&id=2"],
    sizes: [
      { size: "7", stock: 3 },
      { size: "8", stock: 10 },
    ],
    sellerId: "seller1",
    sellerName: "Nike Store",
    category: "Casual",
    rating: 4.2,
    reviewCount: 156,
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Performance Court",
    description: "Engineered for athletes",
    price: 149.99,
    images: ["/api/placeholder?type=product&id=3"],
    sizes: [
      { size: "7", stock: 6 },
      { size: "8", stock: 9 },
    ],
    sellerId: "seller1",
    sellerName: "Nike Store",
    category: "Basketball",
    rating: 4.8,
    reviewCount: 512,
    createdAt: new Date().toISOString(),
  },
];

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

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
                    <Link
                      href={
                        user.companyId
                          ? "/seller/dashboard"
                          : "/seller/company"
                      }
                    >
                      {user.companyId
                        ? "Open Seller Dashboard"
                        : "Finish Seller Setup"}
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
              {mockProducts.slice(0, 2).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-lg py-3xl">
          <div className="mb-xl max-w-3xl">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground mb-sm">
                Featured Styles
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.374px] text-foreground">
                Explore the current showcase
              </h2>
            </div>
            <p className="mt-md text-base text-muted-foreground">
              Product browsing is public. Checkout and seller tools use secure
              sessions.
            </p>
          </div>

          <div className="grid gap-xl md:grid-cols-2 xl:grid-cols-3">
            {mockProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
