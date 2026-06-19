"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Eye, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-neutral-100 text-neutral-500" },
  AI_PENDING: { label: "AI Generating", className: "bg-amber-50 text-amber-600" },
  AI_REVIEW: { label: "AI Review", className: "bg-heritage-purple/10 text-heritage-purple" },
  PUBLISHED: { label: "Published", className: "bg-heritage-green/10 text-heritage-green" },
  ARCHIVED: { label: "Archived", className: "bg-neutral-100 text-neutral-400" },
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products?pageSize=50")
      .then((res) => res.json())
      .then((data) => setProducts(data.data ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-serif text-obsidian mb-1">Products</h1>
          <p className="text-sm font-sans text-neutral-400">Manage your luxury product catalog</p>
        </div>
        <Link href="/admin/products/new" className="luxury-button-primary gap-2">
          <Plus size={16} />
          Add Product
        </Link>
      </div>

      <div className="bg-white border border-slate-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-border bg-ivory/50">
              <th className="text-left px-4 py-3 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400">Product</th>
              <th className="text-left px-4 py-3 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400">SKU</th>
              <th className="text-left px-4 py-3 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400">Price</th>
              <th className="text-left px-4 py-3 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400">Status</th>
              <th className="text-left px-4 py-3 text-[10px] font-sans font-semibold tracking-[0.15em] uppercase text-neutral-400">Heritage</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-border">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-5 skeleton w-full" /></td></tr>
                ))
              : products.map((product) => {
                  const badge = STATUS_BADGES[product.status];
                  return (
                    <tr key={product.id} className="group hover:bg-ivory/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-12 bg-ivory shrink-0">
                            {product.images[0] && <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <p className="text-sm font-sans font-medium text-obsidian">{product.name}</p>
                            <p className="text-xs font-sans text-neutral-400">{product.brand.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-sans text-neutral-500 font-mono">{product.sku}</td>
                      <td className="px-4 py-3 product-price text-sm">{formatPrice(product.basePriceCents)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-sans font-semibold tracking-wider uppercase ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {product.heritage ? <Sparkles size={14} className={product.heritage.isApproved ? "text-heritage-green" : "text-amber-400"} /> : <span className="text-xs text-neutral-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/product/${product.slug}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye size={14} className="text-neutral-400 hover:text-heritage-green" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
