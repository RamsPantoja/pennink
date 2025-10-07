import type { FC } from "react";
import { Card } from "../ui/card";
import { Button } from "../common/Button";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { env } from "~/env";
import type { PenninkDocument } from "./useWorkspaceStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { useTranslations } from "next-intl";

type PDFDocumentCardProps = {
	id: string;
	title: string;
	type: string;
	date: string;
	onSelect: (doc: PenninkDocument) => void;
	storageKey: string;
};

const PDFDocumentCard: FC<PDFDocumentCardProps> = ({
	title,
	type,
	date,
	onSelect,
	id,
	storageKey,
}) => {
	const t = useTranslations("PDFDocumentCard");

	const handleDownload = async (e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			const response = await fetch(
				`${env.NEXT_PUBLIC_BUCKET_PUBLIC_DOMAIN}/${storageKey}`,
			);
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = title;
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		} catch (error) {
			console.error(t("error.download"), error);
		}
	};

	const onSelectDocument = () => {
		onSelect({
			filename: title,
			type,
			id,
			src: `${env.NEXT_PUBLIC_BUCKET_PUBLIC_DOMAIN}/${storageKey}`,
		});
	};

	return (
		<Card
			className="bg-mocha-mantle hover:bg-mocha-mantle/50 transition-colors cursor-pointer h-full w-full p-0 flex"
			onClick={onSelectDocument}
		>
			<div className="flex flex-col w-full">
				<div className="flex w-full h-32 relative">
					<div className="flex gap-2 text-xs absolute top-2 right-2 z-10">
						{type === "application/pdf" && (
							<Badge variant="secondary">{t("badge.pdf")}</Badge>
						)}
					</div>
				</div>
				<div className="flex gap-3 p-3 w-full flex-col backdrop-blur-xs bg-black-main/30">
					<h3
						className="font-medium text-sm text-mocha-text truncate w-full"
						title={title}
					>
						{title}
					</h3>
					<div className="flex items-center gap-2">
						<span className="text-xs text-mocha-sub-text">{date}</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={handleDownload}
								>
									<ArrowUpTrayIcon className="h-4 min-w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>{t("tooltip.download")}</TooltipContent>
						</Tooltip>
					</div>
				</div>
			</div>
		</Card>
	);
};

export default PDFDocumentCard;
