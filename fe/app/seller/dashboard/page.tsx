"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";

const mockStats = {
  totalProducts: 24,
  activeListings: 18,
  orders: 156,
  revenue: 12450.5,
};

const mockRecentOrders = [
  {
    id: "ORD001",
    buyerName: "John Smith",
    product: "Classic Air Max",
    quantity: 1,
    total: 129.99,
    status: "shipped" as const,
    date: "2024-12-15",
  },
  {
    id: "ORD002",
    buyerName: "Sarah Johnson",
    product: "Urban Street Style",
    quantity: 2,
    total: 179.98,
    status: "processing" as const,
    date: "2024-12-14",
  },
  {
    id: "ORD003",
    buyerName: "Mike Davis",
    product: "Performance Court",
    quantity: 1,
    total: 149.99,
    status: "delivered" as const,
    date: "2024-12-13",
  },
  {
    id: "ORD004",
    buyerName: "Emily Brown",
    product: "Minimalist Slip-On",
    quantity: 3,
    total: 239.97,
    status: "pending" as const,
    date: "2024-12-12",
  },
];

export default function SellerDashboardPage() {
  const { user, canRender } = useSellerAccess();

  if (!canRender) {
    return null;
  }

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
              <p className="text-muted-foreground">
                Welcome back, {user?.name}
              </p>
            </div>
            <Button asChild>
              <Link href="/seller/products/new">Add New Product</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-4 gap-lg mb-3xl">
            {[
              { label: "Total Products", value: mockStats.totalProducts },
              { label: "Active Listings", value: mockStats.activeListings },
              { label: "Orders", value: mockStats.orders },
              {
                label: "Revenue",
                value: `$${mockStats.revenue.toFixed(2)}`,
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="border border-border rounded-lg p-lg bg-secondary/30"
              >
                <p className="text-sm text-muted-foreground mb-sm">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-foreground">
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
                  {mockRecentOrders.map((order, index) => (
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
                          {order.id}
                        </Link>
                      </td>
                      <td className="px-lg py-md text-sm text-foreground">
                        {order.buyerName}
                      </td>
                      <td className="px-lg py-md text-sm text-foreground">
                        {order.product}
                      </td>
                      <td className="px-lg py-md text-sm font-medium text-foreground text-right">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-lg py-md text-sm">
                        <span
                          className={`px-md py-xs rounded-full text-xs font-medium ${
                            order.status === "delivered"
                              ? "bg-primary/10 text-primary"
                              : order.status === "shipped"
                                ? "bg-blue-100 text-blue-700"
                                : order.status === "processing"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-lg py-md text-sm text-muted-foreground text-right">
                        {order.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-lg py-md border-t border-border">
              <Link
                href="/seller/orders"
                className="text-sm text-primary font-medium hover:underline"
              >
                View all orders{" ->"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
