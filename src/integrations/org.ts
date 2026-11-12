import { fileURLToPath, pathToFileURL } from "node:url";
import type { AstroIntegration, ContentEntryType, HookParameters } from "astro";
import { orgEntry } from "../org";

export interface OrgOptions {
	// Posts directory, relative to the Astro project root
	base?: string;
}

type SetupParams = HookParameters<"astro:config:setup"> & {
	addContentEntryType: (entryType: ContentEntryType) => void;
};

// Register `.org` as a content entry type rendered through the configured Markdown processor.
export function org(options: OrgOptions = {}): AstroIntegration {
	return {
		name: "org",
		hooks: {
			"astro:config:setup": (params) => {
				const { config, addContentEntryType } = params as SetupParams;
				const baseDir = fileURLToPath(new URL(options.base ?? "./src/content/posts", config.root));

				addContentEntryType({
					extensions: [".org"],
					async getEntryInfo({ fileUrl, contents }) {
						const { data, body } = orgEntry({
							contents,
							filePath: fileURLToPath(fileUrl),
							baseDir,
						});
						const slug = typeof data.slug === "string" ? data.slug : "";
						return { data, body, slug, rawData: contents };
					},
					handlePropagation: true,
					async getRenderFunction(config) {
						const { markdown, image } = config;
						const renderer = await markdown.processor.createRenderer({
							image,
							syntaxHighlight: markdown.syntaxHighlight,
							shikiConfig: markdown.shikiConfig,
							gfm: markdown.gfm,
							smartypants: markdown.smartypants,
						});

						return async (entry) => {
							const result = await renderer.render(entry.body ?? "", {
								frontmatter: entry.data,
								fileURL: entry.filePath ? pathToFileURL(entry.filePath) : undefined,
							});

							return {
								html: result.code,
								metadata: {
									...result.metadata,
									imagePaths: (result.metadata.localImagePaths ?? []).concat(
										result.metadata.remoteImagePaths ?? [],
									),
								},
							};
						};
					},
				});
			},
		},
	};
}
