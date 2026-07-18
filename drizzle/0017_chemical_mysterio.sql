CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_created_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_status_created_idx" ON "orders" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_no_self_parent" CHECK ("categories"."parent_id" IS NULL OR "categories"."parent_id" <> "categories"."id");--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_qty_pos" CHECK ("order_items"."qty" > 0 AND "order_items"."price" >= 0);--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_nonneg" CHECK ("orders"."total" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_price_pos" CHECK ("products"."price" > 0 AND ("products"."old_price" IS NULL OR "products"."old_price" > 0));--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_rating_rng" CHECK ("testimonials"."rating" BETWEEN 1 AND 5);