"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Order } from "@/lib/types";
import * as api from "@/lib/api";

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-primary/10 text-primary";
    case "shipped":
      return "bg-blue-100 text-blue-700";
    case "paid":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-gray-100 text-gray-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function UserOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.getUserOrders().then((res) => {
      if (res.success && res.data) {
        setOrders(res.data);
      }
      setIsLoading(false);
    });
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <>
        <Header />
        <main className="bg-background min-h-screen py-3xl text-center">
          <p className="text-muted-foreground">Please sign in to view your orders.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-5xl mx-auto px-lg py-3xl">
          <div className="mb-3xl">
            <h1 className="text-4xl font-bold text-foreground mb-sm">My Orders</h1>
            <p className="text-muted-foreground">Track and manage your purchases</p>
          </div>

          {isLoading ? (
            <div className="space-y-md">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-3xl border border-dashed border-border rounded-lg bg-secondary/20">
              <p className="text-muted-foreground mb-lg">You haven't placed any orders yet.</p>
              <Button asChild>
                <Link href="/">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-lg">
              {orders.map((order) => (
                <div key={order.id} className="border border-border rounded-lg overflow-hidden bg-card">
                  <div className="bg-secondary/30 px-lg py-md border-b border-border flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Order ID</p>
                      <p className="text-sm font-medium text-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div className={`px-md py-xs rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="p-lg flex flex-col sm:flex-row justify-between gap-lg">
                    <div className="flex-1 space-y-md">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex gap-md">
                          <div className="h-12 w-12 bg-secondary rounded overflow-hidden flex-shrink-0">
                            <img src={item.image || "/placeholder.jpg"} alt={item.productName} className="h-full w-full object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity} • Size: {item.size}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="sm:text-right flex flex-col justify-between items-end">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Amount</p>
                        <p className="text-xl font-bold text-primary">${order.total.toFixed(2)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-md">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

// Re-using local components to keep it standalone
function Button({ children, asChild, className, ...props }: any) {
  const Comp = asChild ? "span" : "button";
  return (
    <Comp
      className={`inline-flex items-center justify-center rounded-md bg-primary px-lg py-md text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:pointer-events-none disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
