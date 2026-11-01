import { create } from "zustand";
import type { FormType } from "~/lib/enum";
import type { RouterOutputs } from "~/utils/api";
import type { AiForm } from "~/app/agents/chat/schema";
import type { MindMap } from "~/app/agents/chat/mind-map";

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
	displayMindMap: boolean;
	setDisplayMindMap: (displayMindMap: boolean) => void;
	displayClassPlan: boolean;
	setDisplayClassPlan: (displayClassPlan: boolean) => void;
	classPlanId: string | null;
	setClassPlanId: (id: string | null) => void;
	mindMapData: MindMap | null;
	setMindMapData: (data: MindMap | null) => void;
	currentForm: CurrentForm | null;
	setCurrentForm: (form: CurrentForm | null) => void;
	queryFormData: RouterOutputs["form"]["getData"] | null;
	setQueryFormData: (data: RouterOutputs["form"]["getData"] | null) => void;
	contextTokens: number | null;
	setContextTokens: (tokens: number | null) => void;
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
	displayMindMap: false,
	mindMapData: null,
	displayClassPlan: false,
	classPlanId: null,
	contextTokens: null,
	setContextTokens: (tokens) => set(() => ({ contextTokens: tokens })),
	setDisplayMindMap: (displayMindMap) =>
		set(() =>
			displayMindMap
				? { displayMindMap, displayClassPlan: false }
				: { displayMindMap },
		),
	setMindMapData: (data) => set(() => ({ mindMapData: data })),
	setDisplayClassPlan: (displayClassPlan) =>
		set(() =>
			displayClassPlan
				? { displayClassPlan, displayFormEditor: false, displayMindMap: false }
				: { displayClassPlan },
		),
	setClassPlanId: (id) => set(() => ({ classPlanId: id })),
	setCurrentForm: (form) => set(() => ({ currentForm: form })),
	setWorkspaceTitle: (title) => set(() => ({ workspaceTitle: title })),
	setAgentActivity: (agentActivity) => set(() => ({ agentActivity })),
	setAudioState: (audioState) => set(() => ({ audioState })),
	setDisplayFormEditor: (displayFormEditor) =>
		set(() =>
			displayFormEditor
				? { displayFormEditor, displayClassPlan: false }
				: { displayFormEditor },
		),
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
			displayMindMap: false,
			mindMapData: null,
			displayClassPlan: false,
			classPlanId: null,
			contextTokens: null,
		})),
}));
