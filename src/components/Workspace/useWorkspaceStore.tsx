import { create } from "zustand";
import type { BlockNoteEditor } from "@blocknote/core";
import type { AiForm } from "~/lib/schemas/aiForm";
import type { FormType } from "~/lib/enum";
import type { RouterOutputs } from "~/utils/api";

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

export type FormContext = {
	label: string;
	type: "form";
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

export type ContextEntity =
	| ThreadContext
	| DocumentContext
	| EditorContext
	| FormContext;

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
	queryFormData: RouterOutputs["form"]["getData"] | null;
	setQueryFormData: (data: RouterOutputs["form"]["getData"] | null) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
	workspaceTitle: "",
	aiContextItems: [
		{
			label: "Editor",
			type: "editor",
		},
	],
	queryFormData: null,
	document: null,
	aiFormData: null,
	currentForm: null,
	setCurrentForm: (form) => set(() => ({ currentForm: form })),
	setDocument: (document) => set(() => ({ document })),
	readerEvent: null,
	setReaderEvent: (event) => set(() => ({ readerEvent: event })),
	setWorkspaceTitle: (title) => set(() => ({ workspaceTitle: title })),
	editor: null,
	setEditor: (editor) => set(() => ({ editor })),
	displayFormEditor: false,
	setDisplayFormEditor: (displayFormEditor) =>
		set(() => ({ displayFormEditor })),
	setAiFormData: (data) => set(() => ({ aiFormData: data })),
	setAiContextItems: (items) => set((state) => ({ aiContextItems: items })),
	setQueryFormData: (data) => set(() => ({ queryFormData: data })),
}));
