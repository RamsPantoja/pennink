import { create } from "zustand";
import type EditorJS from "@editorjs/editorjs";
import type { ChatValidationSchema } from "../Chat/useChatLogic";
import type { Message } from "~/server/api/services/chat";

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

type WorkspaceStore = {
	document: PenninkDocument | null;
	setDocument: (document: PenninkDocument | null) => void;
	readerEvent: ReaderEvent | null;
	setReaderEvent: (event: ReaderEvent | null) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
	document: null,
	setDocument: (document) => set(() => ({ document })),
	readerEvent: null,
	setReaderEvent: (event) => set(() => ({ readerEvent: event })),
}));
