import {
  pgTable, text, integer, serial, boolean, timestamp, jsonb, uuid, check,
  type AnyPgColumn,
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
  parentId: text('parent_id').references((): AnyPgColumn => categories.id, { onDelete: 'restrict' }),
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
  body: text('body').notNull().default(''),
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
    taxCode: text('tax_code').notNull().default(''),
    businessName: text('business_name').notNull().default(''),
    statFarmers: text('stat_farmers').notNull(),
    statProducts: text('stat_products').notNull(),
    statCustomers: text('stat_customers').notNull(),
    statYears: text('stat_years').notNull(),

    heroBadge: text('hero_badge').notNull().default('Thu hoạch sáng nay — giao chiều nay'),
    heroImage: text('hero_image').notNull().default('/farm/1500937386664-56d1dfef3854.jpg'),
    heroSubtitle: text('hero_subtitle').notNull().default('Kết nối trực tiếp với nông dân uy tín khắp Việt Nam. Không trung gian, không hóa chất, giá nông dân.'),
    heroCtaPrimary: text('hero_cta_primary').notNull().default('Đi chợ nông trại →'),
    heroCtaSecondary: text('hero_cta_secondary').notNull().default('Gặp bà con nông dân'),

    subBoxBadge: text('sub_box_badge').notNull().default('TIẾT KIỆM 20%'),
    subBoxTitle: text('sub_box_title').notNull().default('Hộp rau tuần cho gia đình bận rộn'),
    subBoxDescription: text('sub_box_description').notNull().default('8-10 loại rau củ theo mùa, được cô nông dân chọn tay mỗi tuần. Giao 2 lần/tuần ngay tại cửa nhà bạn.'),
    subBoxFeatures: jsonb('sub_box_features').$type<string[]>().notNull().default([
      'Tự động gia hạn, hủy bất cứ lúc nào',
      'Tùy chỉnh món không ăn',
      'Tham quan nông trại miễn phí',
    ]),
    subBoxCta: text('sub_box_cta').notNull().default('Đăng ký hộp rau →'),
    subBoxLink: text('sub_box_link').notNull().default('/danh-muc/hop-qua'),
    subBoxImage: text('sub_box_image').notNull().default('/farm/1610348725531-843dff563e2c.jpg'),

    sectionCategoriesEyebrow: text('section_categories_eyebrow').notNull().default('Danh mục'),
    sectionCategoriesTitle: text('section_categories_title').notNull().default('Thứ gì bạn đang cần?'),
    sectionFeaturedEyebrow: text('section_featured_eyebrow').notNull().default('Nổi bật tuần này'),
    sectionFeaturedTitle: text('section_featured_title').notNull().default('Mùa nào thức nấy'),
    sectionFarmersEyebrow: text('section_farmers_eyebrow').notNull().default('Gặp bà con'),
    sectionFarmersTitle: text('section_farmers_title').notNull().default('Người trồng rau cho bạn'),
    sectionTestimonialsTitle: text('section_testimonials_title').notNull().default('28.000+ gia đình đã tin dùng'),
    sectionFaqTitle: text('section_faq_title').notNull().default('Câu hỏi thường gặp'),

    footerTagline: text('footer_tagline').notNull().default('Rau sạch, lòng sạch.'),
    socialFacebook: text('social_facebook'),
    socialInstagram: text('social_instagram'),
    socialYoutube: text('social_youtube'),
    socialTiktok: text('social_tiktok'),

    contactDemoTitle: text('contact_demo_title').notNull().default('Trang trại demo'),
    contactDemoText: text('contact_demo_text').notNull().default('Chúng tôi tổ chức tour thăm vườn Đà Lạt mỗi tháng. Đăng ký qua email hoặc hotline phía trên.'),

    aboutHeroBadge: text('about_hero_badge').notNull().default('Câu chuyện của chúng tôi'),
    aboutHeroTitle: text('about_hero_title').notNull().default('Hợp tác xã Nông nghiệp OCOP Việt Nam'),
    aboutHeroImage: text('about_hero_image').notNull().default('/farm/1625246333195-78d9c38ad449.jpg'),
    aboutStory: jsonb('about_story').$type<string[]>().notNull().default([
      'Hợp tác xã Nông nghiệp OCOP Việt Nam — tên viết tắt Vacu — được thành lập ngày 13/10/2023 tại Phường Quỳnh Dị, Thị xã Hoàng Mai, Tỉnh Nghệ An. Chủ tịch Hội đồng Quản trị: bà Nguyễn Thị Hiền.',
      'Vacu ra đời với sứ mệnh kết nối các sản phẩm OCOP — mỗi làng một sản phẩm — từ các hợp tác xã, hộ nông dân, nhà sản xuất địa phương trên khắp Việt Nam tới tay người tiêu dùng. Không trung gian lòng vòng, không mập mờ nguồn gốc.',
      'Chúng tôi tổ chức bán buôn, bán lẻ lương thực thực phẩm, đồ uống, nông sản; quản lý kho bãi; giới thiệu và xúc tiến thương mại cho bà con hợp tác xã và nhà sản xuất địa phương — góp phần đưa sản vật Việt Nam ra thị trường một cách minh bạch và bền vững.',
    ]),
    aboutCommitmentsTitle: text('about_commitments_title').notNull().default('Ba điều chúng tôi cam kết'),
    aboutCommitments: jsonb('about_commitments').$type<Array<{ num: string; title: string; desc: string }>>().notNull().default([
      { num: '01', title: 'Trung thực về nguồn gốc', desc: 'Mỗi sản phẩm đều ghi rõ nông dân, nông trại, ngày thu hoạch. Không mập mờ, không "rau sạch" chung chung.' },
      { num: '02', title: 'Công bằng với nông dân', desc: 'Chúng tôi ký hợp đồng bao tiêu với giá cao hơn giá thị trường, trả trước 50% để bà con an tâm đầu tư.' },
      { num: '03', title: 'Tôn trọng đất đai', desc: '100% không thuốc trừ sâu hóa học, ưu tiên phân hữu cơ, luân canh bảo vệ đất. Chúng tôi trồng cho con cháu.' },
    ]),
    aboutStatsTitle: text('about_stats_title').notNull().default('Những con số biết nói'),
    aboutCtaTitle: text('about_cta_title').notNull().default('Còn nhiều câu chuyện nông dân đang chờ bạn'),
    aboutCtaSubtitle: text('about_cta_subtitle').notNull().default('Mỗi nông dân chúng tôi cộng tác có một câu chuyện riêng. Hãy đến gặp họ.'),
    aboutCtaLabel: text('about_cta_label').notNull().default('Gặp bà con nông dân →'),

    bankEnabled: boolean('bank_enabled').notNull().default(false),
    bankBin: text('bank_bin').notNull().default(''),
    bankName: text('bank_name').notNull().default(''),
    bankAccountNumber: text('bank_account_number').notNull().default(''),
    bankAccountHolder: text('bank_account_holder').notNull().default(''),

    logoUrl: text('logo_url'),
    faviconUrl: text('favicon_url'),

    smtpEnabled: boolean('smtp_enabled').notNull().default(false),
    smtpHost: text('smtp_host').notNull().default(''),
    smtpPort: integer('smtp_port').notNull().default(587),
    smtpSecure: boolean('smtp_secure').notNull().default(false),
    smtpUser: text('smtp_user').notNull().default(''),
    smtpPass: text('smtp_pass').notNull().default(''),
    smtpFrom: text('smtp_from').notNull().default(''),
    smtpFromName: text('smtp_from_name').notNull().default(''),

    emailHeaderHtml: text('email_header_html').notNull().default(''),
    emailFooterHtml: text('email_footer_html').notNull().default(''),
  },
  (t) => ({
    onlyOne: check('site_info_only_one', sql`${t.id} = 1`),
  }),
);

export const valueProps = pgTable('value_props', {
  id: serial('id').primaryKey(),
  icon: text('icon').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const deliverySlots = pgTable('delivery_slots', {
  id: serial('id').primaryKey(),
  label: text('label').notNull(),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const paymentMethods = pgTable('payment_methods', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  active: boolean('active').notNull().default(true),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const contactTopics = pgTable('contact_topics', {
  id: serial('id').primaryKey(),
  label: text('label').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const orderStatuses = pgTable('order_statuses', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  color: text('color').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const emailTemplates = pgTable('email_templates', {
  key: text('key').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  subject: text('subject').notNull(),
  bodyHtml: text('body_html').notNull(),
  enabled: boolean('enabled').notNull().default(true),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  location: text('location', { enum: ['header', 'footer'] }).notNull(),
  label: text('label').notNull(),
  href: text('href').notNull(),
  openInNewTab: boolean('open_in_new_tab').notNull().default(false),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  tokenHash: text('token_hash').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

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
  paymentMethod: text('payment_method', { enum: ['cod', 'bank'] }).notNull().default('cod'),
  paymentStatus: text('payment_status', { enum: ['unpaid', 'paid'] }).notNull().default('unpaid'),
  customerEmail: text('customer_email'),
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

export type ValuePropRow = typeof valueProps.$inferSelect;
export type DeliverySlotRow = typeof deliverySlots.$inferSelect;
export type PaymentMethodRow = typeof paymentMethods.$inferSelect;
export type ContactTopicRow = typeof contactTopics.$inferSelect;
export type OrderStatusRow = typeof orderStatuses.$inferSelect;
export type EmailTemplateRow = typeof emailTemplates.$inferSelect;
export type MenuItemRow = typeof menuItems.$inferSelect;
export type PasswordResetTokenRow = typeof passwordResetTokens.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type ProductRow = typeof products.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type FarmerRow = typeof farmers.$inferSelect;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type FaqRow = typeof faqItems.$inferSelect;
export type SiteInfoRow = typeof siteInfo.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
