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

type ReaderEventType =
	| "reader-on-summarize"
	| "reader-on-explain"
	| "reader-on-chat";

type ReaderEvent = {
	type: ReaderEventType;
	data: string;
};

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
	formData: AiForm | null;
	setFormData: (formData: AiForm | null) => void;
	currentForm: CurrentForm | null;
	setCurrentForm: (form: CurrentForm) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
	workspaceTitle: "",
	document: null,
	formData: null,
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
	setFormData: (formData) => set(() => ({ formData })),
}));
