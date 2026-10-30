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
