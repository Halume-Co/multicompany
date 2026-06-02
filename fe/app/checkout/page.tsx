"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useCart } from "@/lib/contexts/CartContext";
import { ShippingAddress } from "@/lib/types";

import * as api from "@/lib/api";

export default function CheckoutPage() {
  const { cart, clearCart, isLoading: isCartLoading } = useCart();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"shipping" | "payment" | "confirmation">(
    "shipping"
  );
  const [orderId, setOrderId] = useState<string | null>(null);
  const [shippingData, setShippingData] = useState<ShippingAddress>({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
  });
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const isShippingComplete = step === "payment" || step === "confirmation";
  const isPaymentComplete = step === "confirmation";

  useEffect(() => {
    if (user) {
      setShippingData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name,
        email: prev.email || user.email,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isAuthLoading || isCartLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (cart.items.length === 0 && step !== "confirmation") {
      router.replace("/cart");
    }
  }, [cart.items.length, isAuthenticated, isAuthLoading, isCartLoading, router, step]);

  if (isAuthLoading || isCartLoading) {
    return (
      <>
        <Header />
        <main className="bg-background">
          <section className="max-w-7xl mx-auto px-lg py-3xl">
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </section>
        </main>
      </>
    );
  }

  if (!isAuthenticated || (cart.items.length === 0 && step !== "confirmation")) {
    return null;
  }

  const handleShippingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setShippingData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !shippingData.fullName ||
      !shippingData.email ||
      !shippingData.phone ||
      !shippingData.street ||
      !shippingData.city ||
      !shippingData.state ||
      !shippingData.zipCode
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setStep("payment");
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const res = await api.createOrder({
        notes: `Shipping to: ${shippingData.fullName}, ${shippingData.street}, ${shippingData.city}`,
      });

      if (res.success && res.data) {
        // Store order details for the success page
        sessionStorage.setItem("lastOrder", JSON.stringify({
          grandTotal: res.data.grandTotal,
          orders: res.data.orders
        }));
        
        clearCart();
        router.push("/checkout/success");
      } else {
        alert("Checkout failed: " + (res.error || "Unknown error"));
      }
    } catch (error) {
      alert("Payment failed. Please try again.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-lg py-lg">
            <div className="flex items-center gap-sm text-sm text-muted-foreground">
              <Link href="/" className="hover:text-primary transition">
                Shop
              </Link>
              <span>/</span>
              <Link href="/cart" className="hover:text-primary transition">
                Cart
              </Link>
              <span>/</span>
              <span className="text-foreground">Checkout</span>
            </div>
          </div>
        </div>

        {step === "confirmation" ? (
          <section className="max-w-2xl mx-auto px-lg py-3xl text-center">
            <div className="mb-lg">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-lg">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-md">
                Order Confirmed!
              </h1>
              <p className="text-lg text-muted-foreground mb-lg">
                Thank you for your purchase. Your order has been placed
                successfully.
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-lg mb-2xl space-y-md">
              <div className="border-b border-border pb-md">
                <p className="text-sm text-muted-foreground mb-sm">
                  Order Number
                </p>
                <p className="text-xl font-bold text-foreground">
                  #{Math.floor(Math.random() * 1000000)}
                </p>
              </div>
              <div className="border-b border-border pb-md">
                <p className="text-sm text-muted-foreground mb-sm">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-primary">
                  ${cart.total.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-sm">
                  Estimated Delivery
                </p>
                <p className="text-foreground">5-7 business days</p>
              </div>
            </div>

            <Button asChild className="mb-md">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </section>
        ) : (
          <section className="max-w-4xl mx-auto px-lg py-3xl">
            <h1 className="text-3xl font-bold text-foreground mb-3xl">
              Checkout
            </h1>

            <div className="grid lg:grid-cols-3 gap-3xl">
              <div className="lg:col-span-2 space-y-3xl">
                <div className="flex gap-md mb-2xl">
                  <div className="flex-1 h-2 rounded-full bg-primary" />
                  <div
                    className={`flex-1 h-2 rounded-full ${
                      isShippingComplete ? "bg-primary" : "bg-border"
                    }`}
                  />
                  <div
                    className={`flex-1 h-2 rounded-full ${
                      isPaymentComplete ? "bg-primary" : "bg-border"
                    }`}
                  />
                </div>

                {step === "shipping" && (
                  <form onSubmit={handleShippingSubmit} className="space-y-lg">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-lg">
                        Shipping Address
                      </h2>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-lg">
                      <div>
                        <label className="block text-sm font-medium mb-sm">
                          Full Name
                        </label>
                        <Input
                          name="fullName"
                          value={shippingData.fullName}
                          onChange={handleShippingChange}
                          placeholder="John Doe"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-sm">
                          Email
                        </label>
                        <Input
                          name="email"
                          type="email"
                          value={shippingData.email}
                          onChange={handleShippingChange}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-sm">
                          Phone
                        </label>
                        <Input
                          name="phone"
                          value={shippingData.phone}
                          onChange={handleShippingChange}
                          placeholder="+1 (555) 000-0000"
                          required
                        />
                      </div>
                      <div />
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-sm">
                          Street Address
                        </label>
                        <Input
                          name="street"
                          value={shippingData.street}
                          onChange={handleShippingChange}
                          placeholder="123 Main St"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-sm">
                          City
                        </label>
                        <Input
                          name="city"
                          value={shippingData.city}
                          onChange={handleShippingChange}
                          placeholder="New York"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-sm">
                          State
                        </label>
                        <Input
                          name="state"
                          value={shippingData.state}
                          onChange={handleShippingChange}
                          placeholder="NY"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-sm">
                          ZIP Code
                        </label>
                        <Input
                          name="zipCode"
                          value={shippingData.zipCode}
                          onChange={handleShippingChange}
                          placeholder="10001"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-sm">
                          Country
                        </label>
                        <select
                          name="country"
                          value={shippingData.country}
                          onChange={handleShippingChange}
                          className="w-full px-md py-sm border border-border rounded-md bg-background text-foreground"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="MX">Mexico</option>
                        </select>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      Continue to Payment
                    </Button>
                  </form>
                )}

                {step === "payment" && (
                  <form onSubmit={handlePaymentSubmit} className="space-y-lg">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground mb-lg">
                        Payment Method
                      </h2>
                    </div>

                    <div className="space-y-md">
                      <label className="flex items-center p-lg border border-border rounded-lg cursor-pointer hover:bg-secondary transition">
                        <input
                          type="radio"
                          name="payment"
                          value="card"
                          checked={paymentMethod === "card"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-md"
                        />
                        <span className="font-medium">Credit Card</span>
                      </label>
                      <label className="flex items-center p-lg border border-border rounded-lg cursor-pointer hover:bg-secondary transition">
                        <input
                          type="radio"
                          name="payment"
                          value="paypal"
                          checked={paymentMethod === "paypal"}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="mr-md"
                        />
                        <span className="font-medium">PayPal</span>
                      </label>
                    </div>

                    {paymentMethod === "card" && (
                      <div className="space-y-lg">
                        <div>
                          <label className="block text-sm font-medium mb-sm">
                            Card Number
                          </label>
                          <Input
                            placeholder="1234 5678 9012 3456"
                            required
                          />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-lg">
                          <div>
                            <label className="block text-sm font-medium mb-sm">
                              Expiry Date
                            </label>
                            <Input placeholder="MM/YY" required />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-sm">
                              CVV
                            </label>
                            <Input placeholder="123" required />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-md">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("shipping")}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isProcessing}
                        className="flex-1"
                        size="lg"
                      >
                        {isProcessing ? "Processing..." : "Place Order"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              <div className="lg:sticky lg:top-24 h-fit border border-border rounded-lg p-lg bg-secondary/30">
                <h2 className="text-lg font-bold text-foreground mb-lg">
                  Order Summary
                </h2>

                <div className="space-y-md mb-lg pb-lg border-b border-border max-h-64 overflow-y-auto">
                  {cart.items.map((item) => (
                    <div
                      key={`${item.productId}-${item.size}`}
                      className="flex justify-between text-sm"
                    >
                      <div className="text-muted-foreground">
                        <p>
                          {item.product.name} x {item.quantity}
                        </p>
                        <p className="text-xs">Size: {item.size}</p>
                      </div>
                      <p className="font-medium text-foreground">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-sm mb-lg pb-lg border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-medium">
                      ${cart.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span className="text-foreground font-medium">
                      ${cart.tax.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-lg font-bold text-foreground">
                    Total
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    ${cart.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
