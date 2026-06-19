import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatPriceCompact(cents: number, currency = "USD"): string {
  const value = cents / 100;
  if (value >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return formatPrice(cents, currency);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HE-${timestamp}-${random}`;
}

export function generateSKU(brand: string, category: string): string {
  const b = brand.substring(0, 3).toUpperCase();
  const c = category.substring(0, 3).toUpperCase();
  const n = Math.random().toString().substring(2, 8);
  return `${b}-${c}-${n}`;
}

export function getImagePlaceholder(width: number, height: number): string {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'%3E%3Crect fill='%23FBFBFA' width='${width}' height='${height}'/%3E%3C/svg%3E`;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + "…";
}

export function calculateDutyRate(country: string): number {
  const dutyRates: Record<string, number> = {
    US: 0, GB: 0.2, DE: 0.19, FR: 0.2, IT: 0.22, JP: 0.1, AU: 0.1,
    CA: 0.05, AE: 0.05, SG: 0.07, CH: 0.077, CN: 0.13, KR: 0.1, BR: 0.45, IN: 0.18,
  };
  return dutyRates[country] ?? 0.15;
}

export function calculateTaxRate(country: string, state?: string): number {
  if (country === "US") {
    const stateTax: Record<string, number> = {
      CA: 0.0725, NY: 0.08, TX: 0.0625, FL: 0.06, IL: 0.0625, WA: 0.065, NJ: 0.06625,
    };
    return stateTax[state ?? ""] ?? 0.05;
  }
  return 0;
}
