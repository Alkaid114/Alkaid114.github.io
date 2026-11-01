export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh";
export const LOCALE_STORAGE_KEY = "locale";

const en = {
	home: "Home",
	about: "About",
	posts: "Posts",
	categories: "Categories",
	postCount: "posts",
	previous: "Previous",
	next: "Next",
	pagination: "Pagination",
	language: "Language",
	backToTop: "Back to top",
	lastUpdated: "Last updated on",
	licenseCaution: "Caution! This post has specific license terms:",
	licenseWithUrl:
		"Please ensure you comply with the license terms when using or distributing this content.",
	licenseNoUrl: "Please contact the author for permission before republishing this content.",
	siteDescription: "Welcome to my blog!",
	aboutTitle: "About Me",
	aboutDescription: "A little about this site",
	friendLinks: "Friends",
} as const;

export type UIKey = keyof typeof en;

const zh: Record<UIKey, string> = {
	home: "首页",
	about: "关于",
	posts: "文章",
	categories: "分类",
	postCount: "篇文章",
	previous: "上一页",
	next: "下一页",
	pagination: "分页",
	language: "语言",
	backToTop: "回到顶部",
	lastUpdated: "最后更新于",
	licenseCaution: "注意：本文采用特定的许可条款：",
	licenseWithUrl: "使用或分发本内容时，请遵守相应的许可条款。",
	licenseNoUrl: "转载本文前请先联系作者获得许可。",
	siteDescription: "欢迎来到我的博客！",
	aboutTitle: "关于我",
	aboutDescription: "关于这个站点",
	friendLinks: "友链",
};

export const UI = { zh, en } satisfies Record<Locale, Record<UIKey, string>>;

export const LOCALE_META = {
	zh: { label: "中文", short: "中", htmlLang: "zh-CN", dateLocale: "zh-CN" },
	en: { label: "English", short: "EN", htmlLang: "en", dateLocale: "en-US" },
} as const satisfies Record<
	Locale,
	{ label: string; short: string; htmlLang: string; dateLocale: string }
>;

export function isLocale(value: string | null | undefined): value is Locale {
	return value !== undefined && value !== null && (LOCALES as readonly string[]).includes(value);
}

export function t(locale: Locale, key: UIKey): string {
	return UI[locale][key];
}
