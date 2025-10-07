import { Fragment } from "react";
import { Button } from "~/components/common/Button";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { Links } from "./Links";
import { Results } from "./Results";
import { type BreadcrumbType, useFormLoaderStore } from "./useFormLoaderStore";
import { ResultOverview } from "./Overview";
import { useTranslations } from "next-intl";

export const Manager = () => {
	const t = useTranslations("FormLoader");
	const { currentForm, currentLink, breadcrumbs, setBreadcrumbs, resultId } =
		useFormLoaderStore();

	return (
		<div className="flex flex-col flex-1">
			<Breadcrumb>
				<BreadcrumbList>
					{Object.keys(breadcrumbs).map((breadcrumb, index) => {
						return (
							<Fragment key={index}>
								<BreadcrumbItem>
									<Button
										onClick={() => {
											if (breadcrumb === ("links" as BreadcrumbType)) {
												setBreadcrumbs({
													links: breadcrumbs[breadcrumb as BreadcrumbType],
												});
											}

											if (breadcrumb === ("results" as BreadcrumbType)) {
												setBreadcrumbs({
													links: t("breadcrumbs.links"),
													results: t("breadcrumbs.results"),
												});
											}
										}}
										variant="link"
										size="sm"
									>
										{breadcrumbs[breadcrumb as BreadcrumbType]}
									</Button>
								</BreadcrumbItem>
								{index < Object.keys(breadcrumbs).length - 1 && (
									<BreadcrumbSeparator />
								)}
							</Fragment>
						);
					})}
				</BreadcrumbList>
			</Breadcrumb>
			{!breadcrumbs.results &&
				!breadcrumbs.overview &&
				breadcrumbs.links &&
				currentForm && <Links id={currentForm.id} type={currentForm.type} />}
			{breadcrumbs.links &&
				!breadcrumbs.overview &&
				breadcrumbs.results &&
				currentLink &&
				currentForm && <Results type={currentForm.type} link={currentLink} />}
			{breadcrumbs.links &&
				breadcrumbs.results &&
				breadcrumbs.overview &&
				currentForm &&
				resultId && (
					<ResultOverview resultId={resultId} type={currentForm.type} />
				)}
		</div>
	);
};
