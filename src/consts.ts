export const NICKNAME = "Alkaid";
export const SITE_TITLE = "Alkaid's Blog";
export const SITE_DESCRIPTION = "Welcome to my blog!";

interface SocialLink {
	href: string;
	label: string;
	icon: string;
}

export const SOCIAL_LINKS: SocialLink[] = [
	{
		href: "https://github.com/alkaid114",
		label: "GitHub",
		icon: "simple-icons:github",
	},
	{
		href: "https://space.bilibili.com/143695527",
		label: "BiliBili",
		icon: "fa6-brands:bilibili",
	},
];

export const POSTS_PER_PAGE: number = 8;

export const GIT_REPO_COMMIT_HASH_URL = "https://github.com/alkaid114/blog/tree/{}";

interface FriendLink {
	url: string;
	title: string;
	avatar: string;
	description?: string;
}

export const FRIEND_LINKS: FriendLink[] = [
	{
		title: "biscuit",
		avatar: "https://avatars.githubusercontent.com/u/201212440?v=4",
		description: "biscuit's blog",
		url: "https://biscuit0613.github.io/",
	},
	{
        title: "Kinntaku",
		avatar: "https://avatars.githubusercontent.com/u/174914905?v=4",
		description: "Kinntaku's blog",
		url: "https://kinntaku.github.io/",
    },
]