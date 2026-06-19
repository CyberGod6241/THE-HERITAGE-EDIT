"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  guestEmail: string | null;
  status: string;
  paymentStatus: string;
  totalCents: number;
  currency: string;
  shippingMethod: string | null;
  createdAt: string;
  items: Array<{ id: string; quantity: number; product: { name: string } }>;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-600",
  CONFIRMED: "bg-blue-50 text-blue-600",
  PROCESSING: "bg-indigo-50 text-indigo-600",
  SHIPPED: "bg-heritage-green/10 text-heritage-green",
  DELIVERED: "bg-green-50 text-green-600",
  CANCELLED: "bg-red-50 text-red-500",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-obsidian mb-1">Orders</h1>
        <p className="text-sm font-sans text-neutral-400">Manage and fulfill customer orders</p>
      </div>

      <div className="bg-white border border-slate-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-border bg-ivory/50">
              <th className="text-left px-4 py-3 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400">Order</th>
              <th className="text-left px-4 py-3 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400">Customer</th>
              <th className="text-left px-4 py-3 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400">Status</th>
              <th className="text-left px-4 py-3 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400">Total</th>
              <th className="text-left px-4 py-3 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-5 skeleton w-full" /></td></tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center text-sm font-sans text-neutral-400">
                  No orders yet. Orders will appear here once customers complete checkout.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-ivory/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-sans font-medium font-mono text-heritage-green">{order.orderNumber}</td>
                  <td className="px-4 py-3 text-sm font-sans text-obsidian/70">{order.guestEmail}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 text-[10px] font-sans font-semibold tracking-wider uppercase ${STATUS_STYLES[order.status] ?? ""}`}>{order.status}</span>
                  </td>
                  <td className="px-4 py-3 product-price text-sm">{formatPrice(order.totalCents, order.currency)}</td>
                  <td className="px-4 py-3 text-xs font-sans text-neutral-400">{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
