import productsJson from "@/data/products.json";
import categoriesJson from "@/data/categories.json";
import farmersJson from "@/data/farmers.json";
import testimonialsJson from "@/data/testimonials.json";
import faqJson from "@/data/faq.json";
import infoJson from "@/data/info.json";

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  oldPrice?: number;
  image: string;
  farmerId: string | null;
  description: string;
  tags: string[];
  featured: boolean;
  inStock: boolean;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export type Farmer = {
  id: string;
  name: string;
  farm: string;
  location: string;
  years: number;
  specialty: string;
  avatar: string;
  cover: string;
  story: string;
  certifications: string[];
};

export type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  content: string;
};

export type FAQItem = { q: string; a: string };
export type Info = typeof infoJson;

export const products: Product[] = productsJson as Product[];
export const categories: Category[] = categoriesJson as Category[];
export const farmers: Farmer[] = farmersJson as Farmer[];
export const testimonials: Testimonial[] = testimonialsJson as Testimonial[];
export const faqItems: FAQItem[] = faqJson as FAQItem[];
export const info: Info = infoJson;

export function getProduct(id: string) {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(categoryId: string) {
  return products.filter((p) => p.category === categoryId);
}

export function getFeaturedProducts(limit = 8) {
  return products.filter((p) => p.featured).slice(0, limit);
}

export function getCategory(id: string) {
  return categories.find((c) => c.id === id);
}

export function getFarmer(id: string | null) {
  if (!id) return null;
  return farmers.find((f) => f.id === id) ?? null;
}

export function getProductsByFarmer(farmerId: string) {
  return products.filter((p) => p.farmerId === farmerId);
}

export function formatPrice(v: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);
}
