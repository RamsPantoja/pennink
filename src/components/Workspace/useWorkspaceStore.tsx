import { create } from "zustand";
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
	workspaceTitle: string;
	document: PenninkDocument | null;
	setDocument: (document: PenninkDocument | null) => void;
	readerEvent: ReaderEvent | null;
	setReaderEvent: (event: ReaderEvent | null) => void;
	setWorkspaceTitle: (title: string) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
	workspaceTitle: "",
	document: null,
	setDocument: (document) => set(() => ({ document })),
	readerEvent: null,
	setReaderEvent: (event) => set(() => ({ readerEvent: event })),
	setWorkspaceTitle: (title) => set(() => ({ workspaceTitle: title })),
}));
