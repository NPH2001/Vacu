ALTER TABLE "payment_methods" ADD COLUMN "hint" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "section_categories_link_label" text DEFAULT 'Tất cả' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "section_featured_link_label" text DEFAULT 'Xem tất cả' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "section_farmers_link_label" text DEFAULT 'Toàn bộ' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "listing_badge" text DEFAULT 'Chợ nông trại' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "grown_by_label" text DEFAULT 'Trồng bởi' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "product_detail_heading" text DEFAULT 'Chi tiết sản phẩm' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "related_products_heading" text DEFAULT 'Có thể bạn thích' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "farmer_story_heading" text DEFAULT 'Câu chuyện nông trại' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "farmer_products_heading" text DEFAULT 'Sản phẩm của {name}' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "related_posts_heading" text DEFAULT 'Bài viết khác' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "cart_empty_title" text DEFAULT 'Giỏ nông sản còn trống' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "cart_empty_text" text DEFAULT 'Hãy đi chợ và chọn vài loại rau tươi nhé!' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "orders_empty_title" text DEFAULT 'Chưa có đơn nào' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "orders_empty_text" text DEFAULT 'Rau tươi đang chờ bạn trong vườn.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "checkout_slot_note" text DEFAULT 'Rau được thu hoạch buổi sáng cùng ngày giao.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "shipping_label" text DEFAULT 'Miễn phí' NOT NULL;