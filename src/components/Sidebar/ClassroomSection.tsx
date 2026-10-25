"use client";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { ClassroomDetails } from "../Classroom/ClassroomDetails";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../ui/dialog";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";
import { WorkspaceCard } from "./WorkspaceCard";

export function ClassroomSection({ id, name }: { id: string; name: string }) {
  const t = useTranslations("ClassroomSection");
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const { data: workspaces, isLoading } = api.workspace.workspaces.useQuery({
    classroomId: id,
  });

  useEffect(() => {
    if (workspaces?.some((workspace) => workspace.id === params?.workspaceId)) {
      setOpen(true);
    }
  }, [workspaces, params?.workspaceId]);

  return (
    <SidebarMenuItem>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            <p className="truncate font-semibold text-muted-foreground">
              {name}
            </p>
            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <SidebarMenuAction
          showOnHover
          aria-label={t("manage")}
          title={t("manage")}
          onClick={() => setManagerOpen(true)}
        >
          <Cog6ToothIcon />
        </SidebarMenuAction>
        <CollapsibleContent>
          {isLoading && (
            <SidebarMenuSubItem>
              <Skeleton className="h-8 w-full" />
            </SidebarMenuSubItem>
          )}
          {workspaces?.map((workspace) => (
            <WorkspaceCard
              key={workspace.id}
              id={workspace.id}
              name={workspace.name}
              selectedWorkspaceId={params?.workspaceId as string}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>

      <Dialog open={managerOpen} onOpenChange={setManagerOpen}>
        <DialogContent className="max-h-[90vh] w-full overflow-y-auto sm:max-w-5xl">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <DialogDescription className="sr-only">{t("manage")}</DialogDescription>
          <ClassroomDetails
            classroomId={id}
            onDeleted={() => setManagerOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </SidebarMenuItem>
  );
}
