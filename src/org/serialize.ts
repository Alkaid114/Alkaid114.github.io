import nodePath from "node:path";
import GithubSlugger from "github-slugger";
import type {
	Element,
	Entity,
	FootnoteDefinition,
	FootnoteReference,
	Headline,
	LatexFragment,
	Link,
	List,
	OrgData,
	OrgNode,
	Paragraph,
	SpecialBlock,
	SrcBlock,
	Table,
	TableOrg,
} from "uniorg";

export interface OrgSerializeOptions {
	// Absolute path of the source file. Used to resolve relative links.
	filePath: string;
	// Absolute path of the content collection root. Used to build post URLs.
	baseDir: string;
	// Added to org headline levels. `1` turns `*` into `##`.
	headingOffset?: number;
}

interface Context {
	filePath: string;
	baseDir: string;
	headingOffset: number;
	slugger: GithubSlugger;
	// Lowercased heading text -> anchor slug.
	headings: Map<string, string>;
	notes: string[];
}

const ALERTS: Record<string, string> = {
	note: "NOTE",
	tip: "TIP",
	warning: "WARNING",
	important: "IMPORTANT",
	caution: "CAUTION",
};

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|svg|webp|avif|bmp|ico)$/i;

// Convert a parsed org document to Markdown the satteri pipeline can consume.
export function orgToMarkdown(tree: OrgData, options: OrgSerializeOptions): string {
	const ctx: Context = {
		filePath: options.filePath,
		baseDir: options.baseDir,
		headingOffset: options.headingOffset ?? 1,
		slugger: new GithubSlugger(),
		headings: new Map(),
		notes: [],
	};

	indexHeadings(tree, ctx);

	const blocks = tree.children.map((node) => block(node as OrgNode, ctx)).filter(Boolean);
	const body = blocks
		.join("\n\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	if (ctx.notes.length === 0) return body;

	return `${body}\n\n${ctx.notes.join("\n\n")}`;
}

function indexHeadings(node: OrgNode, ctx: Context): void {
	if (node.type === "headline") {
		const text = plainText(node.children).trim();
		ctx.headings.set(text.toLowerCase(), ctx.slugger.slug(text));
		return;
	}

	if ("children" in node) {
		for (const child of node.children) indexHeadings(child as OrgNode, ctx);
	}
}

function block(node: OrgNode, ctx: Context): string {
	switch (node.type) {
		case "org-data":
			return node.children
				.map((child) => block(child as OrgNode, ctx))
				.filter(Boolean)
				.join("\n\n");

		case "section":
			return renderSection(node.children as OrgNode[], ctx);

		case "headline":
			return renderHeadline(node, ctx);

		case "paragraph":
			return renderParagraph(node, ctx);

		case "plain-list":
			return renderList(node, ctx);

		case "src-block":
			return renderSrcBlock(node);

		case "example-block":
			return renderFence(node.value, "");

		case "fixed-width":
			return renderFence(node.value, "text");

		case "quote-block":
		case "verse-block":
			return renderQuote(node.children as OrgNode[], ctx);

		case "center-block":
			return renderBlocks(node.children as OrgNode[], ctx);

		case "special-block":
			return renderSpecialBlock(node, ctx);

		case "table":
			return renderTable(node, ctx);

		case "horizontal-rule":
			return "***";

		case "latex-environment":
			return `$$\n${node.value.trim()}\n$$`;

		case "export-block":
			return node.backend === "html" ? node.value.trim() : "";

		case "footnote-definition":
			return collectFootnote(node, ctx);

		case "drawer":
		case "property-drawer":
		case "node-property":
			return "";

		default:
			return "";
	}
}

function renderSection(children: OrgNode[], ctx: Context): string {
	const [headline, ...rest] = children;

	if (headline?.type !== "headline") {
		return renderBlocks(children, ctx);
	}

	const parts = [renderHeadline(headline, ctx)];
	for (const child of rest) {
		if (child.type === "property-drawer") continue;
		const rendered = block(child, ctx);
		if (rendered) parts.push(rendered);
	}

	return parts.join("\n\n");
}

function renderHeadline(node: Headline, ctx: Context): string {
	const text = inline(node.children as OrgNode[], ctx).trim();
	const depth = Math.min(node.level + ctx.headingOffset, 6);
	return `${"#".repeat(depth)} ${text}`;
}

function renderParagraph(node: Paragraph, ctx: Context): string {
	const children = node.children as OrgNode[];
	const meaningful = children.filter(
		(child) => !(child.type === "text" && child.value.trim() === ""),
	);

	const only = meaningful.length === 1 ? meaningful[0] : undefined;
	if (only?.type === "latex-fragment" && isDisplayMath(only)) {
		return `$$\n${only.contents.trim()}\n$$`;
	}

	return inline(children, ctx).trim();
}

function inline(nodes: OrgNode[], ctx: Context): string {
	return nodes.map((node) => inlineNode(node, ctx)).join("");
}

function inlineNode(node: OrgNode, ctx: Context): string {
	switch (node.type) {
		case "text":
			return escapeText(node.value);

		case "bold":
			return `**${inlineChildren(node, ctx)}**`;

		case "italic":
			return `*${inlineChildren(node, ctx)}*`;

		case "underline":
			return `<u>${inlineChildren(node, ctx)}</u>`;

		case "strike-through":
			return `~~${inlineChildren(node, ctx)}~~`;

		case "code":
		case "verbatim":
			return inlineCode(node.value);

		case "superscript":
			return `<sup>${inlineChildren(node, ctx)}</sup>`;

		case "subscript":
			return `<sub>${inlineChildren(node, ctx)}</sub>`;

		case "latex-fragment":
			return isDisplayMath(node) ? `$$\n${node.contents.trim()}\n$$` : `$${node.contents.trim()}$`;

		case "entity":
			return escapeText(entityText(node));

		case "footnote-reference":
			return renderFootnoteReference(node, ctx);

		case "link":
			return renderLink(node, ctx);

		case "line-break":
			return "\\\n";

		case "timestamp":
			return escapeText(node.rawValue);

		case "statistics-cookie":
			return `\\[${escapeText(node.value)}\\]`;

		case "export-snippet":
			return node.backEnd === "html" ? node.value : "";

		case "citation":
			return inlineChildren(node, ctx);

		default:
			if ("value" in node && typeof node.value === "string") return escapeText(node.value);
			if ("children" in node) return inlineChildren(node as Element, ctx);
			return "";
	}
}

function inlineChildren(node: Element, ctx: Context): string {
	return inline(node.children as OrgNode[], ctx);
}

function isDisplayMath(node: LatexFragment): boolean {
	return node.value.startsWith("\\[") || node.value.startsWith("$$");
}

function renderLink(node: Link, ctx: Context): string {
	const label = inline(node.children as OrgNode[], ctx).trim();
	const raw = node.rawLink;

	if (node.linkType === "file") {
		const target = node.path.split("::")[0];
		if (IMAGE_EXTENSIONS.test(target)) {
			return `![${label}](${encodePath(relativePath(target))})`;
		}
		if (/\.org$/i.test(target)) {
			const url = resolvePostUrl(target, ctx);
			return `[${label || nodePath.basename(target, ".org")}](${url})`;
		}
		return `[${label || target}](${encodePath(target)})`;
	}

	if (node.linkType === "fuzzy") {
		const heading = node.path.replace(/^\*+/, "").trim();
		const anchor = ctx.headings.get(heading.toLowerCase());
		return `[${label || heading}](${anchor ? `#${anchor}` : "#"})`;
	}

	if (node.linkType === "id") {
		return `[${label || node.path}](${node.path})`;
	}

	const url = raw || node.path;
	return label ? `[${label}](${url})` : `<${url}>`;
}

function resolvePostUrl(target: string, ctx: Context): string {
	const absolute = nodePath.resolve(nodePath.dirname(ctx.filePath), target);
	const relative = nodePath.relative(ctx.baseDir, absolute).replace(/\\/g, "/");
	if (relative.startsWith("..")) return encodePath(target);
	return `/posts/${encodePath(relative.replace(/\.org$/i, ""))}/`;
}

function encodePath(value: string): string {
	return value.replace(/ /g, "%20");
}

/** Satteri only collects relative image sources that start with `./` or `../`. */
function relativePath(value: string): string {
	if (/^(?:\.{1,2}\/|\/|[a-z][a-z0-9+.-]*:)/i.test(value)) return value;
	return `./${value}`;
}

function renderFootnoteReference(
	node: FootnoteReference & { footnoteType: string },
	ctx: Context,
): string {
	if (node.footnoteType === "inline") {
		const content = inline((node.children ?? []) as OrgNode[], ctx).trim();
		return `^[${content}]`;
	}
	return `[^${node.label}]`;
}

function collectFootnote(node: FootnoteDefinition, ctx: Context): string {
	const content = renderBlocks(node.children as OrgNode[], ctx).trim();
	const lines = content.split("\n");
	const first = lines.shift() ?? "";
	const rest = lines.map((line) => (line ? `    ${line}` : ""));
	ctx.notes.push([`[^${node.label}]: ${first}`, ...rest].join("\n"));
	return "";
}

function renderBlocks(nodes: OrgNode[], ctx: Context): string {
	return nodes
		.map((node) => block(node, ctx))
		.filter(Boolean)
		.join("\n\n");
}

/** Join item content tightly: nested lists follow a paragraph without a blank line. */
function renderItemBlocks(nodes: OrgNode[], ctx: Context): string {
	const parts = nodes.map((node) => block(node, ctx)).filter(Boolean);
	let output = "";

	for (const part of parts) {
		if (!output) output = part;
		else if (/^(?:[-*+]|\d+\.)\s/.test(part)) output += `\n${part}`;
		else output += `\n\n${part}`;
	}

	return output;
}

function renderQuote(nodes: OrgNode[], ctx: Context): string {
	const content = renderBlocks(nodes, ctx);
	return content
		.split("\n")
		.map((line) => (line ? `> ${line}` : ">"))
		.join("\n");
}

function renderSpecialBlock(node: SpecialBlock, ctx: Context): string {
	const alert = ALERTS[node.blockType.toLowerCase()];
	const content = renderBlocks(node.children as OrgNode[], ctx);
	if (!alert) return content;

	return [`> [!${alert}]`, ...content.split("\n").map((line) => (line ? `> ${line}` : ">"))].join(
		"\n",
	);
}

function renderSrcBlock(node: SrcBlock): string {
	const src = node as SrcBlock & { parameters?: string | null };
	const language = (node.language ?? "").trim();
	const meta = orgParamsToMeta(src.parameters);
	const info = [language, meta].filter(Boolean).join(" ");
	return renderFence(node.value, info);
}

function orgParamsToMeta(parameters?: string | null): string {
	const tokens = tokenize(parameters ?? "");
	const kept: string[] = [];

	for (let index = 0; index < tokens.length; index++) {
		const token = tokens[index];
		if (token.startsWith(":")) {
			const value = tokens[index + 1];
			if (value && !value.startsWith(":")) index++;
			continue;
		}
		kept.push(token);
	}

	return kept.join(" ");
}

function tokenize(input: string): string[] {
	const tokens: string[] = [];
	let current = "";
	let quote: string | null = null;

	for (const char of input) {
		if (quote) {
			current += char;
			if (char === quote) quote = null;
		} else if (char === '"' || char === "'") {
			current += char;
			quote = char;
		} else if (/\s/.test(char)) {
			if (current) {
				tokens.push(current);
				current = "";
			}
		} else {
			current += char;
		}
	}

	if (current) tokens.push(current);
	return tokens;
}

function renderFence(value: string, info: string): string {
	const body = value.replace(/\r\n/g, "\n").replace(/\n+$/, "");
	const longestRun = Math.max(0, ...(body.match(/`+/g) ?? []).map((run) => run.length));
	const fence = "`".repeat(Math.max(3, longestRun + 1));
	return `${fence}${info}\n${body}\n${fence}`;
}

function inlineCode(value: string): string {
	const longestRun = Math.max(0, ...(value.match(/`+/g) ?? []).map((run) => run.length));
	const fence = "`".repeat(longestRun + 1);
	const pad = value.startsWith("`") || value.endsWith("`") ? " " : "";
	return `${fence}${pad}${value}${pad}${fence}`;
}

function renderList(node: List, ctx: Context): string {
	const lines: string[] = [];
	let counter = 0;
	let previousWasDefinition = false;
	let previousOrdered: boolean | null = null;
	let lastTerm: string | null = null;

	for (const item of node.children) {
		if (item.type !== "list-item") continue;

		const tag = item.children.find((child) => child.type === "list-item-tag");
		const body = item.children.filter((child) => child.type !== "list-item-tag") as OrgNode[];
		const ordered = /^\s*(?:\d+|[A-Za-z])[.)]/.test(item.bullet);
		const marker = ordered ? `${++counter}. ` : "- ";
		const checkbox = item.checkbox === "on" ? "[x] " : item.checkbox ? "[ ] " : "";
		const content = renderItemBlocks(body, ctx).trim();

		if (tag) {
			const term = inline(tag.children as OrgNode[], ctx).trim();
			const contentLines = content.split("\n");
			const first = contentLines.shift() ?? "";

			if (previousWasDefinition && term === lastTerm) {
				lines.push(`: ${first}`);
			} else {
				if (lines.length > 0) lines.push("");
				lines.push(term);
				lines.push(`: ${first}`);
			}

			for (const line of contentLines) lines.push(line ? `  ${line}` : "");
			previousWasDefinition = true;
			lastTerm = term;
			continue;
		}

		if (previousWasDefinition || (previousOrdered !== null && previousOrdered !== ordered)) {
			lines.push("");
		}
		previousWasDefinition = false;
		previousOrdered = ordered;
		lastTerm = null;

		const contentLines = content ? content.split("\n") : [];
		const first = contentLines.shift() ?? "";
		lines.push(`${marker}${checkbox}${first}`);
		const padding = " ".repeat(marker.length + checkbox.length);
		for (const line of contentLines) lines.push(line ? `${padding}${line}` : "");
	}

	return lines.join("\n");
}

function renderTable(node: Table, ctx: Context): string {
	if (node.tableType === "table.el") {
		return renderFence(node.value, "text");
	}

	const table = node as TableOrg;

	const rows = table.children
		.filter((row) => row.rowType === "standard")
		.map((row) =>
			row.children.map((cell) =>
				inline(cell.children as OrgNode[], ctx)
					.trim()
					.replace(/\n+/g, "<br>")
					.replace(/\|/g, "\\|"),
			),
		)
		.filter((row) => row.length > 0);

	if (rows.length === 0) return "";

	const width = Math.max(...rows.map((row) => row.length));
	const padded = rows.map((row) => [...row, ...Array(width - row.length).fill("")]);
	const [header, ...rest] = padded;
	const format = (row: string[]) => `| ${row.join(" | ")} |`;
	const divider = `| ${Array(width).fill("---").join(" | ")} |`;

	return [format(header), divider, ...rest.map(format)].join("\n");
}

function plainText(nodes: OrgNode[]): string {
	return nodes
		.map((node) => {
			switch (node.type) {
				case "text":
				case "code":
				case "verbatim":
					return node.value;
				case "latex-fragment":
					return node.value;
				case "entity":
					return entityText(node);
				default:
					if ("children" in node) return plainText(node.children as OrgNode[]);
					return "";
			}
		})
		.join("");
}

function entityText(node: Entity): string {
	return node.utf8 || node.html || node.name;
}

function escapeText(value: string): string {
	return value.replace(/[\\`*_[\]<>$~^]/g, (char) => `\\${char}`);
}
