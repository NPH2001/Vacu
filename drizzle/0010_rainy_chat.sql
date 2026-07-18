ALTER TABLE "site_info" ADD COLUMN "site_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "ga_measurement_id" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "verification_google" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "verification_bing" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "verification_facebook" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "navbar_cta" text DEFAULT 'Mua nông sản →' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "products_page_title" text DEFAULT 'Toàn bộ nông sản' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "products_page_subtitle" text DEFAULT 'Rau củ, trái cây, trứng thịt, gia vị — thu hoạch trực tiếp từ nông trại.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "farmers_hero_image" text DEFAULT '/farm/1464226184884-fa280b87c399.jpg' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "farmers_hero_eyebrow" text DEFAULT 'Hậu phương' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "farmers_hero_title" text DEFAULT 'Những người âm thầm trồng rau cho bạn' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "farmers_hero_subtitle" text DEFAULT '{count} bà con nông dân từ Đà Lạt, Mộc Châu, Đắk Lắk, Hà Giang. Mỗi cọng rau là một câu chuyện.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "news_title" text DEFAULT 'Chuyện nhà nông' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "news_subtitle" text DEFAULT 'Mẹo chọn rau, công thức nấu ăn và câu chuyện từ những người trồng rau cho bạn.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "contact_title" text DEFAULT 'Chúng tôi luôn lắng nghe' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "contact_subtitle" text DEFAULT 'Có câu hỏi về sản phẩm? Muốn hợp tác? Hay chỉ muốn nói lời cảm ơn? Gửi cho chúng tôi vài dòng.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "order_success_note" text DEFAULT 'Cô nông dân sẽ thu hoạch rau của bạn vào sáng mai.' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "footer_built_by_label" text DEFAULT 'idflow.vn' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_info" ADD COLUMN "footer_built_by_url" text DEFAULT 'https://idflow.vn' NOT NULL;