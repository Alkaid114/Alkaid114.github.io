export const LOCALES = ["zh", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh";

const en = {
	home: "Home",
	about: "About",
	posts: "Posts",
	previous: "Previous",
	next: "Next",
	pagination: "Pagination",
	lastUpdated: "Last updated on",
	licenseCaution: "Caution! This post has specific license terms:",
	licenseWithUrl:
		"Please ensure you comply with the license terms when using or distributing this content.",
	licenseNoUrl: "Please contact the author for permission before republishing this content.",
	switchLanguage: "中文",
	switchLanguageLabel: "Switch to Chinese",
	siteDescription: "Welcome to my blog!",
	aboutTitle: "About Me",
	aboutDescription: "A little about this site",
	codeLicense: "Code licensed under",
	contentLicense: "Content licensed under",
	licenseNote: "Except where otherwise noted.",
	builtWith: "Built with",
	conjunction: "and",
} as const;

export type UIKey = keyof typeof en;

const zh: Record<UIKey, string> = {
	home: "首页",
	about: "关于",
	posts: "文章",
	previous: "上一页",
	next: "下一页",
	pagination: "分页",
	lastUpdated: "最后更新于",
	licenseCaution: "注意：本文采用特定的许可条款：",
	licenseWithUrl: "使用或分发本内容时，请遵守相应的许可条款。",
	licenseNoUrl: "转载本文前请先联系作者获得许可。",
	switchLanguage: "English",
	switchLanguageLabel: "切换到英文",
	siteDescription: "欢迎来到我的博客！",
	aboutTitle: "关于我",
	aboutDescription: "关于这个站点",
	codeLicense: "代码遵循",
	contentLicense: "内容遵循",
	licenseNote: "除非特别声明。",
	builtWith: "使用",
	conjunction: "和",
};

export const UI = { zh, en } satisfies Record<Locale, Record<UIKey, string>>;

export const LOCALE_META = {
	zh: { htmlLang: "zh-CN", dateLocale: "zh-CN" },
	en: { htmlLang: "en", dateLocale: "en-US" },
} as const satisfies Record<Locale, { htmlLang: string; dateLocale: string }>;

export function isLocale(value: string | undefined): value is Locale {
	return value !== undefined && (LOCALES as readonly string[]).includes(value);
}

export function getLocale(pathname: string): Locale {
	const [first] = pathname.split("/").filter(Boolean);
	return isLocale(first) ? first : DEFAULT_LOCALE;
}

export function t(locale: Locale, key: UIKey): string {
	return UI[locale][key];
}

export function stripLocale(pathname: string): string {
	const segments = pathname.split("/");
	if (isLocale(segments[1])) {
		const rest = segments.slice(2).join("/");
		return rest ? `/${rest}` : "/";
	}
	return pathname;
}

export function localePath(path: string, locale: Locale): string {
	const clean = path.startsWith("/") ? path : `/${path}`;
	if (locale === DEFAULT_LOCALE) return clean;
	return clean === "/" ? `/${locale}/` : `/${locale}${clean}`;
}

export function switchLocale(pathname: string, locale: Locale): string {
	return localePath(stripLocale(pathname), locale);
}
