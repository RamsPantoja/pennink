CREATE TABLE "artifact" (
	"id" uuid PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"type" text NOT NULL,
	"key" text NOT NULL,
	"bucket" text NOT NULL,
	"size" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid,
	"chat_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artifact_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "exam_link" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"exam_version_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_result" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"user_id" uuid,
	"exam_id" uuid NOT NULL,
	"answers" jsonb NOT NULL,
	"feedback" text NOT NULL,
	"score" integer NOT NULL,
	"exam_version_id" uuid NOT NULL,
	"exam_link_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exam_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"exam_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_link" (
	"id" uuid PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"form_version_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_versions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"form_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_link" (
	"id" uuid PRIMARY KEY NOT NULL,
	"note_id" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions_to_exam_versions" (
	"question_id" uuid NOT NULL,
	"exam_version_id" uuid NOT NULL,
	CONSTRAINT "questions_to_exam_versions_question_id_exam_version_id_pk" PRIMARY KEY("question_id","exam_version_id")
);
--> statement-breakpoint
CREATE TABLE "questions_to_form_versions" (
	"question_id" uuid NOT NULL,
	"form_version_id" uuid NOT NULL,
	CONSTRAINT "questions_to_form_versions_question_id_form_version_id_pk" PRIMARY KEY("question_id","form_version_id")
);
--> statement-breakpoint
ALTER TABLE "exam_response" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "questions_to_exams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "questions_to_forms" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "share_link" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "share_links_to_exams" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "share_links_to_forms" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "exam_response" CASCADE;--> statement-breakpoint
DROP TABLE "questions_to_exams" CASCADE;--> statement-breakpoint
DROP TABLE "questions_to_forms" CASCADE;--> statement-breakpoint
DROP TABLE "share_link" CASCADE;--> statement-breakpoint
DROP TABLE "share_links_to_exams" CASCADE;--> statement-breakpoint
DROP TABLE "share_links_to_forms" CASCADE;--> statement-breakpoint
ALTER TABLE "form_response" DROP CONSTRAINT "form_response_share_link_id_share_link_id_fk";
--> statement-breakpoint
ALTER TABLE "question" ALTER COLUMN "min" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "question" ALTER COLUMN "max" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "question" ALTER COLUMN "step" SET DATA TYPE real;--> statement-breakpoint
ALTER TABLE "exam" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "exam" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "exam" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "form_response" ADD COLUMN "username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "form_response" ADD COLUMN "form_version_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "form_response" ADD COLUMN "form_link_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "form_response" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "form_response" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "form" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "question" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artifact" ADD CONSTRAINT "artifact_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_link" ADD CONSTRAINT "exam_link_exam_version_id_exam_versions_id_fk" FOREIGN KEY ("exam_version_id") REFERENCES "public"."exam_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_link" ADD CONSTRAINT "exam_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_result" ADD CONSTRAINT "exam_result_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_result" ADD CONSTRAINT "exam_result_exam_id_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_result" ADD CONSTRAINT "exam_result_exam_version_id_exam_versions_id_fk" FOREIGN KEY ("exam_version_id") REFERENCES "public"."exam_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_result" ADD CONSTRAINT "exam_result_exam_link_id_exam_link_id_fk" FOREIGN KEY ("exam_link_id") REFERENCES "public"."exam_link"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_versions" ADD CONSTRAINT "exam_versions_exam_id_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "public"."exam"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_link" ADD CONSTRAINT "form_link_form_version_id_form_versions_id_fk" FOREIGN KEY ("form_version_id") REFERENCES "public"."form_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_link" ADD CONSTRAINT "form_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_versions" ADD CONSTRAINT "form_versions_form_id_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."form"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_link" ADD CONSTRAINT "note_link_note_id_note_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."note"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions_to_exam_versions" ADD CONSTRAINT "questions_to_exam_versions_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions_to_exam_versions" ADD CONSTRAINT "questions_to_exam_versions_exam_version_id_exam_versions_id_fk" FOREIGN KEY ("exam_version_id") REFERENCES "public"."exam_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions_to_form_versions" ADD CONSTRAINT "questions_to_form_versions_question_id_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."question"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions_to_form_versions" ADD CONSTRAINT "questions_to_form_versions_form_version_id_form_versions_id_fk" FOREIGN KEY ("form_version_id") REFERENCES "public"."form_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_response" ADD CONSTRAINT "form_response_form_version_id_form_versions_id_fk" FOREIGN KEY ("form_version_id") REFERENCES "public"."form_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_response" ADD CONSTRAINT "form_response_form_link_id_form_link_id_fk" FOREIGN KEY ("form_link_id") REFERENCES "public"."form_link"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam" DROP COLUMN "answers";--> statement-breakpoint
ALTER TABLE "form_response" DROP COLUMN "share_link_id";