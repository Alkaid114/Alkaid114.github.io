import {
	DEFAULT_LOCALE,
	isLocale,
	LOCALE_META,
	LOCALE_STORAGE_KEY,
	type Locale,
	UI,
	type UIKey,
} from "../i18n/ui";

const root = document.documentElement;

function storedLocale(): Locale {
	try {
		const value = localStorage.getItem(LOCALE_STORAGE_KEY);
		return isLocale(value) ? value : DEFAULT_LOCALE;
	} catch {
		return DEFAULT_LOCALE;
	}
}

function currentLocale(): Locale {
	const value = root.dataset.locale;
	return isLocale(value) ? value : storedLocale();
}

function apply(locale: Locale) {
	root.dataset.locale = locale;
	root.lang = LOCALE_META[locale].htmlLang;

	for (const el of document.querySelectorAll<HTMLElement>("[data-locale-choice]")) {
		el.setAttribute("aria-pressed", String(el.dataset.localeChoice === locale));
	}

	for (const el of document.querySelectorAll<HTMLElement>("[data-locale-aria-label]")) {
		const key = el.dataset.localeAriaLabel as UIKey;
		if (key in UI[locale]) el.setAttribute("aria-label", UI[locale][key]);
	}

	const title = document.querySelector<HTMLTitleElement>("title[data-title-en]");
	if (title) {
		document.title =
			locale === "en"
				? (title.dataset.titleEn ?? title.textContent ?? "")
				: (title.dataset.titleZh ?? title.textContent ?? "");
	}
}

apply(currentLocale());

// The client router rebuilds <html> attributes from the incoming document, which has no locale.
// Stamp it on the new document before the swap so the first painted frame is already correct.
document.addEventListener("astro:before-swap", (event) => {
	const locale = currentLocale();
	const html = (event as Event & { newDocument: Document }).newDocument.documentElement;
	html.dataset.locale = locale;
	html.lang = LOCALE_META[locale].htmlLang;
});

// New nodes arrive with server-rendered attributes: aria-pressed and aria-label still need applying.
document.addEventListener("astro:after-swap", () => apply(currentLocale()));

document.addEventListener("click", (event) => {
	const target = event.target;
	if (!(target instanceof Element)) return;

	const choice = target.closest<HTMLElement>("[data-locale-choice]");
	if (!choice) return;

	const locale = choice.dataset.localeChoice;
	if (!isLocale(locale)) return;

	try {
		localStorage.setItem(LOCALE_STORAGE_KEY, locale);
	} catch {
		// Storage can be unavailable in private modes.
	}
	apply(locale);
});
