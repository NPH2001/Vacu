CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_topics" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"subject" text NOT NULL,
	"body_html" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farmers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"farm" text NOT NULL,
	"location" text NOT NULL,
	"years" integer NOT NULL,
	"specialty" text NOT NULL,
	"avatar" text NOT NULL,
	"cover" text NOT NULL,
	"story" text NOT NULL,
	"certifications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"name" text NOT NULL,
	"price" integer NOT NULL,
	"qty" integer NOT NULL,
	"unit" text NOT NULL,
	"image" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_statuses" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"color" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"delivery_slot" text NOT NULL,
	"note" text,
	"total" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payment_method" text DEFAULT 'cod' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"customer_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category_id" text NOT NULL,
	"unit" text NOT NULL,
	"price" integer NOT NULL,
	"old_price" integer,
	"image" text NOT NULL,
	"farmer_id" text,
	"description" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_info" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"address" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"hours" text NOT NULL,
	"tax_code" text DEFAULT '' NOT NULL,
	"business_name" text DEFAULT '' NOT NULL,
	"stat_farmers" text NOT NULL,
	"stat_products" text NOT NULL,
	"stat_customers" text NOT NULL,
	"stat_years" text NOT NULL,
	"hero_badge" text DEFAULT 'Thu hoạch sáng nay — giao chiều nay' NOT NULL,
	"hero_image" text DEFAULT '/farm/1500937386664-56d1dfef3854.jpg' NOT NULL,
	"hero_subtitle" text DEFAULT 'Kết nối trực tiếp với nông dân uy tín khắp Việt Nam. Không trung gian, không hóa chất, giá nông dân.' NOT NULL,
	"hero_cta_primary" text DEFAULT 'Đi chợ nông trại →' NOT NULL,
	"hero_cta_secondary" text DEFAULT 'Gặp bà con nông dân' NOT NULL,
	"sub_box_badge" text DEFAULT 'TIẾT KIỆM 20%' NOT NULL,
	"sub_box_title" text DEFAULT 'Hộp rau tuần cho gia đình bận rộn' NOT NULL,
	"sub_box_description" text DEFAULT '8-10 loại rau củ theo mùa, được cô nông dân chọn tay mỗi tuần. Giao 2 lần/tuần ngay tại cửa nhà bạn.' NOT NULL,
	"sub_box_features" jsonb DEFAULT '["Tự động gia hạn, hủy bất cứ lúc nào","Tùy chỉnh món không ăn","Tham quan nông trại miễn phí"]'::jsonb NOT NULL,
	"sub_box_cta" text DEFAULT 'Đăng ký hộp rau →' NOT NULL,
	"sub_box_link" text DEFAULT '/products?c=hop-qua' NOT NULL,
	"sub_box_image" text DEFAULT '/farm/1610348725531-843dff563e2c.jpg' NOT NULL,
	"section_categories_eyebrow" text DEFAULT 'Danh mục' NOT NULL,
	"section_categories_title" text DEFAULT 'Thứ gì bạn đang cần?' NOT NULL,
	"section_featured_eyebrow" text DEFAULT 'Nổi bật tuần này' NOT NULL,
	"section_featured_title" text DEFAULT 'Mùa nào thức nấy' NOT NULL,
	"section_farmers_eyebrow" text DEFAULT 'Gặp bà con' NOT NULL,
	"section_farmers_title" text DEFAULT 'Người trồng rau cho bạn' NOT NULL,
	"section_testimonials_title" text DEFAULT '28.000+ gia đình đã tin dùng' NOT NULL,
	"section_faq_title" text DEFAULT 'Câu hỏi thường gặp' NOT NULL,
	"footer_tagline" text DEFAULT 'Rau sạch, lòng sạch.' NOT NULL,
	"social_facebook" text,
	"social_instagram" text,
	"social_youtube" text,
	"social_tiktok" text,
	"contact_demo_title" text DEFAULT 'Trang trại demo' NOT NULL,
	"contact_demo_text" text DEFAULT 'Chúng tôi tổ chức tour thăm vườn Đà Lạt mỗi tháng. Đăng ký qua email hoặc hotline phía trên.' NOT NULL,
	"about_hero_badge" text DEFAULT 'Câu chuyện của chúng tôi' NOT NULL,
	"about_hero_title" text DEFAULT 'Hợp tác xã Nông nghiệp OCOP Việt Nam' NOT NULL,
	"about_hero_image" text DEFAULT '/farm/1625246333195-78d9c38ad449.jpg' NOT NULL,
	"about_story" jsonb DEFAULT '["Hợp tác xã Nông nghiệp OCOP Việt Nam — tên viết tắt Vacu — được thành lập ngày 13/10/2023 tại Phường Quỳnh Dị, Thị xã Hoàng Mai, Tỉnh Nghệ An. Chủ tịch Hội đồng Quản trị: bà Nguyễn Thị Hiền.","Vacu ra đời với sứ mệnh kết nối các sản phẩm OCOP — mỗi làng một sản phẩm — từ các hợp tác xã, hộ nông dân, nhà sản xuất địa phương trên khắp Việt Nam tới tay người tiêu dùng. Không trung gian lòng vòng, không mập mờ nguồn gốc.","Chúng tôi tổ chức bán buôn, bán lẻ lương thực thực phẩm, đồ uống, nông sản; quản lý kho bãi; giới thiệu và xúc tiến thương mại cho bà con hợp tác xã và nhà sản xuất địa phương — góp phần đưa sản vật Việt Nam ra thị trường một cách minh bạch và bền vững."]'::jsonb NOT NULL,
	"about_commitments_title" text DEFAULT 'Ba điều chúng tôi cam kết' NOT NULL,
	"about_commitments" jsonb DEFAULT '[{"num":"01","title":"Trung thực về nguồn gốc","desc":"Mỗi sản phẩm đều ghi rõ nông dân, nông trại, ngày thu hoạch. Không mập mờ, không \"rau sạch\" chung chung."},{"num":"02","title":"Công bằng với nông dân","desc":"Chúng tôi ký hợp đồng bao tiêu với giá cao hơn giá thị trường, trả trước 50% để bà con an tâm đầu tư."},{"num":"03","title":"Tôn trọng đất đai","desc":"100% không thuốc trừ sâu hóa học, ưu tiên phân hữu cơ, luân canh bảo vệ đất. Chúng tôi trồng cho con cháu."}]'::jsonb NOT NULL,
	"about_stats_title" text DEFAULT 'Những con số biết nói' NOT NULL,
	"about_cta_title" text DEFAULT 'Còn nhiều câu chuyện nông dân đang chờ bạn' NOT NULL,
	"about_cta_subtitle" text DEFAULT 'Mỗi nông dân chúng tôi cộng tác có một câu chuyện riêng. Hãy đến gặp họ.' NOT NULL,
	"about_cta_label" text DEFAULT 'Gặp bà con nông dân →' NOT NULL,
	"bank_enabled" boolean DEFAULT false NOT NULL,
	"bank_bin" text DEFAULT '' NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL,
	"bank_account_number" text DEFAULT '' NOT NULL,
	"bank_account_holder" text DEFAULT '' NOT NULL,
	"logo_url" text,
	"favicon_url" text,
	"smtp_enabled" boolean DEFAULT false NOT NULL,
	"smtp_host" text DEFAULT '' NOT NULL,
	"smtp_port" integer DEFAULT 587 NOT NULL,
	"smtp_secure" boolean DEFAULT false NOT NULL,
	"smtp_user" text DEFAULT '' NOT NULL,
	"smtp_pass" text DEFAULT '' NOT NULL,
	"smtp_from" text DEFAULT '' NOT NULL,
	"smtp_from_name" text DEFAULT '' NOT NULL,
	"email_header_html" text DEFAULT '' NOT NULL,
	"email_footer_html" text DEFAULT '' NOT NULL,
	CONSTRAINT "site_info_only_one" CHECK ("site_info"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"avatar" text NOT NULL,
	"content" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'staff' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "value_props" (
	"id" serial PRIMARY KEY NOT NULL,
	"icon" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_farmer_id_farmers_id_fk" FOREIGN KEY ("farmer_id") REFERENCES "public"."farmers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- ============================================================
-- Reference data (app requires these rows to function)
-- ============================================================

INSERT INTO "value_props" ("icon", "title", "description", "sort_order") VALUES
  ('🌱', 'Hữu cơ chứng nhận', '100% nông sản đạt PGS, VietGAP hoặc tương đương.', 10),
  ('👨‍🌾', 'Từ tay nông dân', 'Mua trực tiếp, nông dân nhận cao hơn 30-40% giá chợ.', 20),
  ('⏱️', 'Tươi trong 24h', 'Thu hoạch buổi sáng, giao trong ngày tại nội thành.', 30),
  ('🔁', 'Cam kết hoàn tiền', 'Rau không tươi? Chụp ảnh và báo, hoàn 100% trong 24h.', 40);
--> statement-breakpoint
INSERT INTO "delivery_slots" ("label", "active", "sort_order") VALUES
  ('Sáng mai (7:00 - 11:00)', true, 10),
  ('Chiều mai (14:00 - 18:00)', true, 20),
  ('Sáng ngày kia (7:00 - 11:00)', true, 30),
  ('Chiều ngày kia (14:00 - 18:00)', true, 40);
--> statement-breakpoint
INSERT INTO "payment_methods" ("id", "label", "active", "sort_order") VALUES
  ('cod', '💵 Tiền mặt khi nhận', true, 10),
  ('momo', '📱 Ví MoMo', true, 20),
  ('bank', '🏦 Chuyển khoản', true, 30),
  ('card', '💳 Thẻ ngân hàng', true, 40);
--> statement-breakpoint
INSERT INTO "contact_topics" ("label", "sort_order") VALUES
  ('Sản phẩm', 10),
  ('Hộp rau tuần', 20),
  ('Hợp tác nông dân', 30),
  ('Tour thăm vườn', 40),
  ('Khác', 50);
--> statement-breakpoint
INSERT INTO "order_statuses" ("key", "label", "color", "sort_order") VALUES
  ('pending', 'Đã đặt', 'bg-amber-100 text-amber-800', 10),
  ('preparing', 'Đang thu hoạch', 'bg-sky-100 text-sky-800', 20),
  ('delivering', 'Đang giao', 'bg-indigo-100 text-indigo-800', 30),
  ('delivered', 'Đã giao', 'bg-green-100 text-green-800', 40),
  ('cancelled', 'Đã huỷ', 'bg-red-100 text-red-700', 50);
--> statement-breakpoint
INSERT INTO "email_templates" ("key", "name", "description", "subject", "body_html") VALUES
('forgot_password',
 'Quên mật khẩu',
 'Gửi khi admin/staff yêu cầu đặt lại mật khẩu.',
 'Đặt lại mật khẩu {{siteName}}',
 $html$<h2 style="color:#1f6b3a;margin:0 0 12px 0;font-size:22px">Đặt lại mật khẩu</h2>
<p style="margin:0 0 12px 0">Chào {{userName}},</p>
<p style="margin:0 0 12px 0">Bạn vừa yêu cầu đặt lại mật khẩu tài khoản quản trị <strong>{{siteName}}</strong>. Nhấn nút bên dưới để tiếp tục (link có hiệu lực <strong>{{expiresInMinutes}} phút</strong>):</p>
<p style="margin:24px 0"><a href="{{resetLink}}" style="display:inline-block;background:#1f6b3a;color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600">Đặt lại mật khẩu</a></p>
<p style="margin:0;color:#555;font-size:13px">Hoặc copy link sau vào trình duyệt:</p>
<p style="margin:4px 0 20px 0;word-break:break-all;color:#1f6b3a;font-size:13px">{{resetLink}}</p>
<p style="margin:0;color:#888;font-size:12px;border-top:1px solid #eee;padding-top:12px">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>$html$),
('order_confirm_customer',
 'Xác nhận đơn — cho khách',
 'Gửi cho khách ngay sau khi đặt đơn. Có kèm QR nếu khách chọn chuyển khoản.',
 '[{{siteName}}] Đã nhận đơn {{orderId}}',
 $html$<h2 style="color:#1f6b3a;margin:0 0 12px 0;font-size:22px">Đã nhận đơn {{orderId}}</h2>
<p style="margin:0 0 10px 0">Chào {{customerName}},</p>
<p style="margin:0 0 16px 0">Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được ghi nhận và sẽ sớm được xử lý.</p>
<table style="width:100%;border-collapse:collapse;margin:0 0 16px 0;font-size:14px">
  <tr><td style="padding:6px 0;color:#666">Mã đơn</td><td style="padding:6px 0;text-align:right;font-weight:600">{{orderId}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Tổng tiền</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#1f6b3a">{{orderTotal}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Giao đến</td><td style="padding:6px 0;text-align:right">{{address}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Khung giờ</td><td style="padding:6px 0;text-align:right">{{deliverySlot}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Thanh toán</td><td style="padding:6px 0;text-align:right">{{paymentMethod}}</td></tr>
</table>
{{paymentInfoHtml}}$html$),
('order_notify_admin',
 'Đơn mới — cho admin',
 'Gửi cho email liên hệ của site khi có khách đặt hàng mới.',
 '[{{siteName}}] Đơn mới {{orderId}} — {{customerName}}',
 $html$<h2 style="color:#1f6b3a;margin:0 0 12px 0;font-size:22px">Đơn hàng mới: {{orderId}}</h2>
<table style="width:100%;border-collapse:collapse;margin:0 0 16px 0;font-size:14px">
  <tr><td style="padding:6px 0;color:#666;width:140px">Khách</td><td style="padding:6px 0;font-weight:600">{{customerName}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Email</td><td style="padding:6px 0">{{customerEmail}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Điện thoại</td><td style="padding:6px 0">{{customerPhone}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Địa chỉ</td><td style="padding:6px 0">{{address}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Khung giờ</td><td style="padding:6px 0">{{deliverySlot}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Ghi chú</td><td style="padding:6px 0">{{note}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Thanh toán</td><td style="padding:6px 0">{{paymentMethod}}</td></tr>
  <tr><td style="padding:6px 0;color:#666">Tổng tiền</td><td style="padding:6px 0;font-weight:700;color:#1f6b3a">{{orderTotal}}</td></tr>
</table>
<p style="margin:20px 0 0 0"><a href="{{adminOrderLink}}" style="display:inline-block;background:#1f6b3a;color:#fff;padding:10px 22px;border-radius:999px;text-decoration:none;font-weight:600">Mở đơn trong admin</a></p>$html$),
('payment_confirmed',
 'Xác nhận đã nhận tiền — cho khách',
 'Gửi khi admin đánh dấu đơn chuyển khoản đã thanh toán.',
 '[{{siteName}}] Đã xác nhận thanh toán đơn {{orderId}}',
 $html$<h2 style="color:#1f6b3a;margin:0 0 12px 0;font-size:22px">Đã xác nhận thanh toán</h2>
<p style="margin:0 0 10px 0">Chào {{customerName}},</p>
<p style="margin:0 0 12px 0">Chúng tôi đã xác nhận khoản thanh toán <strong style="color:#1f6b3a">{{orderTotal}}</strong> cho đơn hàng <strong>{{orderId}}</strong>.</p>
<p style="margin:0 0 12px 0">Đơn của bạn sẽ được chuyển sang bước thu hoạch và giao hàng ngay. Cảm ơn bạn đã tin dùng {{siteName}}!</p>$html$);
