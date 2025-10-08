import { useEffect, useRef, useState } from "react";
import { useCopyToClipboard } from "usehooks-ts";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button";
import { Copy } from "lucide-react";

type ClipBoardProps = {
	content: string;
	className?: string;
};

const ClipBoard = ({ content, className }: ClipBoardProps) => {
	const [copiedText, copy] = useCopyToClipboard();
	const [contentCopied, setContentCopied] = useState<boolean>(false);

	const handleCopy = async (text: string) => {
		const copied = await copy(content);
		setContentCopied(copied);
	};

	useEffect(() => {
		if (contentCopied) {
			setTimeout(() => {
				setContentCopied(false);
			}, 2000);
		}
	}, [contentCopied]);

	return (
		<Button
			variant="ghost"
			size="icon"
			className={className}
			onClick={(e) => {
				e.stopPropagation();
				handleCopy(content);
			}}
		>
			{contentCopied ? (
				<CheckIcon className="min-w-5 h-5" />
			) : (
				<Copy className="min-w-5 h-5" />
			)}
		</Button>
	);
};

export default ClipBoard;
