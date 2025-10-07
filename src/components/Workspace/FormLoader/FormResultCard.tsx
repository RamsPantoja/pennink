import { Card } from "~/components/ui/card";
import { useFormLoaderStore } from "./useFormLoaderStore";
import { useTranslations } from "next-intl";

type FormResultCardProps = {
	email: string;
	username: string;
	createdAt: Date;
	id: string;
};

export const FormResultCard = ({
	email,
	username,
	createdAt,
	id,
}: FormResultCardProps) => {
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
				<p className="text-xs text-mocha-sub-text">
					{createdAt.toLocaleString()}
				</p>
			</div>
		</Card>
	);
};
