import { cn, markdownToHtml } from "~/lib/utils";
import { useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MemoizedMarkdown } from "../common/MemoizedMarkdown";

type ResponseProps = {
	content: string;
	reasoning?: boolean;
};

export const Response = ({ content, reasoning }: ResponseProps) => {
	return (
		<div
			className={cn([
				"flex flex-col overflow-auto w-full",
				{
					"markdown-styles-for-reasoning text-xs text-mocha-sub-text":
						reasoning,
					"markdown-styles": !reasoning,
				},
			])}
		>
			<MemoizedMarkdown content={content} />
		</div>
	);
};

// <MemoizedMarkdown content={content} />
