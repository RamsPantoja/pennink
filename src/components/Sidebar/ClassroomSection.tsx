"use client";

import {
  ChevronDownIcon,
  ChevronRightIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
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
          <SidebarMenuButton isActive={params?.classroomId === id}>
            <p className="truncate font-semibold text-muted-foreground">
              {name}
            </p>
            {open ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <SidebarMenuAction asChild showOnHover>
          <Link
            href={`/classroom/${id}`}
            aria-label={t("manage")}
            title={t("manage")}
          >
            <Cog6ToothIcon />
          </Link>
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
    </SidebarMenuItem>
  );
}
