CREATE TABLE IF NOT EXISTS "artifact" (
	"id" uuid PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"type" text NOT NULL,
	"key" text NOT NULL UNIQUE,
	"bucket" text NOT NULL,
	"size" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"workspace_id" uuid,
	"chat_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "artifact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id"),
	CONSTRAINT "artifact_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id"),
	CONSTRAINT "artifact_chat_id_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "chat"("id")
);
