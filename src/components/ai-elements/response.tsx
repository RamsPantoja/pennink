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
