/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");
import createNextIntlPlugin from "next-intl/plugin";
const withNextIntl = createNextIntlPlugin();

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	/**
	 * Keep pdf-parse (and the langchain PDF loader that wraps it) out of the bundle. Bundling
	 * pdf.js pulls its web worker in as a static chunk named `*.worker.js`, which the browser
	 * then requests and the dev server 404s as text/plain. Externals are loaded by Node directly,
	 * where pdf.js falls back to its own worker without any browser fetch.
	 */
	serverExternalPackages: ["pdf-parse", "@langchain/community"],
	/**
	 * Turbopack is the default bundler in Next 16. `canvas` and `fs` are swapped for an empty
	 * module, and `fs` only on the client (don't polyfill it there).
	 */
	turbopack: {
		resolveAlias: {
			canvas: "./src/lib/empty-module.js",
			fs: { browser: "./src/lib/empty-module.js" },
		},
	},
};

export default withNextIntl(config);
