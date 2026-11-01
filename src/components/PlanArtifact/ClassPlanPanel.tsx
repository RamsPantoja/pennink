"use client";

import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { PlanArtifactEditor } from "./PlanArtifactEditor";

export function ClassPlanPanel() {
  const classPlanId = useWorkspaceStore((state) => state.classPlanId);

  if (!classPlanId) return null;

  return <PlanArtifactEditor id={classPlanId} embedded />;
}
