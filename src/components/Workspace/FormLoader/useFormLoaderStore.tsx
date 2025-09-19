import { create } from "zustand";
import type { FormType } from "~/lib/enum";

type CurrentForm = {
	id: string;
	type: FormType;
};

export type SelectedLink = {
	id: string;
	key: string;
	link: string;
};

export type BreadcrumbType = "links" | "results" | "overview";

type Breadcrumbs = {
	[x in BreadcrumbType]?: string;
};

type FormLoaderStore = {
	currentForm: CurrentForm | null;
	setCurrentForm: (form: CurrentForm | null) => void;
	currentLink: SelectedLink | null;
	setCurrentLink: (link: SelectedLink | null) => void;
	breadcrumbs: Breadcrumbs;
	setBreadcrumbs: (breadcrumbs: Breadcrumbs) => void;
	resultId: string | null;
	setResultId: (id: string | null) => void;
};

export const useFormLoaderStore = create<FormLoaderStore>()((set) => ({
	currentForm: null,
	currentLink: null,
	breadcrumbs: {
		links: "Links",
	},
	resultId: null,
	setCurrentForm: (form) => set(() => ({ currentForm: form })),
	setCurrentLink: (link) => set(() => ({ currentLink: link })),
	setBreadcrumbs: (breadcrumbs) => set(() => ({ breadcrumbs })),
	setResultId: (id) => set(() => ({ resultId: id })),
}));
