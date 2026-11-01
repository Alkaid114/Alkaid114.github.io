const init = () => {
	const title = document.querySelector<HTMLElement>("[data-drag-title]");
	if (!title || title.dataset.dragReady === "true") return;

	title.dataset.dragReady = "true";

	let dragged: HTMLElement | null = null;
	let startX = 0;
	let shift = 0;

	const centerX = (el: HTMLElement) => {
		const rect = el.getBoundingClientRect();
		return rect.left + rect.width / 2;
	};

	const place = (dx: number) => {
		const el = dragged;
		if (!el) return;
		el.style.transform = `translate(${dx + shift}px, -0.2em)`;
	};

	const reorder = (dx: number) => {
		const el = dragged;
		if (!el) return;
		place(dx);

		for (;;) {
			const prev = el.previousElementSibling as HTMLElement | null;
			if (!prev || centerX(el) >= centerX(prev)) break;
			const left = el.offsetLeft;
			prev.before(el);
			shift += left - el.offsetLeft;
			place(dx);
		}

		for (;;) {
			const next = el.nextElementSibling as HTMLElement | null;
			if (!next || centerX(el) <= centerX(next)) break;
			const left = el.offsetLeft;
			next.after(el);
			shift += left - el.offsetLeft;
			place(dx);
		}
	};

	const onMove = (event: PointerEvent) => {
		reorder(event.clientX - startX);
	};

	const onEnd = () => {
		window.removeEventListener("pointermove", onMove);
		window.removeEventListener("pointerup", onEnd);
		window.removeEventListener("pointercancel", onEnd);

		const el = dragged;
		if (!el) return;

		const from = el.style.transform || "none";
		dragged = null;
		shift = 0;

		el.classList.remove("cursor-grabbing", "text-primary-600", "dark:text-primary-300");
		el.classList.add("cursor-grab");
		el.style.transform = "";
		el.animate([{ transform: from }, { transform: "none" }], {
			duration: 180,
			easing: "cubic-bezier(0.22, 1, 0.36, 1)",
		});
	};

	title.addEventListener("pointerdown", (event) => {
		if (dragged || event.button !== 0) return;

		const target = event.target;
		if (!(target instanceof Element)) return;

		const el = target.closest<HTMLElement>("[data-char]");
		if (!el) return;

		event.preventDefault();
		for (const animation of el.getAnimations()) animation.cancel();

		dragged = el;
		startX = event.clientX;
		shift = 0;
		el.classList.remove("cursor-grab");
		el.classList.add("cursor-grabbing", "text-primary-600", "dark:text-primary-300");
		place(0);

		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onEnd);
		window.addEventListener("pointercancel", onEnd);
	});
};

init();
document.addEventListener("astro:page-load", init);
