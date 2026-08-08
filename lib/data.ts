import 'server-only';
import { cache } from 'react';
import { eq, asc, desc, inArray, and, isNull, isNotNull, gt } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  products, productImages, productReviews, categories, farmers, testimonials, faqItems, siteInfo,
  valueProps, certificates, catalogs, catalogImages, deliverySlots, paymentMethods, contactTopics, orderStatuses, menuItems,
  heroSlides, theme,
  type ProductRow, type ProductReviewRow, type CategoryRow, type FarmerRow,
  type TestimonialRow, type FaqRow, type SiteInfoRow,
  type ValuePropRow, type DeliverySlotRow, type PaymentMethodRow, type ContactTopicRow,
  type HeroSlideRow,
  type OrderStatusRow,
} from '@/db/schema';
import { DEFAULT_THEME, type ThemeConfig } from './theme';
import { buildMenuTree, type MenuNode } from '@/lib/menu';

export type Product = ProductRow;
export type ProductReview = ProductReviewRow;
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
/** Customer reviews are private to one product and use admin-configured order. */
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  return db.select().from(productReviews)
    .where(eq(productReviews.productId, productId))
    .orderBy(asc(productReviews.sortOrder), asc(productReviews.id));
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
// Cached per request: read by the public layout and again by most page bodies.
export const getAllCategories = cache(async () =>
  db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)));

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
/**
 * Trả về cây, không phải danh sách phẳng: menu nhiều cấp, và dựng cây ngay tại
 * đây để mọi nơi hiển thị menu đều thấy cùng một cấu trúc, cùng một thứ tự.
 */
export async function getMenu(location: 'header' | 'footer'): Promise<MenuNode[]> {
  const rows = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.location, location))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
  return buildMenuTree(rows);
}
export const getCategory = cache(async (id: string) => {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0] ?? null;
});
// Cached per request: two `farmers` blocks on one page would otherwise re-query.
export const getAllFarmers = cache(async () => {
  // Re-sort by name in JS with the Vietnamese locale: the DB is en_US-collated,
  // which folds Đ→D and so orders "Đào" before "Dưa" — wrong, since Đ is a
  // distinct letter that sorts after D. localeCompare('vi') gets it right, and
  // (unlike a DB COLLATE) doesn't depend on the external DB having ICU. The
  // public /farmers page renders this order directly.
  const rows = await db.select().from(farmers);
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
});
// Cached per request: ProductCard resolves the farmer for every card, so a
// listing of N products that share a handful of farmers collapses to one query
// per distinct farmer instead of one per card.
export const getFarmer = cache(async (id: string | null) => {
  if (!id) return null;
  const rows = await db.select().from(farmers).where(eq(farmers.id, id)).limit(1);
  return rows[0] ?? null;
});
/**
 * Batch lookup for a grid of ProductCards: one `IN` query for every distinct
 * farmer instead of a query per card (the caller passes each product's
 * farmerId and looks the result up by id when rendering).
 */
export async function getFarmersByIds(ids: (string | null)[]): Promise<Map<string, FarmerRow>> {
  const uniqueIds = [...new Set(ids.filter((id): id is string => id !== null))];
  if (uniqueIds.length === 0) return new Map();
  const rows = await db.select().from(farmers).where(inArray(farmers.id, uniqueIds));
  return new Map(rows.map((f) => [f.id, f]));
}
export async function getProductsByFarmer(farmerId: string) {
  return db.select().from(products).where(eq(products.farmerId, farmerId)).orderBy(asc(products.name));
}
export const getAllTestimonials = cache(async () =>
  db.select().from(testimonials).orderBy(asc(testimonials.sortOrder), asc(testimonials.id)));
// Cached per request: trang chủ và trang Chứng nhận có thể cùng đặt hai khối.
export const getAllCertificates = cache(async () =>
  db.select().from(certificates).orderBy(asc(certificates.sortOrder), asc(certificates.id)));
/**
 * Catalog kèm danh sách trang, gộp trong hai truy vấn thay vì một truy vấn mỗi
 * catalog. Catalog chưa có trang nào bị bỏ qua: thẻ lấy ảnh đầu làm bìa, không
 * có trang thì thẻ sẽ là một ô ảnh vỡ.
 */
export const getAllCatalogs = cache(async () => {
  const [rows, pages] = await Promise.all([
    db.select().from(catalogs).where(eq(catalogs.visible, true))
      .orderBy(asc(catalogs.sortOrder), asc(catalogs.id)),
    db.select({ catalogId: catalogImages.catalogId, url: catalogImages.url })
      .from(catalogImages)
      .orderBy(asc(catalogImages.catalogId), asc(catalogImages.sortOrder), asc(catalogImages.id)),
  ]);
  const byCatalog = new Map<number, string[]>();
  for (const p of pages) {
    const arr = byCatalog.get(p.catalogId) ?? [];
    arr.push(p.url);
    byCatalog.set(p.catalogId, arr);
  }
  return rows
    .map((r) => ({ id: r.id, name: r.name, description: r.description, pages: byCatalog.get(r.id) ?? [] }))
    .filter((c) => c.pages.length > 0);
});

export const getAllFaqItems = cache(async () =>
  db.select().from(faqItems).orderBy(asc(faqItems.sortOrder), asc(faqItems.id)));

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

/**
 * Site theme (single row id=1); falls back to defaults before it is saved.
 * The root layout renders this on every page, so it must survive the DB being
 * unavailable — notably during `next build`, where a page that isn't forced
 * dynamic gets prerendered with no database reachable. On any connection error
 * we return DEFAULT_THEME so the build (and a transient DB blip) degrades to the
 * default look instead of crashing the whole render.
 */
export const getTheme = cache(async (): Promise<ThemeConfig> => {
  let r;
  try {
    const rows = await db.select().from(theme).where(eq(theme.id, 1)).limit(1);
    r = rows[0];
  } catch {
    return DEFAULT_THEME;
  }
  if (!r) return DEFAULT_THEME;
  return {
    brandColor: r.brandColor,
    accentColor: r.accentColor,
    radiusScale: r.radiusScale,
    fontBody: r.fontBody,
    fontHeading: r.fontHeading,
  };
});

export const getActiveHeroSlides = cache((): Promise<HeroSlideRow[]> =>
  db.select().from(heroSlides)
    .where(eq(heroSlides.active, true))
    .orderBy(asc(heroSlides.sortOrder), asc(heroSlides.id)));
export const getAllValueProps = cache((): Promise<ValuePropRow[]> =>
  db.select().from(valueProps).orderBy(asc(valueProps.sortOrder), asc(valueProps.id)));
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
