import { useEffect, useState } from "react";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import type { Message } from "~/server/api/services/chat";
import {
  EllipsisVerticalIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { toast } from "sonner";
import CustomAlertDialog from "../common/AlertDialog";
import { Input } from "../ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

type WorkspaceCardProps = {
  id: string;
  selectedWorkspaceId: string;
  name: string;
};

const workspaceNameSchemaValidation = z.object({
  name: z.string().min(2).max(100),
});

type WorkspaceNameForm = z.infer<typeof workspaceNameSchemaValidation>;

export const WorkspaceCard = ({
  id,
  selectedWorkspaceId,
  name,
}: WorkspaceCardProps) => {
  const t = useTranslations("WorkspaceCard");
  const router = useRouter();
  const { data: session } = useSession();
  const [workspaceName, setWorkspaceName] = useState<string>(name);
  const { setDocument } = useWorkspaceStore();
  const isActive = selectedWorkspaceId === id;
  const [displayDeleteWorkspaceAlert, setDisplayDeleteWorkspaceAlert] =
    useState<boolean>(false);
  const utils = api.useUtils();
  const [isWorkspaceNameEditable, setIsWorkspaceNameEditable] =
    useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
    watch,
  } = useForm<WorkspaceNameForm>({
    resolver: zodResolver(workspaceNameSchemaValidation),
    defaultValues: { name: workspaceName },
  });

  const {
    mutate: updateWorkspaceName,
    isPending: updateWorkspaceNameIsPending,
  } = api.workspace.updateName.useMutation({
    onSuccess: (data) => {
      localStorage.removeItem("buuddy.new-workspace-messages");
      setWorkspaceName(data.name);
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  const { mutate: deleteWorkspace, isPending: deleteWorkspaceIsPending } =
    api.workspace.deleteWorkspace.useMutation({
      onSuccess: async (data) => {
        setDisplayDeleteWorkspaceAlert(false);

        if (data.id === selectedWorkspaceId) {
          setDocument(null);
          router.push("/");
        }

        await utils.workspace.workspaces.invalidate();
      },
      onError: (error) => {
        console.error(error.message);
        toast.error(t("toast.error.deleteFailed"));
      },
    });

  const generateWorkspaceTitle = async (): Promise<string> => {
    const newWorkspaceMessages = localStorage.getItem(
      "buuddy.new-workspace-messages",
    );

    const messages: Message[] = [];

    if (!session) {
      throw new Error("User is not authenticated");
    }

    if (newWorkspaceMessages) {
      const newWorkspaceMessagesParsed = JSON.parse(
        newWorkspaceMessages,
      ) as Message[];

      messages.push(...newWorkspaceMessagesParsed);
    }

    const res = await fetch("/api/ai/workspace-title", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        context: {
          messages: messages.map((message) => ({
            content: message.content,
            role: message.role,
          })),
        },
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error("Failed to generate workspace title");
    }

    // Read the stream here, not in an effect: a Response body can only be
    // read once, so the query caches the final title string instead.
    const reader = res.body.getReader();
    const textDecoder = new TextDecoder();
    let title = "";

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (value) {
          title = title.concat(textDecoder.decode(value, { stream: !done }));
        }

        if (done) break;
      }
    } finally {
      reader.releaseLock();
    }

    return title;
  };

  const { data: workspaceTitleData, isLoading: isLoadingWorkspaceTitle } =
    useQuery({
      queryKey: ["workspace-title", id],
      queryFn: generateWorkspaceTitle,
      enabled: workspaceName === "..." && selectedWorkspaceId === id,
      staleTime: Infinity,
      retry: false,
    });

  useEffect(() => {
    if (
      !workspaceTitleData ||
      id !== selectedWorkspaceId ||
      workspaceName !== "..."
    ) {
      return;
    }

    setWorkspaceName(workspaceTitleData);
    updateWorkspaceName({
      id,
      name: workspaceTitleData,
    });
  }, [
    workspaceTitleData,
    id,
    selectedWorkspaceId,
    workspaceName,
    updateWorkspaceName,
  ]);

  const onDeleteWorkspace = () => {
    deleteWorkspace({
      id,
    });
  };

  useEffect(() => {
    if (isWorkspaceNameEditable) {
      setFocus("name");
    }
  }, [isWorkspaceNameEditable, setFocus]);

  return (
    <div className="flex items-center gap-4 justify-between">
      <CustomAlertDialog
        cancelText={t("deleteDialog.cancel")}
        actionText={t("deleteDialog.confirm")}
        title={t("deleteDialog.title")}
        description={t("deleteDialog.description")}
        onCancel={() => {
          setDisplayDeleteWorkspaceAlert(false);
        }}
        onAction={onDeleteWorkspace}
        isPending={deleteWorkspaceIsPending}
        open={displayDeleteWorkspaceAlert}
      />
      {isWorkspaceNameEditable && (
        <Input
          {...register("name")}
          onBlur={() => {
            setIsWorkspaceNameEditable(false);
            handleSubmit((data: WorkspaceNameForm) => {
              updateWorkspaceName({
                id,
                name: data.name,
              });
            })();
          }}
          placeholder={t("input.placeholder")}
        />
      )}
      {!isWorkspaceNameEditable && (
        <Link
          onClick={() => {
            setDocument(null);
          }}
          prefetch={false}
          href={`/workspace/${id}`}
          data-active={isActive}
          aria-current={isActive ? "page" : undefined}
          className={cn([
            "flex items-center gap-4 justify-between w-full rounded-md px-2 py-1.5",
            "data-active:bg-sidebar-accent data-active:font-medium data-active:text-sidebar-accent-foreground",
          ])}
        >
          <div className="flex items-center w-full justify-between">
            <span
              title={workspaceName}
              className={cn([
                "text-xs truncate w-full font-semibold",
                {
                  "animate-pulse":
                    updateWorkspaceNameIsPending || isLoadingWorkspaceTitle,
                },
              ])}
            >
              {workspaceName}
            </span>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="h-8 min-w-8 w-fit inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md"
              >
                <EllipsisVerticalIcon className="h-5 min-w-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="right"
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsWorkspaceNameEditable(true);
                  }}
                  className="flex gap-2"
                >
                  <PencilSquareIcon className="min-w-5 w-5 h-5" />
                  {t("menu.rename")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDisplayDeleteWorkspaceAlert(true);
                  }}
                  className="flex gap-2 text-red-500"
                >
                  <TrashIcon className="min-w-5 w-5 h-5" />
                  {t("menu.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Link>
      )}
    </div>
  );
};
