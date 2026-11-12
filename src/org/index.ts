import nodePath from "node:path";
import { unified } from "unified";
import type { Headline, OrgData, OrgNode } from "uniorg";
import orgParse from "uniorg-parse";
import { NICKNAME } from "../consts";
import { orgToMarkdown } from "./serialize";

const processor = unified().use(orgParse);

export interface OrgEntryInput {
	contents: string;
	// Absolute path of the org file.
	filePath: string;
	// Absolute path of the posts collection root.
	baseDir: string;
}

export interface OrgEntry {
	data: Record<string, unknown>;
	// Converted Markdown.
	body: string;
}

// Parse an org file into collection data plus a Markdown body.
export function orgEntry({ contents, filePath, baseDir }: OrgEntryInput): OrgEntry {
	const tree = processor.parse(contents) as OrgData;
	const keywords = collectKeywords(tree);
	const data = buildData(keywords, tree, filePath);
	const body = orgToMarkdown(tree, { filePath, baseDir, headingOffset: 1 });

	return { data, body };
}

function collectKeywords(tree: OrgData): Map<string, string> {
	const keywords = new Map<string, string>();

	const visit = (node: OrgNode) => {
		if (node.type === "keyword") {
			keywords.set(node.key.toUpperCase(), node.value.trim());
			return;
		}
		if ("children" in node) {
			for (const child of node.children) visit(child as OrgNode);
		}
	};

	visit(tree);
	return keywords;
}

function buildData(
	keywords: Map<string, string>,
	tree: OrgData,
	filePath: string,
): Record<string, unknown> {
	const title = keywords.get("TITLE") || firstHeadline(tree) || nodePath.basename(filePath, ".org");
	const published = parseOrgDate(keywords.get("DATE") ?? keywords.get("PUBLISHED") ?? "");

	if (!published) {
		throw new Error(`[org] ${filePath}: missing or invalid #+DATE (required for published)`);
	}

	const data: Record<string, unknown> = {
		title,
		published,
		draft: parseBoolean(keywords.get("DRAFT")),
	};

	const description = keywords.get("DESCRIPTION");
	if (description) data.description = description;

	const category = keywords.get("CATEGORY");
	if (category) data.category = category;

	const updated = parseOrgDate(keywords.get("UPDATED") ?? keywords.get("UPDATED_AT") ?? "");
	if (updated) data.updatedDate = updated;

	const slug = keywords.get("SLUG");
	if (slug) data.slug = slug;

	const tags = parseTags(keywords.get("FILETAGS") ?? keywords.get("TAGS"));
	if (tags.length > 0) data.tags = tags;

	const authorName = keywords.get("AUTHOR");
	const authorUrl = keywords.get("AUTHOR_URL");
	if (authorName || authorUrl) {
		data.author = {
			name: authorName || NICKNAME,
			...(authorUrl ? { url: authorUrl } : {}),
		};
	}

	const licenseName = keywords.get("LICENSE");
	if (licenseName) {
		const license: Record<string, string> = { name: licenseName };
		const licenseUrl = keywords.get("LICENSE_URL");
		const licenseDescription = keywords.get("LICENSE_DESCRIPTION");
		if (licenseUrl) license.url = licenseUrl;
		if (licenseDescription) license.description = licenseDescription;
		data.license = license;
	}

	const heroImage = keywords.get("HEROIMAGE") ?? keywords.get("HERO_IMAGE");
	if (heroImage) data.heroImage = heroImage;

	return data;
}

function firstHeadline(tree: OrgData): string | undefined {
	for (const child of tree.children) {
		if (child.type === "headline") return headlineText(child);
		if (child.type === "section") {
			const headline = child.children.find((node) => node.type === "headline");
			if (headline) return headlineText(headline as Headline);
		}
	}
	return undefined;
}

function headlineText(headline: Headline): string {
	return headline.rawValue.trim();
}

function parseOrgDate(value: string): Date | undefined {
	if (!value) return undefined;

	const match = /(\d{4})-(\d{1,2})-(\d{1,2})(?:[^\d]{0,3}(\d{1,2}):(\d{2}))?/.exec(value);
	if (!match) return undefined;

	const [, year, month, day, hour, minute] = match;
	const date = new Date(
		Number(year),
		Number(month) - 1,
		Number(day),
		hour ? Number(hour) : 0,
		minute ? Number(minute) : 0,
	);

	return Number.isNaN(date.valueOf()) ? undefined : date;
}

function parseBoolean(value: string | undefined): boolean {
	if (!value) return false;
	return ["t", "true", "yes", "y", "1"].includes(value.trim().toLowerCase());
}

function parseTags(value: string | undefined): string[] {
	if (!value) return [];
	return value
		.split(/[:\s]+/)
		.map((tag) => tag.trim())
		.filter(Boolean);
}
