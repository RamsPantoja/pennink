import type { FC } from "react";
import { Card } from "../ui/card";
import type { FormType } from "~/lib/enum";
import { LinksManager } from "../FormEditor/LinksManager";

type FormCardProps = {
	id: string;
	title: string;
	type: FormType;
	date: string;
	onSelect: (doc: any) => void;
};

export const FormCard: FC<FormCardProps> = ({
	title,
	type,
	date,
	onSelect,
	id,
}) => {
	const onSelectDocument = () => {
		// onSelect();
	};

	return (
		<Card
			className="bg-mocha-mantle hover:bg-mocha-mantle/50 transition-colors cursor-pointer border h-fit w-full"
			onClick={onSelectDocument}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div>
						<h3 className="font-medium text-sm line-clamp-1 text-mocha-text">
							{title}
						</h3>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<span>{type.toUpperCase()}</span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-xs text-muted-foreground">{date}</span>
					<LinksManager id={id} type={type} />
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
		</Card>
	);
};
