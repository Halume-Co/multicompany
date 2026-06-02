"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";
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

export default function SellerProductsPage() {
  const { canRender } = useSellerAccess();

  if (!canRender) {
    return null;
  }

  const totalStock = mockProducts.reduce(
    (sum, product) =>
      sum + product.sizes.reduce((sizeTotal, size) => sizeTotal + size.stock, 0),
    0
  );

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="max-w-7xl mx-auto px-lg py-3xl">
          <div className="flex justify-between items-center mb-3xl">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-sm">
                My Products
              </h1>
              <p className="text-muted-foreground">
                Manage your product inventory and listings
              </p>
            </div>
            <Button asChild>
              <Link href="/seller/products/new">Add New Product</Link>
            </Button>
          </div>

          <div className="flex gap-lg border-b border-border mb-3xl">
            <Link
              href="/seller/dashboard"
              className="text-muted-foreground hover:text-foreground transition pb-md"
            >
              Overview
            </Link>
            <Link
              href="/seller/products"
              className="text-foreground font-medium pb-md border-b-2 border-primary"
            >
              Products
            </Link>
            <Link
              href="/seller/orders"
              className="text-muted-foreground hover:text-foreground transition pb-md"
            >
              Orders
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-lg mb-3xl">
            <div className="border border-border rounded-lg p-lg bg-secondary/30">
              <p className="text-sm text-muted-foreground mb-sm">
                Total Products
              </p>
              <p className="text-3xl font-bold text-foreground">
                {mockProducts.length}
              </p>
            </div>
            <div className="border border-border rounded-lg p-lg bg-secondary/30">
              <p className="text-sm text-muted-foreground mb-sm">
                Total Stock
              </p>
              <p className="text-3xl font-bold text-foreground">{totalStock}</p>
            </div>
            <div className="border border-border rounded-lg p-lg bg-secondary/30">
              <p className="text-sm text-muted-foreground mb-sm">
                Average Rating
              </p>
              <p className="text-3xl font-bold text-foreground">4.5</p>
            </div>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/30 px-lg py-md border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Products</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/30 border-b border-border">
                  <tr>
                    <th className="text-left px-lg py-md text-sm font-medium text-foreground">
                      Product Name
                    </th>
                    <th className="text-left px-lg py-md text-sm font-medium text-foreground">
                      Category
                    </th>
                    <th className="text-right px-lg py-md text-sm font-medium text-foreground">
                      Price
                    </th>
                    <th className="text-right px-lg py-md text-sm font-medium text-foreground">
                      Stock
                    </th>
                    <th className="text-left px-lg py-md text-sm font-medium text-foreground">
                      Rating
                    </th>
                    <th className="text-center px-lg py-md text-sm font-medium text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockProducts.map((product, index) => {
                    const productStock = product.sizes.reduce(
                      (sum, size) => sum + size.stock,
                      0
                    );

                    return (
                      <tr
                        key={product.id}
                        className={`border-b border-border hover:bg-secondary/20 transition ${
                          index % 2 ? "bg-secondary/10" : ""
                        }`}
                      >
                        <td className="px-lg py-md text-sm font-medium text-foreground">
                          <Link
                            href={`/products/${product.id}`}
                            className="hover:text-primary transition"
                          >
                            {product.name}
                          </Link>
                        </td>
                        <td className="px-lg py-md text-sm text-muted-foreground">
                          {product.category}
                        </td>
                        <td className="px-lg py-md text-sm font-medium text-foreground text-right">
                          ${product.price.toFixed(2)}
                        </td>
                        <td className="px-lg py-md text-sm font-medium text-foreground text-right">
                          <span
                            className={
                              productStock > 10
                                ? "text-primary"
                                : productStock > 0
                                  ? "text-yellow-600"
                                  : "text-destructive"
                            }
                          >
                            {productStock}
                          </span>
                        </td>
                        <td className="px-lg py-md text-sm text-foreground">
                          <div className="flex items-center gap-xs">
                            {Array.from({ length: 5 }).map((_, ratingIndex) => (
                              <svg
                                key={ratingIndex}
                                className={`w-4 h-4 ${
                                  ratingIndex < Math.round(product.rating)
                                    ? "fill-primary"
                                    : "fill-border"
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                              </svg>
                            ))}
                          </div>
                        </td>
                        <td className="px-lg py-md text-sm text-center">
                          <div className="flex justify-center gap-sm">
                            <Link
                              href={`/seller/products/${product.id}/edit`}
                              className="text-primary hover:text-primary/80 transition font-medium"
                            >
                              Edit
                            </Link>
                            <button className="text-destructive hover:text-destructive/80 transition font-medium">
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
          </div>
        </div>
      </main>
    </>
  );
}
