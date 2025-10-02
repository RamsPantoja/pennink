import type { FC } from "react";
import { Card } from "../ui/card";
import { Button } from "../common/Button";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { env } from "~/env";
import type { PenninkDocument } from "./useWorkspaceStore";
import { pdfjs, Document, Page } from "react-pdf";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Loading } from "../common/Loading";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	"pdfjs-dist/build/pdf.worker.min.mjs",
	import.meta.url,
).toString();

type DocumentCardProps = {
	id: string;
	title: string;
	type: "pdf" | "doc" | "image" | "zip" | string;
	date: string;
	onSelect: (doc: PenninkDocument) => void;
	storageKey: string;
};
const DocumentCard: FC<DocumentCardProps> = ({
	title,
	type,
	date,
	onSelect,
	id,
	storageKey,
}) => {
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
			console.error("Error downloading file:", error);
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
				<div className="flex p-3 w-full h-32 relative">
					<div className="left-0 top-0 right-0 bottom-0 absolute flex" />
					<Document
						file={`${env.NEXT_PUBLIC_BUCKET_PUBLIC_DOMAIN}/${storageKey}`}
						loading={<Loading />}
						className="h-full w-full flex overflow-hidden rounded-md"
						onLoadError={() => {
							console.log("Error while loading document!");
						}}
					>
						<Page
							height={128}
							width={160}
							pageNumber={1}
							onRenderError={() => {
								console.log("Error while rendering page!");
							}}
							onLoadError={() => {
								console.log("Error while loading page!");
							}}
							loading={<Loading />}
						/>
					</Document>
				</div>

				<div className="flex gap-3 p-3 w-full flex-col">
					<h3
						className="font-medium text-sm text-mocha-text truncate w-full"
						title={title}
					>
						{title}
					</h3>
					<div className="flex gap-2 text-xs text-muted-foreground">
						<span>{type.toUpperCase()}</span>
					</div>
					<div className="flex items-center gap-2 ">
						<span className="text-xs text-muted-foreground">{date}</span>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8"
									onClick={handleDownload}
								>
									<ArrowDownTrayIcon className="h-4 min-w-4" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Download</TooltipContent>
						</Tooltip>
						{/* <DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon" className="h-8 w-8">
									<EllipsisVerticalIcon className="h-4 min-w-4" />
									<span className="sr-only">Open menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem className="flex gap-2">
									<ArrowDownTrayIcon className="min-w-5 w-5 h-5" />
									Download
								</DropdownMenuItem>
								<DropdownMenuItem className="flex gap-2 text-red-500">
									<TrashIcon className="min-w-5 w-5 h-5" />
									Delete
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu> */}
					</div>
				</div>
			</div>
		</Card>
	);
};

export default DocumentCard;
