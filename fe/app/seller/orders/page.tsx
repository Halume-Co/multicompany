"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";
import { SellerOrder } from "@/lib/types";
import * as api from "@/lib/api";

type StatusFilter =
  | "all"
  | "pending"
  | "paid"
  | "shipped"
  | "delivered"
  | "cancelled";

function getStatusColor(status: string) {
  switch (status) {
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

export default function SellerOrdersPage() {
  const { canRender } = useSellerAccess();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");

  useEffect(() => {
    api.getSellerOrders().then((res) => {
      if (res.success && res.data) setOrders(res.data as SellerOrder[]);
      setIsLoading(false);
    });
  }, []);

  if (!canRender) return null;

  const filtered =
    selectedStatus === "all"
      ? orders
      : orders.filter((o) => o.status === selectedStatus);

  const count = (s: string) => orders.filter((o) => o.status === s).length;

  const statusButtons: { label: string; value: StatusFilter; count: number }[] =
    [
      { label: "All Orders", value: "all", count: orders.length },
      { label: "Pending", value: "pending", count: count("pending") },
      { label: "Paid", value: "paid", count: count("paid") },
      { label: "Shipped", value: "shipped", count: count("shipped") },
      { label: "Delivered", value: "delivered", count: count("delivered") },
    ];

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="max-w-7xl mx-auto px-lg py-3xl">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-sm">Orders</h1>
            <p className="text-muted-foreground">
              Manage and track customer orders
            </p>
          </div>

          <div className="flex gap-lg border-b border-border my-3xl">
            <Link
              href="/seller/dashboard"
              className="text-muted-foreground hover:text-foreground transition pb-md"
            >
              Overview
            </Link>
            <Link
              href="/seller/products"
              className="text-muted-foreground hover:text-foreground transition pb-md"
            >
              Products
            </Link>
            <Link
              href="/seller/orders"
              className="text-foreground font-medium pb-md border-b-2 border-primary"
            >
              Orders
            </Link>
          </div>

          <div className="flex gap-lg mb-3xl overflow-x-auto pb-sm">
            {statusButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setSelectedStatus(btn.value)}
                className={`border rounded-lg p-lg transition min-w-[120px] text-left ${
                  selectedStatus === btn.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary"
                }`}
              >
                <p className="text-sm text-muted-foreground mb-sm">{btn.label}</p>
                <p className="text-3xl font-bold text-foreground">
                  {isLoading ? "—" : btn.count}
                </p>
              </button>
            ))}
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/30 px-lg py-md border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                {selectedStatus === "all"
                  ? "All Orders"
                  : selectedStatus.charAt(0).toUpperCase() +
                    selectedStatus.slice(1)}
              </h2>
            </div>
            {isLoading ? (
              <div className="p-lg space-y-md">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-border rounded animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-3xl text-center text-muted-foreground">
                No orders found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/30 border-b border-border">
                    <tr>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">
                        Order ID
                      </th>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">
                        Customer
                      </th>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">
                        Items
                      </th>
                      <th className="text-right px-lg py-md text-sm font-medium text-foreground">
                        Amount
                      </th>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">
                        Status
                      </th>
                      <th className="text-left px-lg py-md text-sm font-medium text-foreground">
                        Date
                      </th>
                      <th className="text-center px-lg py-md text-sm font-medium text-foreground">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((order, index) => {
                      const firstItem = order.items[0];
                      const itemLabel = firstItem
                        ? `${firstItem.productName}${
                            order.items.length > 1
                              ? ` +${order.items.length - 1} more`
                              : ""
                          }`
                        : "—";
                      const totalQty = order.items.reduce(
                        (s, i) => s + i.quantity,
                        0,
                      );

                      return (
                        <tr
                          key={order.id}
                          className={`border-b border-border hover:bg-secondary/20 transition ${
                            index % 2 ? "bg-secondary/10" : ""
                          }`}
                        >
                          <td className="px-lg py-md text-sm font-medium text-primary">
                            <Link
                              href={`/seller/orders/${order.id}`}
                              className="hover:underline"
                            >
                              {order.id.slice(0, 8).toUpperCase()}
                            </Link>
                          </td>
                          <td className="px-lg py-md text-sm">
                            <p className="text-foreground font-medium">
                              {order.buyerName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.buyerEmail}
                            </p>
                          </td>
                          <td className="px-lg py-md text-sm text-foreground">
                            {itemLabel} × {totalQty}
                          </td>
                          <td className="px-lg py-md text-sm font-medium text-foreground text-right">
                            ${order.total.toFixed(2)}
                          </td>
                          <td className="px-lg py-md text-sm">
                            <span
                              className={`px-md py-xs rounded-full text-xs font-medium ${getStatusColor(
                                order.status,
                              )}`}
                            >
                              {order.status.charAt(0).toUpperCase() +
                                order.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-lg py-md text-sm text-muted-foreground">
                            {new Date(order.date).toLocaleDateString()}
                          </td>
                          <td className="px-lg py-md text-center">
                            <Link
                              href={`/seller/orders/${order.id}`}
                              className="text-sm text-primary hover:text-primary/80 transition font-medium"
                            >
                              View
                            </Link>
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
