import { type Config } from "tailwindcss";
import { nextui } from "@nextui-org/theme";

export default {
	darkMode: ["class"],
	content: [
		"./src/**/*.tsx",
		"./node_modules/@nextui-org/theme/dist/components/(slider|snippet).js",
	],
	theme: {
		fontFamily: {
			sans: ["__Nunito_14f33d", "__Nunito_Fallback_14f33d", "sans-serif"],
			serif: ["__Nunito_14f33d", "__Nunito_Fallback_14f33d", "serif"],
		},
		extend: {
			colors: {
				mochaBase: "#1e1e2e",
				mochaMantle: "#181825",
				mochaText: "#cdd6f4",
				mochaSubText: "#bac2de",
				mochaLavender: "#b4befe",
				mochaMauve: "#cba6f7",
				mochaCrust: "#181926",
				mochaTeal: "#a6e3a1",
				sidebar: {
					DEFAULT: "var(--sidebar-background)",
					foreground: "var(--sidebar-foreground)",
					primary: "var(--sidebar-primary)",
					"primary-foreground": "var(--sidebar-primary-foreground)",
					accent: "var(--sidebar-accent)",
					"accent-foreground": "var(--sidebar-accent-foreground)",
					border: "var(--sidebar-border)",
					ring: "var(--sidebar-ring)",
				},
			},
			borderRadius: {
				lg: "0.5rem",
				md: "calc(0.5rem - 2px)",
				sm: "calc(0.5rem - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: {
						height: "0",
					},
					to: {
						height: "var(--radix-accordion-content-height)",
					},
				},
				"accordion-up": {
					from: {
						height: "var(--radix-accordion-content-height)",
					},
					to: {
						height: "0",
					},
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
			},
		},
	},
	plugins: [require("tailwindcss-animate"), nextui()],
} satisfies Config;
