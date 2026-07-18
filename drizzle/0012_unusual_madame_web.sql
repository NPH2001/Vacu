CREATE TABLE "hero_slides" (
	"id" serial PRIMARY KEY NOT NULL,
	"badge" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"subtitle" text DEFAULT '' NOT NULL,
	"image" text NOT NULL,
	"cta_primary_label" text DEFAULT '' NOT NULL,
	"cta_primary_href" text DEFAULT '' NOT NULL,
	"cta_secondary_label" text DEFAULT '' NOT NULL,
	"cta_secondary_href" text DEFAULT '' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
