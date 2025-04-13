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

type WorkspaceStore = {
	editorJS: EditorJS | null;
	setEditorJS: (editorJS: EditorJS | null) => void;
	document: PenninkDocument | null;
	setDocument: (document: PenninkDocument | null) => void;
	messages: Message[];
	setMessages: (messages: Message[]) => void;

	chatIsPending: boolean;
	setChatIsPending: (isPending: boolean) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
	editorJS: null,
	setEditorJS: (editorJS) => set(() => ({ editorJS })),
	document: null,
	setDocument: (document) => set(() => ({ document })),
	messages: [],
	setMessages: (messages) => set(() => ({ messages })),
	chatIsPending: false,
	setChatIsPending: (isPending) => set(() => ({ chatIsPending: isPending })),
}));
