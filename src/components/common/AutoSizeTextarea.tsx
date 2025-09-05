"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import { cn } from "~/lib/utils";

interface AutoResizeTextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	minRows?: number;
	maxRows?: number;
}

export const AutoResizeTextarea = ({
	minRows = 1,
	maxRows = 5,
	className,
	onChange,
	...props
}: AutoResizeTextareaProps) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const resizeTextarea = () => {
		const textarea = textareaRef.current;
		if (!textarea) return;

		// Reset height to auto to get the correct scrollHeight
		textarea.style.height = "auto";

		// Calculate the height based on scrollHeight
		const lineHeight = Number.parseInt(getComputedStyle(textarea).lineHeight);
		const paddingTop = Number.parseInt(getComputedStyle(textarea).paddingTop);
		const paddingBottom = Number.parseInt(
			getComputedStyle(textarea).paddingBottom,
		);

		const minHeight = minRows * lineHeight + paddingTop + paddingBottom;
		const maxHeight = maxRows * lineHeight + paddingTop + paddingBottom;

		// Set the height based on content, but within min/max constraints
		const newHeight = Math.min(
			Math.max(textarea.scrollHeight, minHeight),
			maxHeight,
		);
		textarea.style.height = `${newHeight}px`;

		// Show/hide scrollbar based on content height
		textarea.style.overflowY =
			textarea.scrollHeight > maxHeight ? "auto" : "hidden";
	};

	// Resize on mount
	useEffect(() => {
		resizeTextarea();
	}, []);

	// Handle input changes
	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		resizeTextarea();
		if (onChange) {
			onChange(e);
		}
	};

	return (
		<textarea
			ref={textareaRef}
			onChange={handleChange}
			rows={minRows}
			className={cn(
				"resize-none overflow-hidden min-h-[40px] w-full rounded-md px-3 placeholder:text-mocha-sub-text py-2 text-sm focus:outline-hidden",
				className,
			)}
			{...props}
		/>
	);
};
