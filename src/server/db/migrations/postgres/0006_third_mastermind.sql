CREATE TABLE "plan_artifact_workspace" (
	"plan_artifact_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	CONSTRAINT "plan_artifact_workspace_plan_artifact_id_workspace_id_pk" PRIMARY KEY("plan_artifact_id","workspace_id")
);
--> statement-breakpoint
ALTER TABLE "plan_artifact_workspace" ADD CONSTRAINT "plan_artifact_workspace_plan_artifact_id_plan_artifact_id_fk" FOREIGN KEY ("plan_artifact_id") REFERENCES "public"."plan_artifact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_artifact_workspace" ADD CONSTRAINT "plan_artifact_workspace_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;