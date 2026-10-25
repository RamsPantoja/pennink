import type { FC } from "react";
import { Card } from "../ui/card";
import { Button } from "../common/Button";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { env } from "~/env";
import type { PenninkDocument } from "./useWorkspaceStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { useTranslations } from "next-intl";
import {
	SOURCE_DOCUMENT_TYPES,
	isSourceDocumentType,
	type SourceDocumentKind,
} from "~/lib/documentTypes";

const HEADER_CLASSNAMES: Record<SourceDocumentKind, string> = {
	pdf: "bg-red-400",
	docx: "bg-blue-400",
	text: "bg-gray-400",
};

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
	const badgeKey = SOURCE_DOCUMENT_TYPES[
		isSourceDocumentType(type) ? type : "application/pdf"
	].kind;

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
			className="bg-muted hover:bg-muted/50 transition-colors cursor-pointer h-fit w-full p-0 flex"
			onClick={onSelectDocument}
		>
			<div className="flex flex-col w-full">
				<div
					className={`flex w-full h-10 relative rounded-t-2xl ${HEADER_CLASSNAMES[badgeKey]}`}
				>
					<div className="flex gap-2 text-xs absolute top-2 right-2 z-10">
						<Badge variant="secondary">{t(`badge.${badgeKey}`)}</Badge>
					</div>
				</div>
				<div className="flex gap-3 p-3 w-full flex-col">
					<h3
						className="font-medium text-sm text-foreground truncate w-full"
						title={title}
					>
						{title}
					</h3>
					<div className="flex items-center gap-2">
						<span className="text-xs text-muted-foreground">{date}</span>
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
