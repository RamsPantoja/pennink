import type { FC } from "react";
import { Card } from "../ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../common/Button";
import {
	ArrowDownTrayIcon,
	DocumentTextIcon,
	EllipsisVerticalIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import { env } from "~/env";
import type { PenninkDocument } from "./useWorkspaceStore";

type DocumentCardProps = {
	id: string;
	title: string;
	type: "pdf" | "doc" | "image" | "zip" | string;
	date: string;
	onSelect: (doc: PenninkDocument) => void;
	storageKey: string;
};

export const DocumentCard: FC<DocumentCardProps> = ({
	title,
	type,
	date,
	onSelect,
	id,
	storageKey,
}) => {
	const getIcon = () => {
		switch (type) {
			default:
				return <DocumentTextIcon className="h-5 min-w-6" />;
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
			className="hover:bg-accent/50 transition-colors cursor-pointer border h-fit w-full"
			onClick={onSelectDocument}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					{getIcon()}
					<div>
						<h3 className="font-medium text-sm line-clamp-1">{title}</h3>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span>{type.toUpperCase()}</span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">{date}</span>
					<DropdownMenu>
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
					</DropdownMenu>
				</div>
			</div>
		</Card>
	);
};
