import 'server-only';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  products, categories, farmers, testimonials, faqItems, siteInfo,
  type ProductRow, type CategoryRow, type FarmerRow,
  type TestimonialRow, type FaqRow, type SiteInfoRow,
} from '@/db/schema';

export type Product = ProductRow;
export type Category = CategoryRow;
export type Farmer = FarmerRow;
export type Testimonial = TestimonialRow;
export type FAQItem = FaqRow;
export type SiteInfo = SiteInfoRow;

export async function getAllProducts() {
  return db.select().from(products).orderBy(asc(products.name));
}
export async function getProduct(id: string) {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] ?? null;
}
export async function getProductsByCategory(categoryId: string) {
  return db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(asc(products.name));
}
export async function getFeaturedProducts(limit = 8) {
  return db.select().from(products).where(eq(products.featured, true)).limit(limit);
}
export async function getAllCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
}
export async function getCategory(id: string) {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0] ?? null;
}
export async function getAllFarmers() {
  return db.select().from(farmers).orderBy(asc(farmers.name));
}
export async function getFarmer(id: string | null) {
  if (!id) return null;
  const rows = await db.select().from(farmers).where(eq(farmers.id, id)).limit(1);
  return rows[0] ?? null;
}
export async function getProductsByFarmer(farmerId: string) {
  return db.select().from(products).where(eq(products.farmerId, farmerId)).orderBy(asc(products.name));
}
export async function getAllTestimonials() {
  return db.select().from(testimonials).orderBy(asc(testimonials.sortOrder), asc(testimonials.id));
}
export async function getAllFaqItems() {
  return db.select().from(faqItems).orderBy(asc(faqItems.sortOrder), asc(faqItems.id));
}
export async function getSiteInfo(): Promise<SiteInfoRow> {
  const rows = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  if (!rows[0]) throw new Error('site_info row missing — run npm run db:seed');
  return rows[0];
}

export { formatPrice } from './format';
