import { getCollection } from "astro:content";
import rss from "@astrojs/rss";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";

export async function GET(context) {
	const posts = await getCollection("posts");

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts
			.filter((post) => !post.data.draft)
			.sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf())
			.map((post) => ({
				title: post.data.title,
				description: post.data.description,
				pubDate: post.data.published,
				link: `/posts/${post.id}/`,
				categories: post.data.category ? [post.data.category] : undefined,
				author: post.data.author?.name,
			})),
	});
}
