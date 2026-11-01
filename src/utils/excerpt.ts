const EXCERPT_LENGTH = 200;

export function excerptFromBody(body: string | undefined, maxLength = EXCERPT_LENGTH): string {
	if (!body) return "";

	const codeSpans: string[] = [];

	const source = body
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/~~~[\s\S]*?~~~/g, " ")
		.replace(/<!--[\s\S]*?-->/g, " ")
		.replace(/^(?:import|export)\s.*$/gm, " ")
		.replace(/`([^`]+)`/g, (_, snippet: string) => {
			codeSpans.push(snippet);
			return `\u0000${codeSpans.length - 1}\u0000`;
		});

	const text = source
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/<[^>]*>/g, " ")
		.replace(/^#{1,6}\s+/gm, "")
		.replace(/^\s*>\s?/gm, "")
		.replace(/^\s*[-*+]\s+/gm, "")
		.replace(/^\s*\d+\.\s+/gm, "")
		.replace(/^\s*([-*_])\1{2,}\s*$/gm, " ")
		.replace(/[*_~]/g, "")
		.replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1")
		.replace(/\u0000(\d+)\u0000/g, (_, index: string) => codeSpans[Number(index)] ?? " ")
		.replace(/\s+/g, " ")
		.trim();

	if (text.length <= maxLength) return text;

	const cut = text.slice(0, maxLength);
	const lastSpace = cut.lastIndexOf(" ");
	const end = lastSpace > maxLength * 0.6 ? lastSpace : cut.length;

	return `${cut.slice(0, end).trimEnd()}…`;
}
