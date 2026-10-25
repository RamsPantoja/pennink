import { useEffect } from "react";

export const SHARED_THEME = "dark";

export const useSharedTheme = () => {
	useEffect(() => {
		const root = document.documentElement;
		const previous = root.getAttribute("data-theme");

		root.setAttribute("data-theme", SHARED_THEME);

		return () => {
			if (previous === null) {
				root.removeAttribute("data-theme");
			} else {
				root.setAttribute("data-theme", previous);
			}
		};
	}, []);

	return SHARED_THEME;
};
