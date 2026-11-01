import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
	loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
	// Type-check frontmatter using a schema
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			category: z.string().trim().min(1).optional(),
			// Transform string to Date object
			published: z.coerce.date(),
			license: z
				.object({
					name: z.string(),
					url: z.url().optional(),
				})
				.optional(),
			author: z
				.object({
					name: z.string(),
					url: z.url().optional(),
				})
				.optional(),
			updatedDate: z.coerce.date().optional(),
			heroImage: z.optional(image()),
			draft: z.boolean().default(false),
			tags: z.array(z.string()).optional(), // 仅用于兼容旧文章，不实现
		}),
});

export const collections = { posts };
