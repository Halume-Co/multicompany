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
                <div className="h-4 bg-border rounded animate-pulse w-1/4" />
                <div className="h-10 bg-border rounded animate-pulse" />
                <div className="h-6 bg-border rounded animate-pulse w-2/3" />
                <div className="h-6 bg-border rounded animate-pulse w-1/3" />
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
                  <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
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
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-11 w-11 rounded-full border border-border hover:bg-secondary transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max={selectedSizeData?.stock || 1}
                      className="h-11 w-20 rounded-pill border border-border px-md text-center"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedSizeData?.stock || 1, quantity + 1))}
                      className="h-11 w-11 rounded-full border border-border hover:bg-secondary transition"
                    >
                      +
                    </button>
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
