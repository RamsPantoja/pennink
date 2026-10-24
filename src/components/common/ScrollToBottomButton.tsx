// components/ScrollToBottomButton.js
import React, { useEffect, useState } from "react";
import { Button } from "./Button";
import { ArrowDownIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type ScrollToBottomButtonProps = {
	scrollableElementId: string;
};

export const ScrollToBottomButton = ({
	scrollableElementId,
}: ScrollToBottomButtonProps) => {
	const t = useTranslations("ScrollToBottomButton");
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
				<div className="absolute bottom-2 w-fit flex justify-center m-auto items-center left-0 right-0">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								size="icon"
								className="rounded-full animate-bounce border border-foreground"
								onClick={handleScrollToBottom}
							>
								<ChevronDownIcon className="min-w-5 h-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>{t("tooltip")}</TooltipContent>
					</Tooltip>
				</div>
			)}
		</>
	);
};
