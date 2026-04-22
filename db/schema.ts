import {
  pgTable, text, integer, serial, boolean, timestamp, jsonb, uuid, check
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'staff'] }).notNull().default('staff'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const farmers = pgTable('farmers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  farm: text('farm').notNull(),
  location: text('location').notNull(),
  years: integer('years').notNull(),
  specialty: text('specialty').notNull(),
  avatar: text('avatar').notNull(),
  cover: text('cover').notNull(),
  story: text('story').notNull(),
  certifications: jsonb('certifications').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'restrict' }),
  unit: text('unit').notNull(),
  price: integer('price').notNull(),
  oldPrice: integer('old_price'),
  image: text('image').notNull(),
  farmerId: text('farmer_id').references(() => farmers.id, { onDelete: 'set null' }),
  description: text('description').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default([]),
  featured: boolean('featured').notNull().default(false),
  inStock: boolean('in_stock').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  avatar: text('avatar').notNull(),
  content: text('content').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const faqItems = pgTable('faq_items', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const siteInfo = pgTable(
  'site_info',
  {
    id: integer('id').primaryKey(),
    name: text('name').notNull(),
    shortName: text('short_name').notNull(),
    tagline: text('tagline').notNull(),
    description: text('description').notNull(),
    address: text('address').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull(),
    hours: text('hours').notNull(),
    statFarmers: text('stat_farmers').notNull(),
    statProducts: text('stat_products').notNull(),
    statCustomers: text('stat_customers').notNull(),
    statYears: text('stat_years').notNull(),
  },
  (t) => ({
    onlyOne: check('site_info_only_one', sql`${t.id} = 1`),
  }),
);

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  address: text('address').notNull(),
  deliverySlot: text('delivery_slot').notNull(),
  note: text('note'),
  total: integer('total').notNull(),
  status: text('status', {
    enum: ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'],
  }).notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  qty: integer('qty').notNull(),
  unit: text('unit').notNull(),
  image: text('image').notNull(),
});

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  farmer: one(farmers, { fields: [products.farmerId], references: [farmers.id] }),
}));

export type UserRow = typeof users.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type FarmerRow = typeof farmers.$inferSelect;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type FaqRow = typeof faqItems.$inferSelect;
export type SiteInfoRow = typeof siteInfo.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
