import type { FC } from "react";
import { Card } from "../../ui/card";
import type { FormType } from "~/lib/enum";
import { LinksManager } from "../../FormEditor/LinksManager";
import type { CurrentForm } from "../useWorkspaceStore";
import { Badge } from "../../ui/badge";
import { Button } from "../../common/Button";
import { LinkIcon } from "@heroicons/react/24/outline";

type FormCardProps = {
	id: string;
	title: string;
	type: FormType;
	date: string;
	onOpen: (form: CurrentForm) => void;
	onResults: () => void;
};

export const FormCard: FC<FormCardProps> = ({
	title,
	type,
	date,
	onOpen,
	onResults,
	id,
}) => {
	return (
		<Card className="bg-mocha-mantle hover:bg-mocha-mantle/50 transition-colors border h-fit w-full">
			<div className="flex gap-4 flex-col">
				<div className="flex gap-2 flex-col justify-between">
					<div className="flex items-center gap-4 justify-between">
						<p
							className="font-medium text-sm line-clamp-1 text-mocha-text truncate max-w-60"
							title={title}
						>
							{title}
						</p>
						<Badge variant="outline">{type.toUpperCase()}</Badge>
					</div>
					<span className="text-xs text-muted-foreground">{date}</span>
				</div>
				<div className="flex items-center gap-2">
					<Button size="sm" onClick={(e) => onOpen({ id, type })}>
						Open
					</Button>
					<LinksManager id={id} type={type} />
					<Button
						size="sm"
						variant="outline"
						startIcon={<LinkIcon className="min-w-5 h-5" />}
						onClick={onResults}
					>
						Links
					</Button>
				</div>
			</div>
		</Card>
	);
};
