CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"location" text NOT NULL,
	"label" text NOT NULL,
	"href" text NOT NULL,
	"open_in_new_tab" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
