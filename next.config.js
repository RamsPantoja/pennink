/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
	reactStrictMode: true,
	/**
	 * If you are using `appDir` then you must comment the below `i18n` config out.
	 *
	 * @see https://github.com/vercel/next.js/issues/41980
	 */
	webpack: (config, { isServer }) => {
		config.resolve.alias.canvas = false;

		// If client-side, don't polyfill `fs`
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
			};
		}

		return config;
	},
	i18n: {
		locales: ["en"],
		defaultLocale: "en",
	},
	transpilePackages: ["geist"],
};

export default config;
