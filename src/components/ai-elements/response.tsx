import { cn, markdownToHtml } from "~/lib/utils";
import { useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

type ResponseProps = {
	content: string;
	reasoning?: boolean;
};

export const Response = ({ content, reasoning }: ResponseProps) => {
	const messageContainerRef = useRef<HTMLDivElement | null>(null);
	const { data } = useSession();

	useEffect(() => {
		if (messageContainerRef.current) {
			const html = markdownToHtml(content);
			messageContainerRef.current.innerHTML = html;

			const paragraphs = document.querySelectorAll("p");

			for (const p of paragraphs) {
				const content = p.textContent || "";
				if (content.trim().startsWith("<thinking>")) {
					const classes = ["!text-xs", "text-mochaSubText"];
					p.classList.add(...classes);
					p.innerText = p.innerText
						.replaceAll("<thinking>", "")
						.replaceAll("</thinking>", "")
						.trim();
				}
			}
		}
	}, [content]);

	return (
		<div
			ref={messageContainerRef}
			className={cn([
				"flex flex-col prismjs-theme overflow-auto",
				{
					"markdown-styles-for-reasoning text-xs": reasoning,
					"markdown-styles": !reasoning,
				},
			])}
		/>
	);
};
