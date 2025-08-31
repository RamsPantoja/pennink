import { create } from "zustand";
import type { BlockNoteEditor } from "@blocknote/core";
import type { AiForm } from "~/lib/schemas/aiForm";
import type { FormType } from "~/lib/enum";

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

type CurrentForm = {
	id: string;
	type: FormType;
};

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
	aiFormData: AiForm | null;
	setAiFormData: (data: AiForm | null) => void;
	currentForm: CurrentForm | null;
	setCurrentForm: (form: CurrentForm) => void;
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
	aiFormData: null,
	currentForm: {
		id: "0198f93b-0c45-76fc-b78a-e82b601c4037",
		type: "BASIC",
	},
	setCurrentForm: (form) => set(() => ({ currentForm: form })),
	setDocument: (document) => set(() => ({ document })),
	readerEvent: null,
	setReaderEvent: (event) => set(() => ({ readerEvent: event })),
	setWorkspaceTitle: (title) => set(() => ({ workspaceTitle: title })),
	editor: null,
	setEditor: (editor) => set(() => ({ editor })),
	displayFormEditor: true,
	setDisplayFormEditor: (displayFormEditor) =>
		set(() => ({ displayFormEditor })),
	setAiFormData: (data) => set(() => ({ aiFormData: data })),
	setAiContextItems: (items) => set((state) => ({ aiContextItems: items })),
}));
