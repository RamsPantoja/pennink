"use client";
import {
  ArrowDownTrayIcon,
  CircleStackIcon,
  ListBulletIcon,
  MagnifyingGlassIcon,
  SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { sileo } from "sileo";
import { Feedback } from "~/components/Feedback";
import { AppSidebar } from "~/components/Sidebar";
import { useWorkspaceStore } from "~/components/Workspace/useWorkspaceStore";
import { Button } from "~/components/common/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import useUploadObjectToStorage from "~/hooks/useUploadObjectToStorage";
import { fileSizeRule } from "~/lib/utils";
import {
  SOURCE_ACCEPT,
  getSourceDocumentType,
} from "~/lib/documentTypes";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import PomodoroTimer from "~/components/Pomodoro";
import { FormLoader } from "~/components/Workspace/FormLoader";
import { SessionProvider } from "next-auth/react";
import { api } from "~/trpc/react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { DocumentLoader } from "~/components/Workspace/DocumentLoader";
import { useTranslations } from "next-intl";

type DashboardProps = {
  session: Session;
  children: ReactNode;
};

const Dashboard = ({ children, session }: DashboardProps) => {
  const t = useTranslations("Dashboard");
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const utils = api.useUtils();
  const [openDocumentLoader, setOpenDocumentLoader] = useState<boolean>(false);
  const workspaceId = params?.workspaceId;
  const { loading: uploadingFile, onUploadFile } = useUploadObjectToStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCurrentForm, setDisplayFormEditor, resetWorkspaceStore } =
    useWorkspaceStore();
  const [isReadingPDF, setIsReadingPDF] = useState<boolean>(false);
  const [openFormLoader, setOpenFormLoader] = useState<boolean>(false);

  const { mutate: createFile, isPending: createFileIsPending } =
    api.workspace.createFile.useMutation({
      onSuccess: async (data) => {
        sileo.show({ title: t("toast.success.upload") });
        await utils.user.statics.invalidate();
        await utils.workspace.filesByUserId.invalidate();
        await utils.workspace.sourcesByWorkspace.invalidate();
      },
      onError: (error) => {
        sileo.show({ title: error.message });
      },
    });

  const { mutate: attachSource } = api.workspace.attachSource.useMutation({
    onSuccess: async () => {
      setOpenDocumentLoader(false);
      await utils.workspace.sourcesByWorkspace.invalidate();
    },
    onError: (error) => {
      sileo.show({ title: error.message });
    },
  });

  const { mutate: initStaticsMutation } = api.user.initStatics.useMutation();

  useEffect(() => {
    initStaticsMutation();
  }, []);

  const {
    mutateAsync: triggerUploadFilesRuleMutation,
    isPending: triggerUploadFilesRuleIsPending,
  } = api.workspace.triggerUploadFilesRule.useMutation({
    onError: (error) => {
      sileo.show({ title: error.message });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickedFile = e.target.files?.[0];

    if (!pickedFile) return;

    const ruleRes = fileSizeRule({
      file: pickedFile,
      session,
    });

    if (!ruleRes.isValid) return;

    const documentType = getSourceDocumentType(pickedFile);

    if (!documentType) {
      sileo.show({ title: t("toast.error.invalidFileType") });
      return;
    }

    // Browsers report an empty MIME type for some files (e.g. .md); store the resolved one
    const selectedFile =
      documentType === pickedFile.type
        ? pickedFile
        : new File([pickedFile], pickedFile.name, { type: documentType });

    if (documentType === "application/pdf") {
      setIsReadingPDF(true);
      const loader = new WebPDFLoader(selectedFile);
      const docs = await loader.load();
      setIsReadingPDF(false);

      if (docs.length === 0) {
        sileo.show({ title: t("toast.error.noPages") });
        return;
      }

      if (docs.length > 50) {
        sileo.show({ title: t("toast.error.tooManyPages", { count: docs.length }) });
        return;
      }
    }

    try {
      await triggerUploadFilesRuleMutation();

      if (typeof workspaceId !== "string") {
        sileo.show({ title: t("toast.error.invalidWorkspaceId") });
        return;
      }

      sileo.show({ title: t("toast.info.processing") });

      const res = await onUploadFile({
        file: selectedFile,
        path: `workspace/documents/${session.user.id}`,
      });

      if (!res) {
        return;
      }

      createFile({
        type: documentType,
        filename: selectedFile.name,
        key: res.key,
        workspaceId,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onNewWorkspace = async () => {
    router.push("/");
    resetWorkspaceStore();
  };

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <TooltipProvider delayDuration={300}>
          <Input
            ref={fileInputRef}
            type="file"
            accept={SOURCE_ACCEPT}
            className="hidden"
            onChange={handleFileChange}
            data-testid="file-input"
          />
          <AppSidebar session={session} />
          <FormLoader
            onOpen={(form) => {
              setDisplayFormEditor(true);
              setCurrentForm(form);
              setOpenFormLoader(false);
            }}
            open={openFormLoader}
            onOpenChange={setOpenFormLoader}
          />
          <DocumentLoader
            onSelect={(doc) => {
              if (typeof workspaceId !== "string") {
                sileo.show({ title: t("toast.error.invalidWorkspaceId") });
                return;
              }

              attachSource({ workspaceId, fileId: doc.id });
            }}
            open={openDocumentLoader}
            onOpenChange={setOpenDocumentLoader}
          />
          <main className=" flex h-full w-full flex-col overflow-hidden">
            <div className="flex p-2 gap-4 items-center justify-between w-full border-b border-border">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="min-w-8 h-8">
                  <span>{t("sidebar.toggle")}</span>
                </SidebarTrigger>
                <p className="text-xs text-muted-foreground">
                  {t("sidebar.shortcut")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pathname !== "/" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setOpenFormLoader(true);
                        }}
                      >
                        <ListBulletIcon className="min-w-5 w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("tooltips.searchForms")}</TooltipContent>
                  </Tooltip>
                )}
                {pathname !== "/" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenDocumentLoader(true);
                        }}
                      >
                        <CircleStackIcon className="min-w-5 w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("tooltips.searchSources")}
                    </TooltipContent>
                  </Tooltip>
                )}
                {pathname !== "/" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="ghost"
                        size="icon"
                        isPending={
                          uploadingFile ||
                          createFileIsPending ||
                          triggerUploadFilesRuleIsPending ||
                          isReadingPDF
                        }
                      >
                        <ArrowDownTrayIcon className="min-w-5 w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t("dropdown.importPDF")}</TooltipContent>
                  </Tooltip>
                )}
                {pathname !== "/" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={onNewWorkspace}
                        variant="ghost"
                        size="icon"
                      >
                        <SquaresPlusIcon className="min-w-5 w-5 h-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("tooltips.newWorkspace")}
                    </TooltipContent>
                  </Tooltip>
                )}
                {pathname !== "/" && <PomodoroTimer />}
                <Feedback session={session} />
              </div>
            </div>
            <div className="flex w-full h-full gap-2 overflow-hidden">
              {children}
            </div>
          </main>
        </TooltipProvider>
      </SidebarProvider>
    </SessionProvider>
  );
};

export default Dashboard;
