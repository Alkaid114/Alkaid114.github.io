import {
	DEFAULT_LOCALE,
	isLocale,
	LOCALE_META,
	type Locale,
	nextLocale,
	UI,
	type UIKey,
} from "../i18n/ui";

const STORAGE_KEY = "locale";

function storedLocale(): Locale {
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return isLocale(value) ? value : DEFAULT_LOCALE;
	} catch {
		return DEFAULT_LOCALE;
	}
}

function translate(locale: Locale) {
	for (const el of document.querySelectorAll<HTMLElement>("[data-i18n]")) {
		const key = el.dataset.i18n as UIKey;
		if (key in UI[locale]) el.textContent = UI[locale][key];
	}

	for (const el of document.querySelectorAll<HTMLElement>("[data-i18n-aria-label]")) {
		const key = el.dataset.i18nAriaLabel as UIKey;
		if (key in UI[locale]) el.setAttribute("aria-label", UI[locale][key]);
	}

	for (const el of document.querySelectorAll<HTMLTimeElement>("time[data-locale-date]")) {
		const date = new Date(el.dateTime);
		if (Number.isNaN(date.valueOf())) continue;
		el.textContent = date.toLocaleDateString(LOCALE_META[locale].dateLocale, {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	}

	const title = document.querySelector<HTMLTitleElement>("title[data-i18n-title]");
	if (title) {
		const key = title.dataset.i18nTitle as UIKey;
		const suffix = title.dataset.i18nTitleSuffix;
		if (key in UI[locale]) {
			const text = UI[locale][key];
			document.title = suffix ? `${text} ${suffix}` : text;
		}
	}

	for (const el of document.querySelectorAll<HTMLElement>("[data-locale-toggle]")) {
		el.textContent = UI[locale].switchLanguage;
		el.setAttribute("aria-label", UI[locale].switchLanguageLabel);
	}
}

function applyLocale(locale: Locale) {
	document.documentElement.lang = LOCALE_META[locale].htmlLang;
	document.documentElement.dataset.locale = locale;
	translate(locale);
}

applyLocale(storedLocale());

document.addEventListener("click", (event) => {
	const target = event.target;
	if (!(target instanceof Element)) return;
	const toggle = target.closest<HTMLElement>("[data-locale-toggle]");
	if (!toggle) return;

	const current = document.documentElement.dataset.locale;
	const locale = nextLocale(isLocale(current) ? current : DEFAULT_LOCALE);
	try {
		localStorage.setItem(STORAGE_KEY, locale);
	} catch {
		// Storage can be unavailable in private modes.
	}
	applyLocale(locale);
});
