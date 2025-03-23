// components/ScrollToBottomButton.js
import React, { useEffect, useState } from "react";
import { Button } from "./Button";
import { ArrowDownIcon } from "@heroicons/react/24/outline";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type ScrollToBottomButtonProps = {
	scrollableElementId: string;
};

export const ScrollToBottomButton = ({
	scrollableElementId,
}: ScrollToBottomButtonProps) => {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const element = document.getElementById(scrollableElementId);
			if (element) {
				const isScrolledToBottom =
					element.scrollHeight - element.scrollTop === element.clientHeight;
				setIsVisible(!isScrolledToBottom);
			}
		};

		const element = document.getElementById(scrollableElementId);
		if (element) {
			element.addEventListener("scroll", handleScroll);
		}

		return () => {
			if (element) {
				element.removeEventListener("scroll", handleScroll);
			}
		};
	}, [scrollableElementId]);

	const handleScrollToBottom = () => {
		const element = document.getElementById(scrollableElementId);
		if (element) {
			element.scrollTo({
				top: element.scrollHeight,
				behavior: "smooth",
			});
		}
	};

	return (
		<>
			{isVisible && (
				<div className="absolute bottom-2 w-full flex justify-center ring-0 left-0">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="icon"
								className="rounded-full animate-bounce"
								onClick={handleScrollToBottom}
							>
								<ArrowDownIcon className="min-w-5 h-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Scroll to bottom</TooltipContent>
					</Tooltip>
				</div>
			)}
		</>
	);
};
