ALTER TABLE "certificates" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
UPDATE "certificates" SET "images" = CASE WHEN "image" IS NOT NULL AND "image" <> '' THEN jsonb_build_array("image") ELSE '[]'::jsonb END;--> statement-breakpoint
ALTER TABLE "certificates" DROP COLUMN "image";
