"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/contexts/CartContext";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    router.push("/checkout");
  };

  return (
    <>
      <Header />
      <main className="bg-background">
        {/* Breadcrumb */}
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-lg py-lg">
            <div className="flex items-center gap-sm text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition">
                Shop
              </Link>
              <span>/</span>
              <span className="text-foreground">Shopping Cart</span>
            </div>
          </div>
        </div>

        {/* Cart Content */}
        <section className="max-w-7xl mx-auto px-lg py-3xl">
          {cart.items.length === 0 ? (
            <div className="text-center py-3xl">
              <h1 className="text-3xl font-bold text-foreground mb-md">
                Your cart is empty
              </h1>
              <p className="text-muted-foreground mb-2xl">
                Continue shopping to find your perfect pair
              </p>
              <Button asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-2xl lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-lg">
                <h1 className="text-3xl font-semibold tracking-[-0.374px] text-foreground">
                  Shopping Cart
                </h1>

                <div className="space-y-md">
                  {cart.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.size}`}
                      className="grid gap-lg rounded-lg border border-border bg-card p-lg sm:grid-cols-[96px_minmax(0,1fr)_120px]"
                    >
                      <div className="h-24 w-24 overflow-hidden rounded-sm bg-secondary">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.productId}`}
                          className="text-base font-semibold text-foreground hover:text-primary transition"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-xs">
                          Size: <span className="font-medium">{item.size}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          by {item.product.sellerName}
                        </p>
                        <p className="text-lg font-bold text-foreground mt-md">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-md sm:flex-col sm:items-end">
                        <button
                          onClick={() =>
                            removeFromCart(item.productId, item.size)
                          }
                          className="text-sm text-foreground hover:text-primary transition"
                        >
                          Remove
                        </button>

                        <div className="flex h-9 items-center overflow-hidden rounded-pill border border-border bg-background">
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.quantity - 1
                              )
                            }
                            className="h-full px-md hover:bg-secondary transition"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.size,
                                item.quantity + 1
                              )
                            }
                            className="h-full px-md hover:bg-secondary transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:sticky lg:top-24 h-fit rounded-lg border border-border bg-card p-lg">
                <h2 className="text-xl font-bold text-foreground mb-lg">
                  Order Summary
                </h2>

                <div className="space-y-sm mb-lg pb-lg border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-medium">
                      ${cart.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (10%)</span>
                    <span className="text-foreground font-medium">
                      ${cart.tax.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between mb-lg">
                  <span className="text-lg font-bold text-foreground">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    ${cart.total.toFixed(2)}
                  </span>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full mb-md"
                  size="lg"
                >
                  {isAuthenticated ? "Proceed to Checkout" : "Sign in to Checkout"}
                </Button>

                <Link href="/">
                  <button className="w-full py-sm border border-border rounded-md text-foreground hover:bg-secondary transition">
                    Continue Shopping
                  </button>
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
