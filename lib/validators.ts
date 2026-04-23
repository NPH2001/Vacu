import { z } from 'zod';

const slug = z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, 'Slug kiểu: chữ thường, số, gạch ngang');
const url = z.string().min(1).max(500);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional(),
});

export const categorySchema = z.object({
  id: slug,
  name: z.string().min(1).max(120),
  icon: z.string().min(1).max(10),
  description: z.string().min(1).max(300),
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
  name: z.string().min(1).max(200),
  categoryId: slug,
  unit: z.string().min(1).max(60),
  price: z.coerce.number().int().positive(),
  oldPrice: z.coerce.number().int().positive().optional().nullable(),
  image: url,
  farmerId: slug.optional().nullable(),
  description: z.string().min(1).max(2000),
  body: z.string().max(20000).default(''),
  tags: z.array(z.string()).default([]),
  featured: z.coerce.boolean().default(false),
  inStock: z.coerce.boolean().default(true),
});

export const testimonialSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  avatar: url,
  content: z.string().min(1).max(1000),
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

export const siteInfoSchema = z.object({
  name: z.string().min(1),
  shortName: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  hours: z.string().min(1),
  statFarmers: z.string().min(1),
  statProducts: z.string().min(1),
  statCustomers: z.string().min(1),
  statYears: z.string().min(1),

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
  subBoxLink: z.string().min(1).max(500),
  subBoxImage: z.string().min(1).max(500),

  sectionCategoriesEyebrow: z.string().min(1).max(80),
  sectionCategoriesTitle: z.string().min(1).max(200),
  sectionFeaturedEyebrow: z.string().min(1).max(80),
  sectionFeaturedTitle: z.string().min(1).max(200),
  sectionFarmersEyebrow: z.string().min(1).max(80),
  sectionFarmersTitle: z.string().min(1).max(200),
  sectionTestimonialsTitle: z.string().min(1).max(200),
  sectionFaqTitle: z.string().min(1).max(200),

  footerTagline: z.string().min(1).max(200),
  socialFacebook: optUrlOrPath,
  socialInstagram: optUrlOrPath,
  socialYoutube: optUrlOrPath,
  socialTiktok: optUrlOrPath,

  contactDemoTitle: z.string().min(1).max(120),
  contactDemoText: z.string().min(1).max(800),

  aboutHeroBadge: z.string().min(1).max(120),
  aboutHeroTitle: z.string().min(1).max(200),
  aboutHeroImage: z.string().min(1).max(500),
  aboutStory: z.array(z.string().min(1).max(2000)).max(10),
  aboutCommitmentsTitle: z.string().min(1).max(200),
  aboutCommitments: z.array(z.object({
    num: z.string().min(1).max(10),
    title: z.string().min(1).max(120),
    desc: z.string().min(1).max(500),
  })).max(6),
  aboutStatsTitle: z.string().min(1).max(200),
  aboutCtaTitle: z.string().min(1).max(200),
  aboutCtaSubtitle: z.string().min(1).max(400),
  aboutCtaLabel: z.string().min(1).max(80),

  bankEnabled: z.coerce.boolean().default(false),
  bankBin: z.string().max(10).default(''),
  bankName: z.string().max(120).default(''),
  bankAccountNumber: z.string().max(30).default(''),
  bankAccountHolder: z.string().max(120).default(''),

  logoUrl: optUrlOrPath,

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
});

export const valuePropSchema = z.object({
  icon: z.string().min(1).max(20),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(400),
  sortOrder: z.coerce.number().int().default(0),
});

export const deliverySlotSchema = z.object({
  label: z.string().min(1).max(120),
  active: z.coerce.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const paymentMethodSchema = z.object({
  id: slug,
  label: z.string().min(1).max(120),
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
  customerName: z.string().min(1).max(120),
  phone: z.string().min(6).max(20),
  address: z.string().min(5).max(500),
  deliverySlot: z.string().min(1).max(80),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(['cod', 'bank']).default('cod'),
  customerEmail: z.string().email().max(200).optional().or(z.literal('').transform(() => undefined)),
});
