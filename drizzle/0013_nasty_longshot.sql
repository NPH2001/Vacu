CREATE TABLE "theme" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"brand_color" text DEFAULT '#16a34a' NOT NULL,
	"accent_color" text DEFAULT '#f59e0b' NOT NULL,
	"radius_scale" real DEFAULT 1 NOT NULL,
	"font_body" text DEFAULT 'inter' NOT NULL,
	"font_heading" text DEFAULT 'fraunces' NOT NULL
);
