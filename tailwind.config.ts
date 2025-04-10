import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/theme";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
	darkMode: ["class"],
	content: [
		"./src/**/*.tsx",
		"./node_modules/@nextui-org/theme/dist/components/(slider|snippet).js",
	],
	theme: {
		fontFamily: {
			sans: [...fontFamily.sans],
		},
		extend: {
			colors: {
				mochaBase: "#ffffff",
				mochaMantle: "#f6f6f6",
				mochaText: "#4c4f69",
				mochaSubText: "#5c5f77",
				mochaSubtext1: "#6c6f85",
				mochaLavender: "#7287fd",
				mochaMauve: "#000000",
				mochaCrust: "#fafafa",
				mochaTeal: "#f9dcf8",
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
