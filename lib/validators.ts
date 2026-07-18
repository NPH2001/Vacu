import { z } from 'zod';
import { safeHrefField, isSafeHref } from './safe-url';
// Side-effect import: installs the global Vietnamese error map so every schema
// below produces admin-friendly messages instead of Zod's English defaults.
import './zod-vi';

const slug = z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Đường dẫn chỉ gồm chữ thường, số và gạch ngang');
const url = z.string().min(1).max(500);
const optUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v && v.length ? v : null))
  .nullable();

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

const optParentSlug = z
  .string()
  .trim()
  .max(80)
  .optional()
  .transform((v) => (v && v.length ? v : null))
  .nullable();

export const categorySchema = z.object({
  id: slug,
  parentId: optParentSlug,
  name: z.string().min(1).max(120),
  // icon is either a short emoji string or an image URL/path — relaxed max length.
  icon: z.string().min(1).max(500),
  description: z.string().min(1).max(300),
  coverImage: optUrl,
  sortOrder: z.coerce.number().int().default(0),
});

export const farmerSchema = z.object({
  id: slug,
  name: z.string().min(1).max(120),
  farm: z.string().min(1).max(120),
  location: z.string().min(1).max(120),
  years: z.coerce.number().int().min(0).max(100),
  specialty: z.string().min(1).max(200),
  avatar: url,
  cover: url,
  story: z.string().min(1).max(2000),
  certifications: z.array(z.string()).default([]),
});

export const productSchema = z.object({
  id: slug,
  name: z.string().min(1, 'Vui lòng nhập tên sản phẩm').max(200),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục').regex(/^[a-z0-9-]+$/, 'Vui lòng chọn danh mục'),
  unit: z.string().min(1, 'Vui lòng nhập đơn vị bán').max(60),
  price: z.coerce.number({ message: 'Vui lòng nhập giá bán' }).int().positive('Giá bán phải lớn hơn 0'),
  oldPrice: z.coerce.number().int().positive().optional().nullable(),
  image: z.string().min(1, 'Vui lòng chọn ảnh đại diện cho sản phẩm').max(500),
  farmerId: slug.optional().nullable(),
  description: z.string().min(1, 'Vui lòng nhập mô tả ngắn').max(2000),
  // Rich-text HTML from the editor (sanitized server-side before storage).
  // Roomier than the old Markdown cap since HTML carries its own markup.
  body: z.string().max(200000).default(''),
  tags: z.array(z.string()).default([]),
  featured: z.coerce.boolean().default(false),
  inStock: z.coerce.boolean().default(true),
  // Extra gallery images; products.image remains the primary thumbnail.
  gallery: z.array(url).max(12).default([]),
}).refine(
  // oldPrice is the struck-through "was" price, so it must be ABOVE the live
  // price — otherwise the card shows a crossed-out number lower than what's
  // charged, reading as if the price went up.
  (d) => d.oldPrice == null || d.oldPrice > d.price,
  { message: 'Giá gốc phải lớn hơn giá bán.', path: ['oldPrice'] },
);

export const postCategorySchema = z.object({
  id: slug,
  name: z.string().min(1).max(120),
  description: z.string().max(300).default(''),
  sortOrder: z.coerce.number().int().default(0),
});

/**
 * `publishedAt` arrives as a full ISO string with offset (the form converts the
 * admin's local datetime-local value before submitting), so scheduling means
 * the same instant regardless of the server's timezone.
 */
const publishedAt = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), 'Thời gian đăng không hợp lệ');

export const postSchema = z.object({
  id: slug,
  title: z.string().min(1).max(200),
  excerpt: z.string().max(500).default(''),
  coverImage: optUrl,
  contentHtml: z.string().max(200000).default(''),
  categoryId: optParentSlug,
  status: z.enum(['draft', 'published']).default('draft'),
  publishedAt,
  featured: z.coerce.boolean().default(false),
  tags: z.array(z.string().min(1).max(60)).max(12).default([]),
  metaTitle: z.string().max(200).default(''),
  metaDescription: z.string().max(300).default(''),
});

export const testimonialSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  avatar: url,
  content: z.string().min(1).max(1000),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  sortOrder: z.coerce.number().int().default(0),
});

export const faqSchema = z.object({
  id: z.coerce.number().int().optional(),
  question: z.string().min(1).max(300),
  answer: z.string().min(1).max(2000),
  sortOrder: z.coerce.number().int().default(0),
});

const optUrlOrPath = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v && v.length ? v : null))
  .nullable();

// Same as optUrlOrPath but rejects dangerous schemes (javascript:/data:/…).
// Use for any value that becomes an <a href> on a public page — React does NOT
// strip javascript: hrefs, so these would be clickable stored XSS otherwise.
const optSafeUrlOrPath = z
  .string()
  .trim()
  .max(500)
  .refine(isSafeHref, 'Đường dẫn không hợp lệ.')
  .optional()
  .transform((v) => (v && v.length ? v : null))
  .nullable();

export const siteInfoSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  hours: z.string().min(1),
  taxCode: z.string().max(40).default(''),
  businessName: z.string().max(200).default(''),
  statFarmers: z.string().min(1),
  statProducts: z.string().min(1),
  statCustomers: z.string().min(1),
  statYears: z.string().min(1),
  statFarmersLabel: z.string().min(1).max(60),
  statProductsLabel: z.string().min(1).max(60),
  statCustomersLabel: z.string().min(1).max(60),
  statYearsLabel: z.string().min(1).max(60),

  heroBadge: z.string().min(1).max(200),
  heroImage: z.string().min(1).max(500),
  heroSubtitle: z.string().min(1).max(800),
  heroCtaPrimary: z.string().min(1).max(80),
  heroCtaSecondary: z.string().min(1).max(80),

  subBoxBadge: z.string().min(1).max(60),
  subBoxTitle: z.string().min(1).max(200),
  subBoxDescription: z.string().min(1).max(800),
  subBoxFeatures: z.array(z.string().min(1).max(160)).max(8),
  subBoxCta: z.string().min(1).max(80),
  subBoxLink: z.string().min(1).max(500).refine(isSafeHref, 'Đường dẫn không hợp lệ.'),
  subBoxImage: z.string().min(1).max(500),

  sectionCategoriesEyebrow: z.string().min(1).max(80),
  sectionCategoriesTitle: z.string().min(1).max(200),
  sectionFeaturedEyebrow: z.string().min(1).max(80),
  sectionFeaturedTitle: z.string().min(1).max(200),
  sectionFarmersEyebrow: z.string().min(1).max(80),
  sectionFarmersTitle: z.string().min(1).max(200),
  sectionTestimonialsTitle: z.string().min(1).max(200),
  sectionFaqTitle: z.string().min(1).max(200),
  sectionFaqSubtitle: z.string().min(1).max(300),

  footerTagline: z.string().min(1).max(200),
  socialFacebook: optSafeUrlOrPath,
  socialInstagram: optSafeUrlOrPath,
  socialYoutube: optSafeUrlOrPath,
  socialTiktok: optSafeUrlOrPath,

  contactDemoTitle: z.string().min(1).max(120),
  contactDemoText: z.string().min(1).max(800),

  // The About page moved to the page builder (/admin/pages), so its content no
  // longer lives in site_info. The columns remain because db/seed.ts reads them
  // once to build the page's blocks on existing installs.

  bankEnabled: z.coerce.boolean().default(false),
  bankBin: z.string().max(10).default(''),
  bankName: z.string().max(120).default(''),
  bankAccountNumber: z.string().max(30).default(''),
  bankAccountHolder: z.string().max(120).default(''),

  logoUrl: optUrlOrPath,
  faviconUrl: optUrlOrPath,

  smtpEnabled: z.coerce.boolean().default(false),
  smtpHost: z.string().max(200).default(''),
  smtpPort: z.coerce.number().int().min(1).max(65535).default(587),
  smtpSecure: z.coerce.boolean().default(false),
  smtpUser: z.string().max(200).default(''),
  smtpPass: z.string().max(500).default(''),
  smtpFrom: z.string().max(200).default(''),
  smtpFromName: z.string().max(120).default(''),

  emailHeaderHtml: z.string().max(8000).default(''),
  emailFooterHtml: z.string().max(8000).default(''),

  // SEO & tracking — all optional (empty = feature off).
  siteUrl: z.string().trim().max(300).default(''),
  // Interpolated raw into the inline gtag() script, so it must be a real GA/GTM
  // id — otherwise `');<script>…` would be auto-executing stored XSS for every
  // visitor. Empty = tracking off.
  gaMeasurementId: z.string().trim().max(40).default('')
    .refine((v) => v === '' || /^(G|UA|GT|AW|DC)-[A-Z0-9-]+$/i.test(v),
      'Mã theo dõi không hợp lệ (ví dụ: G-XXXXXXXXXX).'),
  verificationGoogle: z.string().trim().max(200).default(''),
  verificationBing: z.string().trim().max(200).default(''),
  verificationFacebook: z.string().trim().max(200).default(''),

  // Storefront copy — required (a blank hero title is worse than a default one).
  navbarCta: z.string().min(1).max(60),
  productsPageTitle: z.string().min(1).max(120),
  productsPageSubtitle: z.string().min(1).max(400),
  farmersHeroImage: z.string().min(1).max(500),
  farmersHeroEyebrow: z.string().min(1).max(80),
  farmersHeroTitle: z.string().min(1).max(200),
  farmersHeroSubtitle: z.string().min(1).max(400),
  newsTitle: z.string().min(1).max(120),
  newsSubtitle: z.string().min(1).max(400),
  contactTitle: z.string().min(1).max(120),
  contactSubtitle: z.string().min(1).max(400),
  orderSuccessNote: z.string().min(1).max(400),
  footerBuiltByLabel: z.string().max(120).default(''),
  // Rendered as an <a href> in the footer — reject javascript:/data: schemes.
  footerBuiltByUrl: z.string().trim().max(300).default('')
    .refine(isSafeHref, 'Đường dẫn không hợp lệ.'),

  // Secondary UI copy — all required (a blank heading is worse than a default).
  sectionCategoriesLinkLabel: z.string().min(1).max(40),
  sectionFeaturedLinkLabel: z.string().min(1).max(40),
  sectionFarmersLinkLabel: z.string().min(1).max(40),
  listingBadge: z.string().min(1).max(60),
  grownByLabel: z.string().min(1).max(60),
  productDetailHeading: z.string().min(1).max(120),
  relatedProductsHeading: z.string().min(1).max(120),
  farmerStoryHeading: z.string().min(1).max(120),
  farmerProductsHeading: z.string().min(1).max(120),
  relatedPostsHeading: z.string().min(1).max(120),
  cartEmptyTitle: z.string().min(1).max(120),
  cartEmptyText: z.string().min(1).max(200),
  ordersEmptyTitle: z.string().min(1).max(120),
  ordersEmptyText: z.string().min(1).max(200),
  checkoutSlotNote: z.string().min(1).max(200),
  shippingLabel: z.string().min(1).max(60),
});

export const heroSlideSchema = z.object({
  badge: z.string().max(200).default(''),
  title: z.string().min(1, 'Vui lòng nhập tiêu đề slide').max(200),
  subtitle: z.string().max(800).default(''),
  image: z.string().min(1, 'Vui lòng chọn ảnh nền cho slide').max(500),
  ctaPrimaryLabel: z.string().max(80).default(''),
  ctaPrimaryHref: safeHrefField(),
  ctaSecondaryLabel: z.string().max(80).default(''),
  ctaSecondaryHref: safeHrefField(),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const valuePropSchema = z.object({
  icon: z.string().min(1).max(20),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  sortOrder: z.coerce.number().int().default(0),
});

export const themeSchema = z.object({
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Màu thương hiệu phải là mã hex, ví dụ #16a34a'),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Màu nhấn phải là mã hex, ví dụ #f59e0b'),
  radiusScale: z.coerce.number().min(0).max(1.8),
  fontBody: z.string().min(1).max(40),
  fontHeading: z.string().min(1).max(40),
});

export const deliverySlotSchema = z.object({
  label: z.string().min(1).max(120),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const paymentMethodSchema = z.object({
  id: slug,
  label: z.string().min(1).max(120),
  hint: z.string().max(200).default(''),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const contactTopicSchema = z.object({
  label: z.string().min(1).max(120),
  sortOrder: z.coerce.number().int().default(0),
});

export const orderStatusRowSchema = z.object({
  label: z.string().min(1).max(60),
  color: z.string().min(1).max(200),
  sortOrder: z.coerce.number().int().default(0),
});

export const emailTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(400).default(''),
  subject: z.string().min(1).max(300),
  bodyHtml: z.string().min(1).max(20000),
  enabled: z.coerce.boolean().default(true),
});

export const menuItemSchema = z.object({
  location: z.enum(['header', 'footer']),
  label: z.string().trim().min(1).max(120),
  href: z.string().trim().min(1).max(500).refine(isSafeHref, 'Đường dẫn không hợp lệ.'),
  openInNewTab: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(8).max(200),
  password: z.string().min(8).max(200),
});

export const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  role: z.enum(['admin', 'staff']),
  password: z.string().min(8),
});

export const userUpdateSchema = userCreateSchema.partial({ password: true });

export const orderStatusSchema = z.enum(['pending', 'preparing', 'delivering', 'delivered', 'cancelled']);

export const placeOrderSchema = z.object({
  customerName: z.string().min(1, 'Vui lòng nhập họ tên người nhận.').max(120),
  phone: z.string().min(6).max(20)
    .refine((v) => { const d = v.replace(/\D/g, ''); return d.length >= 9 && d.length <= 11; },
      'Số điện thoại không hợp lệ (cần 9–11 chữ số).'),
  address: z.string().min(5, 'Địa chỉ quá ngắn — vui lòng nhập số nhà, đường, phường/xã.').max(500),
  deliverySlot: z.string().min(1, 'Vui lòng chọn khung giờ giao.').max(80),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(['cod', 'bank']).default('cod'),
  customerEmail: z.string().email('Email không hợp lệ.').max(200).optional().or(z.literal('').transform(() => undefined)),
});
