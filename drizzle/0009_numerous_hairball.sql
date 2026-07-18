ALTER TABLE "site_info" ADD COLUMN "stat_farmers_label" text DEFAULT 'Nông dân' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "stat_products_label" text DEFAULT 'Sản phẩm' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "stat_customers_label" text DEFAULT 'Gia đình tin dùng' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "stat_years_label" text DEFAULT 'Năm kinh nghiệm' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "section_faq_subtitle" text DEFAULT 'Còn thắc mắc? Gọi {phone} để trò chuyện với chúng tôi.' NOT NULL;--> statement-breakpoint
ALTER TABLE "testimonials" ADD COLUMN "rating" integer DEFAULT 5 NOT NULL;