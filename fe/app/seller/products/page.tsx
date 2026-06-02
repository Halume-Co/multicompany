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

  const handleDelete = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      const res = await api.deleteProduct(productId);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      } else {
        alert("Failed to delete product: " + (res.error || "Unknown error"));
      }
    } catch (error) {
      alert("An unexpected error occurred");
      console.error(error);
    }
  };

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
                <Link href="/seller/products/new" className="text-primary hover:underline">
                  Add your first product
                </Link>
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
                        <tr
                          key={product.id}
                          className={`border-b border-border hover:bg-secondary/20 transition ${index % 2 ? "bg-secondary/10" : ""}`}
                        >
                          <td className="px-lg py-md text-sm font-medium text-foreground">
                            <Link href={`/products/${product.id}`} className="hover:text-primary transition">
                              {product.name}
                            </Link>
                          </td>
                          <td className="px-lg py-md text-sm text-muted-foreground">{product.category}</td>
                          <td className="px-lg py-md text-sm font-medium text-foreground text-right">
                            ${product.price.toFixed(2)}
                          </td>
                          <td className="px-lg py-md text-sm font-medium text-right">
                            <span className={stock > 10 ? "text-primary" : stock > 0 ? "text-yellow-600" : "text-destructive"}>
                              {stock}
                            </span>
                          </td>
                          <td className="px-lg py-md text-sm text-center">
                            <div className="flex justify-center gap-sm">
                              <Link
                                href={`/seller/products/${product.id}/edit`}
                                className="text-primary hover:text-primary/80 transition font-medium"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(product.id, product.name)}
                                className="text-destructive hover:text-destructive/80 transition font-medium"
                              >
                                Delete
                              </button>
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
