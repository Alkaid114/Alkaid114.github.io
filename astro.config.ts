// @ts-check

import { existsSync, watch } from "node:fs";
import path from "node:path";
import { satteri } from "@astrojs/markdown-satteri";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { mirrordown } from "@mirrordown/preset-satteri";
import { katex } from "@nullpinter/satteri-katex";
import tailwindcss from "@tailwindcss/vite";
import type { AstroUserConfig } from "astro";
import { defineConfig, fontProviders } from "astro/config";
import expressiveCode from "astro-expressive-code";
import icon from "astro-icon";

const mdPlugins = mirrordown({ features: { math: true } });

// https://astro.build/config
export default defineConfig({
	site: "https://example.com",
	integrations: [expressiveCode(), mdx(), sitemap(), icon()],

	markdown: {
		syntaxHighlight: { type: "shiki", excludeLangs: ["mermaid"] },
		processor: satteri({
			...mdPlugins,
			mdastPlugins: [...(mdPlugins.mdastPlugins || []), katex()],
		}),
	},

	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: "Inter",
			cssVariable: "--font-inter",
			weights: [400, 500, 600, 700],
			styles: ["normal"],
			subsets: ["latin"],
			display: "swap",
			fallbacks: [
				"PingFang SC",
				"Hiragino Sans GB",
				"Microsoft YaHei",
				"Noto Sans CJK SC",
				"Source Han Sans SC",
				"ui-sans-serif",
				"system-ui",
				"sans-serif",
			],
		},
		{
			provider: fontProviders.fontsource(),
			name: "JetBrains Mono",
			cssVariable: "--font-jetbrains-mono",
			weights: [400, 700],
			styles: ["normal"],
			subsets: ["latin"],
			display: "swap",
			fallbacks: [
				"ui-monospace",
				"SFMono-Regular",
				"Menlo",
				"Monaco",
				"Consolas",
				"Liberation Mono",
				"Courier New",
				"Sarasa Mono SC",
				"Noto Sans Mono CJK SC",
				"monospace",
			],
		},
	] satisfies NonNullable<AstroUserConfig["fonts"]>,

	vite: {
		plugins: [
			{
				// Vite 8.3.x bundles a patched chokidar that only watches the top
				// level of src, so nested pages and components never trigger HMR.
				// Forward fs.watch events into Vite's watcher until that is fixed.
				name: "watch-src-fix",
				configureServer(server) {
					const src = path.resolve("src");
					const watcher = watch(src, { recursive: true }, (event, file) => {
						if (!file) return;
						const abs = path.join(src, file);
						const type = event === "rename" ? (existsSync(abs) ? "add" : "unlink") : "change";
						server.watcher.emit(type, abs);
					});
					server.httpServer?.on("close", () => watcher.close());
				},
			},
			tailwindcss(),
		],
	},
});
