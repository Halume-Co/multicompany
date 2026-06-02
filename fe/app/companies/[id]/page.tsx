"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Company, Product } from "@/lib/types";
import * as api from "@/lib/api";

export default function CompanyStorePage() {
  const params = useParams();
  const id = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    
    Promise.all([
      api.getCompany(id),
      api.getProducts({ companyId: id })
    ]).then(([companyRes, productsRes]) => {
      if (companyRes.success && companyRes.data) {
        setCompany(companyRes.data);
      } else {
        setError("Company not found.");
      }

      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }
      
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-lg py-3xl">
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </>
    );
  }

  if (error || !company) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-lg py-3xl text-center">
          <p className="text-muted-foreground mb-lg">{error || "Store not found."}</p>
          <Button asChild variant="outline">
            <Link href="/">Back to Marketplace</Link>
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        {/* Store Header Banner */}
        <section className="bg-secondary/30 border-b border-border">
          <div className="max-w-7xl mx-auto px-lg py-2xl flex flex-col md:flex-row items-center gap-xl">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-white border-2 border-primary/20 shadow-sm flex-shrink-0">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-muted-foreground">
                  {company.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-foreground mb-sm">{company.name}</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">{company.description || "Official storefront for premium footwear."}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-md mt-lg">
                <div className="bg-background px-md py-sm rounded-md border border-border text-sm">
                  <span className="font-bold text-primary">{products.length}</span> Products
                </div>
                <div className="bg-background px-md py-sm rounded-md border border-border text-sm">
                  Official Partner
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section className="max-w-7xl mx-auto px-lg py-3xl">
          <div className="flex justify-between items-center mb-2xl">
            <h2 className="text-2xl font-bold text-foreground">Our Products</h2>
            <div className="text-sm text-muted-foreground">
              Showing all {products.length} products
            </div>
          </div>

          {products.length === 0 ? (
            <div className="py-2xl text-center border border-dashed border-border rounded-lg bg-secondary/10">
              <p className="text-muted-foreground">This store has no products listed yet.</p>
              <Button asChild variant="link" className="mt-md">
                <Link href="/">Browse other stores</Link>
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
    </>
  );
}
