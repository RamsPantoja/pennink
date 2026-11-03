"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import "@blocknote/shadcn/style.css";
import type { Block } from "@blocknote/core";
import { normalizeBlockNoteContent } from "~/lib/blocknote";
import type { RouterOutputs } from "~/utils/api";
import { api } from "~/trpc/react";
import { Empty, EmptyHeader, EmptyTitle } from "../ui/empty";
import { Skeleton } from "../ui/skeleton";

type PlanArtifactData = NonNullable<RouterOutputs["planArtifact"]["byId"]>;

const AUTO_SAVE_DELAY_MS = 1000;

export function PlanArtifactEditor({ id }: { id: string }) {
  const t = useTranslations("PlanArtifact");
  const {
    data: plan,
    isLoading,
    isError,
  } = api.planArtifact.byId.useQuery({
    id,
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (isError || !plan) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>{t("notFound")}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

  return <PlanArtifactContent key={plan.id} plan={plan} />;
}

function PlanArtifactContent({ plan }: { plan: PlanArtifactData }) {
  const t = useTranslations("PlanArtifact");
  const utils = api.useUtils();
  const [dirty, setDirty] = useState(false);

  // Plans created by the agent have markdown only; their blocks are parsed on mount.
  const savedBlocks = normalizeBlockNoteContent(plan.blocks);
  const editor = useCreateBlockNote({ initialContent: savedBlocks });

  // Auto-save starts only after the initial content is loaded, so the markdown
  // parse does not count as an edit.
  const readyRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = api.planArtifact.update.useMutation({
    onSuccess: () => {
      // Edits made while the request was in flight keep the plan dirty.
      if (!saveTimer.current) setDirty(false);
      void utils.planArtifact.listAll.invalidate();
      void utils.planArtifact.byId.invalidate({ id: plan.id });
    },
  });

  const clearAutoSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = undefined;
  }, []);

  const scheduleAutoSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = undefined;
      runSaveRef.current();
    }, AUTO_SAVE_DELAY_MS);
  }, []);

  const markEdited = useCallback(() => {
    setDirty(true);
    if (readyRef.current) scheduleAutoSave();
  }, [scheduleAutoSave]);

  useEffect(() => {
    if (savedBlocks || !plan.content) {
      readyRef.current = true;
      return;
    }

    let active = true;
    void (async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(plan.content);
      if (!active) return;
      editor.replaceBlocks(editor.document, blocks);
      setDirty(false);
      readyRef.current = true;
    })();

    return () => {
      active = false;
    };
  }, [editor, savedBlocks, plan.content]);

  useEffect(() => editor.onChange(markEdited), [editor, markEdited]);

  useEffect(() => {
    if (!dirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Name and dates are changed in the settings dialog, so auto-save sends only the content.
  const persist = () => {
    clearAutoSave();
    const blocks = editor.document as Block[];
    update.mutate({
      id: plan.id,
      content: editor.blocksToMarkdownLossy(blocks),
      blocks,
    });
  };

  const save = () => {
    // Only one request at a time: retry once the current one finishes.
    if (update.isPending) {
      scheduleAutoSave();
      return;
    }
    persist();
  };

  // Keep the latest callbacks reachable from timers and the unmount cleanup.
  const runSaveRef = useRef(save);
  runSaveRef.current = save;
  const persistRef = useRef(persist);
  persistRef.current = persist;

  // Save pending edits when the panel closes or switches to another plan.
  useEffect(
    () => () => {
      if (saveTimer.current) persistRef.current();
    },
    [],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      save();
    }
  };

  return (
    <div
      className="flex w-full flex-col gap-4 pl-3 pb-3 pr-3 overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {update.isError && (
        <p className="text-destructive text-sm">{t("saveError")}</p>
      )}

      <div className="overflow-auto flex w-full h-full">
        <BlockNoteView
          style={
            { "--bn-colors-editor-background": "transparent" } as CSSProperties
          }
          editor={editor}
          theme={"dark"}
        />
      </div>
    </div>
  );
}
