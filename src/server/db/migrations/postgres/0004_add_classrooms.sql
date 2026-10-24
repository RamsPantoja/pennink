CREATE TABLE "classroom" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "student" (
  "id" uuid PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classroom_teacher" (
  "classroom_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  CONSTRAINT "classroom_teacher_classroom_id_user_id_pk" PRIMARY KEY("classroom_id", "user_id")
);
--> statement-breakpoint
CREATE TABLE "classroom_student" (
  "classroom_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "email" text NOT NULL,
  CONSTRAINT "classroom_student_classroom_id_student_id_pk" PRIMARY KEY("classroom_id", "student_id"),
  CONSTRAINT "classroom_student_email_unique" UNIQUE("classroom_id", "email")
);
--> statement-breakpoint
ALTER TABLE "classroom_teacher" ADD CONSTRAINT "classroom_teacher_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "classroom_teacher" ADD CONSTRAINT "classroom_teacher_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "classroom_student" ADD CONSTRAINT "classroom_student_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "classroom_student" ADD CONSTRAINT "classroom_student_student_id_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TEMP TABLE "user_classroom_backfill" AS
SELECT "id" AS "user_id", gen_random_uuid() AS "classroom_id"
FROM "user";
--> statement-breakpoint
INSERT INTO "classroom" ("id", "name")
SELECT "classroom_id", 'My classroom'
FROM "user_classroom_backfill";
--> statement-breakpoint
INSERT INTO "classroom_teacher" ("classroom_id", "user_id")
SELECT "classroom_id", "user_id"
FROM "user_classroom_backfill";
--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "classroom_id" uuid;
--> statement-breakpoint
UPDATE "workspace" AS workspace
SET "classroom_id" = backfill."classroom_id"
FROM "user_classroom_backfill" AS backfill
WHERE workspace."user_id" = backfill."user_id";
--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "classroom_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_classroom_id_classroom_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "classroom"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
DROP TABLE "user_classroom_backfill";
