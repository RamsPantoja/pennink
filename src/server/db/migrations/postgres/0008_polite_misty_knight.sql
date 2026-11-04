CREATE TABLE "evaluation_run" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"evaluation_schema_id" uuid,
	"name" text NOT NULL,
	"schema_snapshot" json NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_submission_page" (
	"id" uuid PRIMARY KEY NOT NULL,
	"submission_id" uuid NOT NULL,
	"page_no" integer NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_submission" (
	"id" uuid PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"student_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"score" integer,
	"answers" json,
	"raw_response" json,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evaluation_run" ADD CONSTRAINT "evaluation_run_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_run" ADD CONSTRAINT "evaluation_run_evaluation_schema_id_evaluation_schema_id_fk" FOREIGN KEY ("evaluation_schema_id") REFERENCES "public"."evaluation_schema"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_submission_page" ADD CONSTRAINT "evaluation_submission_page_submission_id_evaluation_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."evaluation_submission"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_submission" ADD CONSTRAINT "evaluation_submission_run_id_evaluation_run_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."evaluation_run"("id") ON DELETE cascade ON UPDATE no action;