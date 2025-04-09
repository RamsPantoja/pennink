import { create } from "zustand";
import type EditorJS from "@editorjs/editorjs";

type WorkspaceStore = {
	editorJS: EditorJS | null;
	setEditorJS: (editorJS: EditorJS | null) => void;
};

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
	editorJS: null,
	setEditorJS: (editorJS) => set(() => ({ editorJS })),
}));
