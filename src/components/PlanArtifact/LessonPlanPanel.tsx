"use client";

import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { PlanArtifactEditor } from "./PlanArtifactEditor";

export function LessonPlanPanel() {
  const lessonPlanId = useWorkspaceStore((state) => state.lessonPlanId);

  if (!lessonPlanId) return null;

  return <PlanArtifactEditor id={lessonPlanId} />;
}
