import {
	DEFAULT_LOCALE,
	isLocale,
	LOCALE_META,
	LOCALE_STORAGE_KEY,
	UI,
	type Locale,
	type UIKey,
} from "../i18n/ui";

const root = document.documentElement;

function currentLocale(): Locale {
	const value = root.dataset.locale;
	return isLocale(value) ? value : DEFAULT_LOCALE;
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
