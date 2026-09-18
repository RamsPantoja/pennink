import { create } from "zustand";
import type { FormType } from "~/lib/enum";
import type { RouterOutputs } from "~/utils/api";
import type { AiForm } from "~/app/agents/chat/schema";

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
	| FormContext;

export type AgentActivity = "idle" | "thinking" | "speaking" | "error";
export type AudioState = "idle" | "loading" | "playing" | "error";

export type CurrentForm = {
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
	agentActivity: AgentActivity;
	setAgentActivity: (activity: AgentActivity) => void;
	audioState: AudioState;
	setAudioState: (state: AudioState) => void;
	displayFormEditor: boolean;
	setDisplayFormEditor: (displayFormEditor: boolean) => void;
	aiFormData: AiForm | null;
	setAiFormData: (data: AiForm | null) => void;
	currentForm: CurrentForm | null;
	setCurrentForm: (form: CurrentForm | null) => void;
	aiContextItems: ContextEntity[];
	setAiContextItems: (items: ContextEntity[]) => void;
	queryFormData: RouterOutputs["form"]["getData"] | null;
	setQueryFormData: (data: RouterOutputs["form"]["getData"] | null) => void;
	resetWorkspaceStore: () => void;
};

const initialStore = {};

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
	workspaceTitle: "",
	aiContextItems: [
	],
	queryFormData: null,
	document: null,
	aiFormData: null,
	currentForm: null,
	readerEvent: null,
	agentActivity: "idle",
	audioState: "idle",
	displayFormEditor: false,
	setCurrentForm: (form) => set(() => ({ currentForm: form })),
	setDocument: (document) => set(() => ({ document })),
	setReaderEvent: (event) => set(() => ({ readerEvent: event })),
	setWorkspaceTitle: (title) => set(() => ({ workspaceTitle: title })),
	setAgentActivity: (agentActivity) => set(() => ({ agentActivity })),
	setAudioState: (audioState) => set(() => ({ audioState })),
	setDisplayFormEditor: (displayFormEditor) =>
		set(() => ({ displayFormEditor })),
	setAiFormData: (data) => set(() => ({ aiFormData: data })),
	setAiContextItems: (items) => set((state) => ({ aiContextItems: items })),
	setQueryFormData: (data) => set(() => ({ queryFormData: data })),
	resetWorkspaceStore: () =>
		set(() => ({
			workspaceTitle: "",
			aiContextItems: [],
			queryFormData: null,
			document: null,
			aiFormData: null,
			currentForm: null,
			readerEvent: null,
			agentActivity: "idle",
			audioState: "idle",
			displayFormEditor: false,
		})),
}));
