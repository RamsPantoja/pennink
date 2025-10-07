import { Card } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { useFormLoaderStore } from "./useFormLoaderStore";
import { useTranslations } from "next-intl";

type ExamResultCardProps = {
	email: string;
	username: string;
	createdAt: Date;
	score: number;
	id: string;
};

export const ExamResultCard = ({
	email,
	username,
	createdAt,
	score,
	id,
}: ExamResultCardProps) => {
	const t = useTranslations();
	const { setResultId, setBreadcrumbs, breadcrumbs } = useFormLoaderStore();

	return (
		<Card
			onClick={() => {
				setResultId(id);
				setBreadcrumbs({
					...breadcrumbs,
					overview: t("FormLoader.breadcrumbs.overview"),
				});
			}}
			className="flex w-full gap-4 justify-between bg-mocha-mantle hover:bg-mocha-mantle/50"
		>
			<div className="flex flex-col gap-1">
				<p className="text-sm">{email}</p>
				<p className="text-sm">{username}</p>
			</div>
			<div className="flex flex-col gap-2">
				<p className="text-sm">Score: {score}</p>
				<Progress value={score} />
				<p className="text-xs text-mocha-sub-text">
					{createdAt.toLocaleString()}
				</p>
			</div>
		</Card>
	);
};
