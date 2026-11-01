CREATE TABLE "plan_artifact" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"classroom_id" uuid NOT NULL,
	"title" text NOT NULL,
	"range" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"blocks" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "plan_artifact" ADD CONSTRAINT "plan_artifact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_artifact" ADD CONSTRAINT "plan_artifact_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classroom"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plan_artifact_classroom_idx" ON "plan_artifact" USING btree ("classroom_id","start_date");