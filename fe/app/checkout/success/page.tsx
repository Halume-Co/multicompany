"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { SellerOrder } from "@/lib/types";

export default function CheckoutSuccessPage() {
  const [orderData, setOrderData] = useState<{
    grandTotal: number;
    orders: SellerOrder[];
  } | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem("lastOrder");
    if (storedData) {
      try {
        setOrderData(JSON.parse(storedData));
        // Clear it after reading so it doesn't persist forever
        // sessionStorage.removeItem("lastOrder"); 
      } catch (e) {
        console.error("Failed to parse order data", e);
      }
    }
  }, []);

  if (!orderData) {
    return (
      <>
        <Header />
        <main className="max-w-7xl mx-auto px-lg py-3xl text-center">
          <h1 className="text-2xl font-bold mb-md">No order found</h1>
          <Button asChild>
            <Link href="/">Back to Shop</Link>
          </Button>
        </main>
      </>
    );
  }

  const { grandTotal, orders } = orderData;

  return (
    <>
      <Header />
      <main className="bg-secondary/20 min-h-screen pb-3xl">
        <div className="max-w-3xl mx-auto px-lg py-3xl">
          {/* Success Banner */}
          <div className="bg-white rounded-lg p-3xl text-center shadow-sm mb-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-xl text-green-600">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-sm">Payment Successful!</h1>
            <p className="text-muted-foreground mb-2xl">
              Thank you for your purchase. Your order has been placed successfully and is being processed.
            </p>
            <div className="flex flex-wrap gap-md justify-center">
              <Button asChild variant="outline">
                <Link href="/orders">View My Orders</Link>
              </Button>
              <Button asChild>
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </div>

          {/* Order Receipt / Invoice Section */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden print:shadow-none">
            <div className="bg-primary px-lg py-md text-primary-foreground flex justify-between items-center">
              <h2 className="font-bold text-lg">Order Receipt</h2>
              <button 
                onClick={() => window.print()}
                className="text-sm bg-white/20 hover:bg-white/30 px-md py-xs rounded transition flex items-center gap-xs"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Receipt
              </button>
            </div>

            <div className="p-lg md:p-2xl space-y-2xl">
              {/* Header Info */}
              <div className="flex flex-col md:flex-row justify-between gap-xl pb-xl border-b border-border">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-xs">Date</p>
                  <p className="font-bold">{new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-xs">Payment Method</p>
                  <p className="font-bold">Credit Card / Online Payment</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-xs">Status</p>
                  <p className="font-bold text-green-600">PAID</p>
                </div>
              </div>

              {/* Items per Company (Shopee Style splitting) */}
              <div className="space-y-2xl">
                {orders.map((order) => (
                  <div key={order.id} className="space-y-lg">
                    <div className="flex items-center gap-sm">
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 3L4 9v12h16V9l-8-6zm0 2.5L18 10v9H6v-9l6-4.5z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-foreground">Seller: {order.items[0]?.productName ? "Official Store" : order.id.slice(0, 8)}</h3>
                    </div>

                    <div className="space-y-md">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-lg">
                          <div className="w-16 h-16 rounded border border-border overflow-hidden bg-secondary shrink-0">
                            <img src={item.image || "/placeholder.jpg"} alt={item.productName} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-foreground truncate">{item.productName}</p>
                            <p className="text-sm text-muted-foreground">Size: {item.size} × {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-md border-t border-dashed border-border">
                      <p className="text-sm">Store Subtotal: <span className="font-bold ml-md">${order.total.toFixed(2)}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="bg-secondary/30 rounded-lg p-xl space-y-md">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Merchandise Subtotal</span>
                  <span className="font-medium text-foreground">${grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping Fee</span>
                  <span className="font-medium text-foreground text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (Included)</span>
                  <span className="font-medium text-foreground">$0.00</span>
                </div>
                <div className="flex justify-between pt-lg border-t border-border">
                  <span className="text-xl font-bold text-foreground">Total Payment</span>
                  <span className="text-2xl font-bold text-primary">${grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-xl">
                <p className="text-xs text-muted-foreground">This is a system-generated receipt. No signature required.</p>
                <p className="text-xs text-muted-foreground mt-xs">Shoe Marketplace Inc. - Multi-Company Platform</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
