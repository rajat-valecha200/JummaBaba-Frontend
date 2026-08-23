import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | string): string {
  const amount = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)} K`;
  return n.toLocaleString();
}

// A broken/missing product image previously fell back to an external Unsplash URL — which
// can itself fail to load (no internet, blocked domain, slow network), leaving the same blank
// white box the fallback was supposed to fix. This is a self-contained inline SVG instead, so
// it always renders regardless of network conditions.
const PRODUCT_PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#F1F5F9"/><rect x="150" y="150" width="100" height="80" rx="8" fill="#CBD5E1"/><circle cx="175" cy="175" r="10" fill="#F1F5F9"/><path d="M150 215 L180 190 L200 205 L225 180 L250 210 L250 230 L150 230 Z" fill="#94A3B8"/><text x="200" y="270" font-family="sans-serif" font-size="16" fill="#94A3B8" text-anchor="middle">No Image</text></svg>`;
export const PRODUCT_IMAGE_PLACEHOLDER = `data:image/svg+xml,${encodeURIComponent(PRODUCT_PLACEHOLDER_SVG)}`;
