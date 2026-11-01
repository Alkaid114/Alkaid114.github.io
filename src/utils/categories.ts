import type { CollectionEntry } from "astro:content";

export const UNCATEGORIZED = "未分类";

export interface Category {
	name: string;
	slug: string;
	posts: CollectionEntry<"posts">[];
}

export function categorySlug(name: string): string {
	const slug = name
		.trim()
		.toLowerCase()
		.replace(/\s+/g, "-")
		.replace(/[^\p{L}\p{N}-]/gu, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");

	return slug || "category";
}

export function categoryName(post: CollectionEntry<"posts">): string {
	return post.data.category?.trim() || UNCATEGORIZED;
}

export function categoryHref(slug: string): string {
	return `/categories/${encodeURIComponent(slug)}/`;
}

export type CategoryLookup = Map<string, Category>;

export function categoryLookup(posts: CollectionEntry<"posts">[]): CategoryLookup {
	return new Map(collectCategories(posts).map((category) => [category.slug, category]));
}

export function resolveCategory(
	value: string | undefined,
	lookup: CategoryLookup,
): { name: string; slug: string } {
	const name = value?.trim() || UNCATEGORIZED;
	const slug = categorySlug(name);
	return { name: lookup.get(slug)?.name ?? name, slug };
}

export function collectCategories(posts: CollectionEntry<"posts">[]): Category[] {
	const groups = new Map<string, Category>();

	const published = posts
		.filter((post) => !post.data.draft)
		.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());

	for (const post of published) {
		const name = categoryName(post);
		const slug = categorySlug(name);
		const existing = groups.get(slug);

		if (!existing) {
			groups.set(slug, { name, slug, posts: [post] });
			continue;
		}

		if (existing.name.toLowerCase() !== name.toLowerCase()) {
			throw new Error(
				`Category slug collision: "${existing.name}" and "${name}" both map to "${slug}"`,
			);
		}

		if (existing.name === existing.name.toLowerCase() && name !== name.toLowerCase()) {
			existing.name = name;
		}

		existing.posts.push(post);
	}

	return [...groups.values()];
}

export function sortCategories(categories: Category[]): Category[] {
	return [...categories].sort(
		(a, b) => b.posts.length - a.posts.length || a.name.localeCompare(b.name),
	);
}
