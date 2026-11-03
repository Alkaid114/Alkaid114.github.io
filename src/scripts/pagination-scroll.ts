// Pagination should not throw the reader back to the very top of the page: they
// were at the bottom of a list and want the top of the next one. Astro's client
// router always resets the scroll to 0 on navigation, so the intent is recorded
// on click and restored right after the new DOM is in place.

interface ScrollIntent {
	pagination?: boolean;
}

const state = window as Window & {
	__scrollIntent?: ScrollIntent;
	__paginationAbort?: AbortController;
};

state.__paginationAbort?.abort();
const controller = new AbortController();
state.__paginationAbort = controller;

const { signal } = controller;

document.addEventListener(
	"click",
	(event) => {
		const target = event.target;
		if (!(target instanceof Element)) return;
		// Modified clicks open a new tab: the router never navigates, so no intent.
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		if (!target.closest("[data-locale-aria-label='pagination'] a[href]")) return;
		state.__scrollIntent = { pagination: true };
	},
	{ signal },
);

document.addEventListener(
	"astro:after-swap",
	() => {
		const intent = state.__scrollIntent;
		state.__scrollIntent = undefined;
		if (!intent?.pagination) return;

		const anchor = document.querySelector<HTMLElement>("[data-pagination-target]");
		if (!anchor) return;

		// The router has already jumped to the top; do this in the same frame so the
		// new page appears in place instead of scrolling down from the header.
		const top = anchor.getBoundingClientRect().top + window.scrollY;
		window.scrollTo({ top: Math.max(0, top - 16), behavior: "instant" });
	},
	{ signal },
);
