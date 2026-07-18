ALTER TABLE "users" ADD COLUMN "password_changed_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "page_blocks_page_idx" ON "page_blocks" USING btree ("page_id","sort_order");--> statement-breakpoint
CREATE INDEX "posts_status_published_idx" ON "posts" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "posts_category_idx" ON "posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id","sort_order");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_farmer_idx" ON "products" USING btree ("farmer_id");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("featured");