import 'server-only';
import { cache } from 'react';
import { eq, asc, desc, inArray, and, isNull, isNotNull, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  products, productImages, categories, farmers, testimonials, faqItems, siteInfo,
  valueProps, deliverySlots, paymentMethods, contactTopics, orderStatuses, menuItems,
  homeSections, heroSlides, theme,
  type ProductRow, type CategoryRow, type FarmerRow,
  type TestimonialRow, type FaqRow, type SiteInfoRow,
  type ValuePropRow, type DeliverySlotRow, type PaymentMethodRow, type ContactTopicRow,
  type HeroSlideRow,
  type OrderStatusRow,
} from '@/db/schema';
import {
  HOME_SECTIONS, DEFAULT_ORDER,
  type HomeSectionKey, type HomeSectionState,
} from './home-sections';
import { DEFAULT_THEME, type ThemeConfig } from './theme';

export type Product = ProductRow;
export type Category = CategoryRow;
export type Farmer = FarmerRow;
export type Testimonial = TestimonialRow;
export type FAQItem = FaqRow;
export type SiteInfo = SiteInfoRow;

export async function getAllProducts() {
  return db.select().from(products).orderBy(asc(products.name));
}
// Cached per request: the product detail page reads it in both generateMetadata
// and the page body.
export const getProduct = cache(async (id: string) => {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] ?? null;
});
/** Extra gallery shots, in display order. `products.image` is the primary one. */
export async function getProductGallery(productId: string): Promise<string[]> {
  const rows = await db.select({ url: productImages.url }).from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id));
  return rows.map((r) => r.url);
}
export async function getProductsByCategory(categoryId: string) {
  return db.select().from(products).where(eq(products.categoryId, categoryId)).orderBy(asc(products.name));
}
export async function getProductsByCategoryDeep(categoryIds: string[]) {
  if (categoryIds.length === 0) return [];
  return db
    .select()
    .from(products)
    .where(inArray(products.categoryId, categoryIds))
    .orderBy(asc(products.name));
}
export async function getFeaturedProducts(limit = 8) {
  return db.select().from(products).where(eq(products.featured, true)).limit(limit);
}
export async function getAllCategories() {
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
}

/**
 * Products for a page-builder "products" block, chosen by its configured source.
 * `manual` keeps the admin's picked order; the SQL `IN` returns rows in an
 * arbitrary order, so we re-sort by the id list.
 */
export async function getProductsForBlock(opts: {
  source: 'featured' | 'category' | 'manual' | 'latest' | 'sale';
  categoryId: string;
  productIds: string[];
  limit: number;
}) {
  const limit = Math.min(Math.max(opts.limit, 1), 12);
  switch (opts.source) {
    case 'category':
      if (!opts.categoryId) return [];
      return db.select().from(products).where(eq(products.categoryId, opts.categoryId))
        .orderBy(asc(products.name)).limit(limit);
    case 'manual': {
      if (opts.productIds.length === 0) return [];
      const rows = await db.select().from(products).where(inArray(products.id, opts.productIds));
      const rank = new Map(opts.productIds.map((id, i) => [id, i]));
      // The hand-picked list *is* the content — show all of it, not `limit`.
      return rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    }
    case 'latest':
      return db.select().from(products).orderBy(desc(products.createdAt)).limit(limit);
    case 'sale':
      return db.select().from(products)
        .where(and(isNotNull(products.oldPrice), gt(products.oldPrice, products.price)))
        .orderBy(asc(products.name)).limit(limit);
    case 'featured':
    default:
      return db.select().from(products).where(eq(products.featured, true)).limit(limit);
  }
}

/**
 * Categories for a page-builder "categories" block. `all` lists root categories
 * (optionally capped); `manual` lists the picked ids in the admin's order.
 */
export async function getCategoriesForBlock(opts: {
  source: 'all' | 'manual';
  categoryIds: string[];
  limit: number;
}) {
  if (opts.source === 'manual') {
    if (opts.categoryIds.length === 0) return [];
    const rows = await db.select().from(categories).where(inArray(categories.id, opts.categoryIds));
    const rank = new Map(opts.categoryIds.map((id, i) => [id, i]));
    return rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  }
  const rows = await db.select().from(categories).where(isNull(categories.parentId))
    .orderBy(asc(categories.sortOrder), asc(categories.name));
  return opts.limit > 0 ? rows.slice(0, opts.limit) : rows;
}
export async function getMenu(location: 'header' | 'footer') {
  return db
    .select()
    .from(menuItems)
    .where(eq(menuItems.location, location))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
}
export const getCategory = cache(async (id: string) => {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0] ?? null;
});
export async function getAllFarmers() {
  return db.select().from(farmers).orderBy(asc(farmers.name));
}
// Cached per request: ProductCard resolves the farmer for every card, so a
// listing of N products that share a handful of farmers collapses to one query
// per distinct farmer instead of one per card.
export const getFarmer = cache(async (id: string | null) => {
  if (!id) return null;
  const rows = await db.select().from(farmers).where(eq(farmers.id, id)).limit(1);
  return rows[0] ?? null;
});
export async function getProductsByFarmer(farmerId: string) {
  return db.select().from(products).where(eq(products.farmerId, farmerId)).orderBy(asc(products.name));
}
export async function getAllTestimonials() {
  return db.select().from(testimonials).orderBy(asc(testimonials.sortOrder), asc(testimonials.id));
}
export async function getAllFaqItems() {
  return db.select().from(faqItems).orderBy(asc(faqItems.sortOrder), asc(faqItems.id));
}
/**
 * Every known homepage section in stored order. Sections missing from the
 * database (a fresh install, or one added in a later release) are appended as
 * visible, so the homepage never silently loses a section just because nobody
 * has opened the admin screen yet.
 */
export async function getHomeSectionOrder(): Promise<HomeSectionState[]> {
  const rows = await db.select().from(homeSections)
    .orderBy(asc(homeSections.sortOrder), asc(homeSections.key));

  const stored = new Set(rows.map((r) => r.key));
  const known = rows
    .filter((r) => r.key in HOME_SECTIONS)
    .map((r) => ({ key: r.key as HomeSectionKey, visible: r.visible }));
  const missing = DEFAULT_ORDER
    .filter((k) => !stored.has(k))
    .map((k) => ({ key: k, visible: true }));

  return [...known, ...missing];
}

/**
 * Cached per request: nearly every page reads site info, and generateMetadata
 * runs separately from the page render, so without this each request pays for
 * the same row twice.
 */
export const getSiteInfo = cache(async (): Promise<SiteInfoRow> => {
  const rows = await db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1);
  if (!rows[0]) throw new Error('site_info row missing — run npm run db:seed');
  return rows[0];
});

/** Site theme (single row id=1); falls back to defaults before it is saved. */
export const getTheme = cache(async (): Promise<ThemeConfig> => {
  const rows = await db.select().from(theme).where(eq(theme.id, 1)).limit(1);
  const r = rows[0];
  if (!r) return DEFAULT_THEME;
  return {
    brandColor: r.brandColor,
    accentColor: r.accentColor,
    radiusScale: r.radiusScale,
    fontBody: r.fontBody,
    fontHeading: r.fontHeading,
  };
});

export async function getActiveHeroSlides(): Promise<HeroSlideRow[]> {
  return db.select().from(heroSlides)
    .where(eq(heroSlides.active, true))
    .orderBy(asc(heroSlides.sortOrder), asc(heroSlides.id));
}
export async function getAllValueProps(): Promise<ValuePropRow[]> {
  return db.select().from(valueProps).orderBy(asc(valueProps.sortOrder), asc(valueProps.id));
}
export async function getActiveDeliverySlots(): Promise<DeliverySlotRow[]> {
  return db.select().from(deliverySlots)
    .where(eq(deliverySlots.active, true))
    .orderBy(asc(deliverySlots.sortOrder), asc(deliverySlots.id));
}
export async function getActivePaymentMethods(): Promise<PaymentMethodRow[]> {
  return db.select().from(paymentMethods)
    .where(eq(paymentMethods.active, true))
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.id));
}
export async function getAllContactTopics(): Promise<ContactTopicRow[]> {
  return db.select().from(contactTopics).orderBy(asc(contactTopics.sortOrder), asc(contactTopics.id));
}
export async function getAllOrderStatuses(): Promise<OrderStatusRow[]> {
  return db.select().from(orderStatuses).orderBy(asc(orderStatuses.sortOrder), asc(orderStatuses.key));
}
export async function getOrderStatusMap(): Promise<Record<string, OrderStatusRow>> {
  const rows = await getAllOrderStatuses();
  return Object.fromEntries(rows.map((r) => [r.key, r]));
}

export { formatPrice } from './format';
