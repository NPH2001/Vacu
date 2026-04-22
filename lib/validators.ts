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
});
