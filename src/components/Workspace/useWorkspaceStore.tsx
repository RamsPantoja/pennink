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

export type AgentActivity = "idle" | "thinking" | "speaking" | "error";
export type AudioState = "idle" | "loading" | "playing" | "error";

export type CurrentForm = {
	id: string;
	type: FormType;
};

type WorkspaceStore = {
	workspaceTitle: string;
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
	queryFormData: RouterOutputs["form"]["getData"] | null;
	setQueryFormData: (data: RouterOutputs["form"]["getData"] | null) => void;
	resetWorkspaceStore: () => void;
};

const initialStore = {};

export const useWorkspaceStore = create<WorkspaceStore>()((set) => ({
	workspaceTitle: "",
	queryFormData: null,
	aiFormData: null,
	currentForm: null,
	agentActivity: "idle",
	audioState: "idle",
	displayFormEditor: false,
	setCurrentForm: (form) => set(() => ({ currentForm: form })),
	setWorkspaceTitle: (title) => set(() => ({ workspaceTitle: title })),
	setAgentActivity: (agentActivity) => set(() => ({ agentActivity })),
	setAudioState: (audioState) => set(() => ({ audioState })),
	setDisplayFormEditor: (displayFormEditor) =>
		set(() => ({ displayFormEditor })),
	setAiFormData: (data) => set(() => ({ aiFormData: data })),
	setQueryFormData: (data) => set(() => ({ queryFormData: data })),
	resetWorkspaceStore: () =>
		set(() => ({
			workspaceTitle: "",
			queryFormData: null,
			aiFormData: null,
			currentForm: null,
			agentActivity: "idle",
			audioState: "idle",
			displayFormEditor: false,
		})),
}));
