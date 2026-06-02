"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";
import { SellerOrder } from "@/lib/types";
import * as api from "@/lib/api";

interface DashboardStats {
  totalProducts: number;
  orders: number;
  revenue: number;
}

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

export default function SellerDashboardPage() {
  const { user, canRender } = useSellerAccess();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) return;

    Promise.all([
      api.getSellerProducts(user.companyId),
      api.getSellerOrders(),
    ]).then(([productsRes, ordersRes]) => {
      const products =
        productsRes.success && productsRes.data ? productsRes.data : [];
      const orders =
        ordersRes.success && ordersRes.data
          ? (ordersRes.data as SellerOrder[])
          : [];

      const revenue = orders.reduce((sum, o) => sum + o.total, 0);

      setStats({
        totalProducts: products.length,
        orders: orders.length,
        revenue,
      });

      setRecentOrders(orders.slice(0, 5));
      setIsLoading(false);
    });
  }, [user?.companyId]);

  if (!canRender) return null;

  const statCards = stats
    ? [
        { label: "Total Products", value: stats.totalProducts },
        { label: "Total Orders", value: stats.orders },
        { label: "Revenue", value: `$${stats.revenue.toFixed(2)}` },
      ]
    : [
        { label: "Total Products", value: "—" },
        { label: "Total Orders", value: "—" },
        { label: "Revenue", value: "—" },
      ];

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="max-w-7xl mx-auto px-lg py-3xl">
          <div className="flex justify-between items-center mb-3xl">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-sm">
                Seller Dashboard
              </h1>
              <p className="text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
            <Button asChild>
              <Link href="/seller/products/new">Add New Product</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-lg mb-3xl">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-lg bg-secondary/30"
              >
                <p className="text-sm text-muted-foreground mb-sm">
                  {stat.label}
                </p>
                <p
                  className={`text-3xl font-bold text-foreground ${
                    isLoading ? "animate-pulse" : ""
                  }`}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex gap-lg border-b border-border mb-3xl">
            <Link
              href="/seller/dashboard"
              className="text-foreground font-medium pb-md border-b-2 border-primary"
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
              className="text-muted-foreground hover:text-foreground transition pb-md"
            >
              Orders
            </Link>
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary/30 px-lg py-md border-b border-border">
              <h2 className="text-lg font-bold text-foreground">
                Recent Orders
              </h2>
            </div>
            {isLoading ? (
              <div className="p-lg space-y-md">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 bg-border rounded animate-pulse" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="p-3xl text-center text-muted-foreground">
                No orders yet.
              </div>
            ) : (
              <>
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
                          Product
                        </th>
                        <th className="text-right px-lg py-md text-sm font-medium text-foreground">
                          Amount
                        </th>
                        <th className="text-left px-lg py-md text-sm font-medium text-foreground">
                          Status
                        </th>
                        <th className="text-right px-lg py-md text-sm font-medium text-foreground">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order, index) => {
                        const firstItem = order.items[0];
                        const itemLabel = firstItem
                          ? `${firstItem.productName}${
                              order.items.length > 1
                                ? ` +${order.items.length - 1} more`
                                : ""
                            }`
                          : "—";

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
                            <td className="px-lg py-md text-sm text-foreground">
                              {order.buyerName}
                            </td>
                            <td className="px-lg py-md text-sm text-foreground">
                              {itemLabel}
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
                            <td className="px-lg py-md text-sm text-muted-foreground text-right">
                              {new Date(order.date).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-lg py-md border-t border-border">
                  <Link
                    href="/seller/orders"
                    className="text-sm text-primary font-medium hover:underline"
                  >
                    View all orders →
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
