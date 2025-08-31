import { create } from "zustand";
import type { BlockNoteEditor } from "@blocknote/core";
import type { AiForm } from "~/lib/schemas/aiForm";

export type PenninkDocument = {
	id: string;
	filename: string;
	type: string;
	src: string;
};

export type ThreadContext = {
	id: string;
	label: string;
	type: "thread";
};

export type DocumentContext = {
	label: string;
	type: "document";
};

export type EditorContext = {
	label: string;
	type: "editor";
};

type ReaderEventType =
	| "reader-on-summarize"
	| "reader-on-explain"
	| "reader-on-chat";

type ReaderEvent = {
	type: ReaderEventType;
	data: string;
};

export type ContextEntity = ThreadContext | DocumentContext | EditorContext;

type WorkspaceStore = {
	workspaceTitle: string;
	document: PenninkDocument | null;
	setDocument: (document: PenninkDocument | null) => void;
	readerEvent: ReaderEvent | null;
	setReaderEvent: (event: ReaderEvent | null) => void;
	setWorkspaceTitle: (title: string) => void;
	editor: BlockNoteEditor | null;
	setEditor: (editor: BlockNoteEditor | null) => void;
	displayFormEditor: boolean;
	setDisplayFormEditor: (displayFormEditor: boolean) => void;
	formData: AiForm | null;
	setFormData: (formData: AiForm | null) => void;
	formId: string | null;
	setFormId: (formId: string | null) => void;
	aiContextItems: ContextEntity[];
	setAiContextItems: (items: ContextEntity[]) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
	workspaceTitle: "",
	aiContextItems: [
		{
			label: "Editor",
			type: "editor",
		},
	],
	document: null,
	formData: null,
	setDocument: (document) => set(() => ({ document })),
	readerEvent: null,
	setReaderEvent: (event) => set(() => ({ readerEvent: event })),
	setWorkspaceTitle: (title) => set(() => ({ workspaceTitle: title })),
	editor: null,
	setEditor: (editor) => set(() => ({ editor })),
	displayFormEditor: false,
	setDisplayFormEditor: (displayFormEditor) =>
		set(() => ({ displayFormEditor })),
	setFormData: (formData) => set(() => ({ formData })),
	formId: null,
	setFormId: (formId) => set(() => ({ formId })),
	setAiContextItems: (items) => set((state) => ({ aiContextItems: items })),
}));
