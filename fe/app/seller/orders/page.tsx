"use client";

import Link from "next/link";
import { useState } from "react";
import { Header } from "@/components/Header";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";

const mockOrders = [
  {
    id: "ORD001",
    buyerName: "John Smith",
    buyerEmail: "john@example.com",
    product: "Classic Air Max",
    quantity: 1,
    total: 129.99,
    status: "shipped" as const,
    date: "2024-12-15",
    trackingNumber: "TRACK123456",
  },
  {
    id: "ORD002",
    buyerName: "Sarah Johnson",
    buyerEmail: "sarah@example.com",
    product: "Urban Street Style",
    quantity: 2,
    total: 179.98,
    status: "processing" as const,
    date: "2024-12-14",
    trackingNumber: null,
  },
  {
    id: "ORD003",
    buyerName: "Mike Davis",
    buyerEmail: "mike@example.com",
    product: "Performance Court",
    quantity: 1,
    total: 149.99,
    status: "delivered" as const,
    date: "2024-12-13",
    trackingNumber: "TRACK123457",
  },
  {
    id: "ORD004",
    buyerName: "Emily Brown",
    buyerEmail: "emily@example.com",
    product: "Minimalist Slip-On",
    quantity: 3,
    total: 239.97,
    status: "pending" as const,
    date: "2024-12-12",
    trackingNumber: null,
  },
  {
    id: "ORD005",
    buyerName: "David Wilson",
    buyerEmail: "david@example.com",
    product: "Trail Blazer Pro",
    quantity: 1,
    total: 159.99,
    status: "shipped" as const,
    date: "2024-12-11",
    trackingNumber: "TRACK123458",
  },
];

type OrderStatus = "pending" | "processing" | "shipped" | "delivered";

export default function SellerOrdersPage() {
  const { canRender } = useSellerAccess();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "all">(
    "all"
  );

  if (!canRender) {
    return null;
  }

  const filteredOrders =
    selectedStatus === "all"
      ? mockOrders
      : mockOrders.filter((order) => order.status === selectedStatus);

  const statusStats = {
    pending: mockOrders.filter((o) => o.status === "pending").length,
    processing: mockOrders.filter((o) => o.status === "processing").length,
    shipped: mockOrders.filter((o) => o.status === "shipped").length,
    delivered: mockOrders.filter((o) => o.status === "delivered").length,
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "delivered":
        return "bg-primary/10 text-primary";
      case "shipped":
        return "bg-blue-100 text-blue-700";
      case "processing":
        return "bg-yellow-100 text-yellow-700";
      case "pending":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="max-w-7xl mx-auto px-lg py-3xl">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-sm">
              Orders
            </h1>
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

          <div className="grid md:grid-cols-4 gap-lg mb-3xl">
            <button
              onClick={() => setSelectedStatus("all")}
              className={`border rounded-lg p-lg transition ${
                selectedStatus === "all"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary"
              }`}
            >
              <p className="text-sm text-muted-foreground mb-sm">All Orders</p>
              <p className="text-3xl font-bold text-foreground">
                {mockOrders.length}
              </p>
            </button>
            <button
              onClick={() => setSelectedStatus("pending")}
              className={`border rounded-lg p-lg transition ${
                selectedStatus === "pending"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary"
              }`}
            >
              <p className="text-sm text-muted-foreground mb-sm">Pending</p>
              <p className="text-3xl font-bold text-foreground">
                {statusStats.pending}
              </p>
            </button>
            <button
              onClick={() => setSelectedStatus("processing")}
              className={`border rounded-lg p-lg transition ${
                selectedStatus === "processing"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary"
              }`}
            >
              <p className="text-sm text-muted-foreground mb-sm">Processing</p>
              <p className="text-3xl font-bold text-foreground">
                {statusStats.processing}
              </p>
            </button>
            <button
              onClick={() => setSelectedStatus("shipped")}
              className={`border rounded-lg p-lg transition ${
                selectedStatus === "shipped"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary"
              }`}
            >
              <p className="text-sm text-muted-foreground mb-sm">Shipped</p>
              <p className="text-3xl font-bold text-foreground">
                {statusStats.shipped}
              </p>
            </button>
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
                    <th className="text-left px-lg py-md text-sm font-medium text-foreground">
                      Date
                    </th>
                    <th className="text-center px-lg py-md text-sm font-medium text-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => (
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
                      <td className="px-lg py-md text-sm">
                        <div>
                          <p className="text-foreground font-medium">
                            {order.buyerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.buyerEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-lg py-md text-sm text-foreground">
                        {order.product} x {order.quantity}
                      </td>
                      <td className="px-lg py-md text-sm font-medium text-foreground text-right">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="px-lg py-md text-sm">
                        <span
                          className={`px-md py-xs rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-lg py-md text-sm text-muted-foreground">
                        {order.date}
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
