"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";
import { SellerOrder } from "@/lib/types";
import * as api from "@/lib/api";

const statusOptions = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"];

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

export default function SellerOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { canRender } = useSellerAccess();
  
  const [order, setOrder] = useState<SellerOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getOrder(id).then((res) => {
      if (res.success && res.data) {
        // The getOrder might return Order shape, but we need SellerOrder mapping or vice versa
        // Actually api.getOrder returns Promise<ApiResponse<Order>>.
        // Let's cast or handle the shape.
        setOrder(res.data as unknown as SellerOrder);
      } else {
        alert("Order not found");
        router.push("/seller/orders");
      }
      setIsLoading(false);
    });
  }, [id, router]);

  if (!canRender || isLoading) {
    return (
      <>
        <Header />
        <main className="bg-background min-h-screen py-3xl text-center">
          <p className="text-muted-foreground animate-pulse">Loading order details...</p>
        </main>
      </>
    );
  }

  if (!order) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const res = await api.updateOrderStatus(order.id, newStatus);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        alert("Failed to update status: " + (res.error || "Unknown error"));
      }
    } catch (error) {
      alert("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-background min-h-screen">
        <div className="max-w-4xl mx-auto px-lg py-3xl">
          <div className="mb-3xl flex justify-between items-start">
            <div>
              <Link href="/seller/orders" className="text-primary hover:underline text-sm mb-md inline-block">
                ← Back to Orders
              </Link>
              <h1 className="text-4xl font-bold text-foreground mb-sm">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-muted-foreground">
                Placed on {new Date(order.date).toLocaleString()}
              </p>
            </div>
            <div className={`px-lg py-md rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_300px] gap-xl">
            <div className="space-y-xl">
              <div className="border border-border rounded-lg overflow-hidden bg-card">
                <div className="bg-secondary/30 px-lg py-md border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">Order Items</h2>
                </div>
                <div className="divide-y divide-border">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="p-lg flex gap-lg">
                      <div className="h-20 w-20 bg-secondary rounded overflow-hidden flex-shrink-0">
                        <img src={item.image || "/placeholder.jpg"} alt={item.productName} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                        <p className="text-sm text-foreground">{item.quantity} × ${item.price.toFixed(2)}</p>
                      </div>
                      <p className="font-bold text-foreground">${(item.quantity * item.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="p-lg bg-secondary/10 border-t border-border flex justify-between items-center">
                  <p className="text-lg font-bold text-foreground">Total</p>
                  <p className="text-2xl font-bold text-primary">${order.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="border border-border rounded-lg bg-card p-lg">
                <h2 className="text-lg font-bold text-foreground mb-md">Customer Information</h2>
                <div className="grid sm:grid-cols-2 gap-md text-sm">
                  <div>
                    <p className="text-muted-foreground mb-xs">Name</p>
                    <p className="font-medium text-foreground">{order.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-xs">Email</p>
                    <p className="font-medium text-foreground">{order.buyerEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-lg">
              <div className="border border-border rounded-lg bg-card p-lg">
                <h2 className="text-lg font-bold text-foreground mb-md">Update Status</h2>
                <div className="flex flex-col gap-sm">
                  {statusOptions.map(opt => (
                    <Button
                      key={opt}
                      variant={order.status.toUpperCase() === opt ? "default" : "outline"}
                      onClick={() => handleStatusUpdate(opt)}
                      disabled={isUpdating || order.status.toUpperCase() === opt}
                      className="justify-start"
                      size="sm"
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
                {isUpdating && <p className="text-xs text-muted-foreground mt-md animate-pulse">Updating status...</p>}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
