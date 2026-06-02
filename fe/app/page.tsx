"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Product } from "@/lib/types";
import * as api from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function HomeContent() {
  const { isAuthenticated, user } = useAuth();
  const searchParams = useSearchParams();
  const search = searchParams.get("search") || "";
  
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    api.getProducts({ search }).then((res) => {
      if (res.success && res.data) setProducts(res.data);
      setIsLoading(false);
    });
  }, [search]);

  return (
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
            {search ? "Search Results" : "Featured Styles"}
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.374px] text-foreground">
            {search ? `Showing results for "${search}"` : "Explore the current showcase"}
          </h2>
          <p className="mt-md text-base text-muted-foreground">
            {search 
              ? `Found ${products.length} product(s) matching your search.`
              : "Product browsing is public. Checkout and seller tools use secure sessions."}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-xl md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-lg bg-border animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-2xl text-center">
            <p className="text-xl font-medium text-foreground">No products found.</p>
            <p className="text-muted-foreground mt-sm">Try searching for something else or browse all products.</p>
            <Button asChild variant="outline" className="mt-lg">
              <Link href="/">Clear Search</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-xl md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main className="bg-background">
          <div className="max-w-7xl mx-auto px-lg py-3xl h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      }>
        <HomeContent />
      </Suspense>
    </>
  );
}
