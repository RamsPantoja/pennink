import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
	darkMode: ["class"],
	content: ["./src/**/*.tsx"],
	theme: {
		fontFamily: {
			sans: ["GeistMono", ...fontFamily.mono],
		},
		extend: {
			colors: {
				mochaBase: "#1f1f1f",
				mochaMantle: "#2a2a2a",
				mochaText: "#d1cfc0",
				mochaSubText: "#adab9f",
				mochaSubtext1: "#adab9f",
				mochaLavender: "#7287fd",
				mochaMauve: "#353535",
				mochaCrust: "#161616",
				mochaTeal: "#f76f53",
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
				"4xl": "1.5rem",
				"3xl": "calc(1.5rem - 2px)",
				"2xl": "calc(1rem + 2px)",
				xl: "1rem",
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
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
