import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
	type EvaluationSchemaDraft,
	saveEvaluationSchemaDraft,
} from "~/components/EvaluationSchema/draft-handoff";
import { Button } from "../common/Button";
import { Card } from "../ui/card";

const PREVIEW_COUNT = 5;

export const EvaluationSchemaDraftCard = ({
	draft,
}: {
	draft: EvaluationSchemaDraft;
}) => {
	const t = useTranslations("EvaluationSchema.draftCard");
	const router = useRouter();
	const questions = draft.definition.questions;
	const preview = questions.slice(0, PREVIEW_COUNT);

	const onReview = () => {
		if (saveEvaluationSchemaDraft(draft)) {
			router.push("/evaluation-schemas");
		}
	};

	return (
		<Card className="flex flex-col gap-3 border border-border bg-muted p-4">
			<div className="flex items-center gap-3">
				<ClipboardDocumentListIcon className="h-8 w-8 min-w-8 text-primary" />
				<div className="min-w-0 flex-1">
					<p className="truncate font-medium text-foreground">{draft.name}</p>
					<p className="text-xs text-muted-foreground">
						{t("questions", { count: questions.length })}
					</p>
				</div>
				<Button variant="outline" size="sm" onClick={onReview}>
					{t("review")}
				</Button>
			</div>
			<ol className="flex list-decimal flex-col gap-1 pl-5 text-sm text-foreground">
				{preview.map((question) => (
					<li key={question.key}>{question.instructions}</li>
				))}
			</ol>
			{questions.length > PREVIEW_COUNT && (
				<p className="text-xs text-muted-foreground">
					{t("more", { count: questions.length - PREVIEW_COUNT })}
				</p>
			)}
		</Card>
	);
};
