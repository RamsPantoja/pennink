import { create } from "zustand";
import type EditorJS from "@editorjs/editorjs";

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
};

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
	editorJS: null,
	setEditorJS: (editorJS) => set(() => ({ editorJS })),
	document: null,
	setDocument: (document) => set(() => ({ document })),
}));
