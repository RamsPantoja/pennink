/**
 * Adds markdown styles to HTML string content based on project's markdown-styles class
 * @param htmlString - The HTML string to style
 * @returns styled HTML string with appropriate classes and styles
 */
export const addMarkdownStyles = (htmlString: string): string => {
	// Regular expressions to match different HTML elements
	const styleMap = {
		h1: "font-size: 10px; font-weight: bold; margin-bottom: 8px; width: 190px",
		h2: "font-size: 8px; font-weight: bold; margin-bottom: 8px; width: 190px",
		h3: "font-size: 7px; font-weight: bold; margin-bottom: 8px; width: 190px",
		h4: "font-size: 6px; font-weight: bold; margin-bottom: 8px; width: 190px",
		h5: "font-size: 5px; font-weight: bold; margin-bottom: 8px; width: 190px",
		h6: "font-size: 4px; font-weight: bold; margin-bottom: 8px; width: 190px",
		p: "font-size: 4px; line-height: 1.5; margin-bottom: 4px; width: 190px",
		a: "position: relative; top: -10.25px; text-decoration-line: underline;",
		i: "position: relative; top: -10.25px;",
		li: "font-size: 4px; line-height: 1.5; margin-bottom: 4px;",
		ul: "list-style-type: disc; margin-left: 16px; margin-bottom: 8px; font-size: 5px; width: 160px;",
		ol: "list-style-type: decimal; margin-left: 16px; margin-bottom: 8px; font-size: 5px; width: 160px;",
		blockquote: "font-style: italic; margin-left: 16px; margin-bottom: 8px;",
		table: "border-collapse: collapse; width: 100%; margin-bottom: 8px;",
		th: "background-color: #f2f2f2; padding: 8px; border: 1px solid #ddd;",
		td: "padding: 8px; border: 1px solid #ddd;",
		"table caption": "font-size: 16px; font-weight: bold; margin-bottom: 8px;",
		"table thead": "background-color: #f2f2f2;",
		"table tbody": "background-color: #ffffff;",
		"table tfoot": "background-color: #f2f2f2;",
	};

	let styledHtml = htmlString;

	// Apply styles to each HTML element
	Object.entries(styleMap).forEach(([tag, styles]) => {
		const regex = new RegExp(`<${tag}([^>]*)>`, "gi");
		styledHtml = styledHtml.replace(regex, `<${tag}$1 style="${styles}">`);
	});

	// Add special handling for table rows (alternating backgrounds)
	styledHtml = styledHtml.replace(/<tr([^>]*)>/gi, (match, p1, offset) => {
		const rowNumber = (styledHtml.slice(0, offset).match(/<tr/gi) || []).length;
		const backgroundColor = rowNumber % 2 === 0 ? "#ffffff" : "#f2f2f2";
		return `<tr${p1} style="background-color: ${backgroundColor};">`;
	});

	// Add prismjs theme styles for code blocks
	styledHtml = styledHtml.replace(
		/<(pre|code)([^>]*)>/gi,
		(match, tag, attributes) => {
			const baseStyles =
				"color: #4c4f69; padding: 12px; border-radius: 8px; overflow: auto; font-size: 12px; max-height: 480px; margin-top: 8px; margin-bottom: 8px;";
			const preStyles = tag === "pre" ? "background: #e6e9ef;" : "";
			return `<${tag}${attributes} style="${baseStyles}${preStyles}">`;
		},
	);

	// Wrap the entire content in a div with markdown-styles class
	return `<div class="markdown-styles">${styledHtml}</div>`;
};

// Example usage:
// const htmlString = '<h1>Title</h1><p>Some text</p>';
// const styledHtml = addMarkdownStyles(htmlString);
