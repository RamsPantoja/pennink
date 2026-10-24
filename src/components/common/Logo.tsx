import Image from "next/image";
import { useTranslations } from "next-intl";

export const Logo = () => {
	const t = useTranslations("Logo");
	return (
		<div className="flex items-center gap-2 p-2">
			<div className="relative w-10 h-10">
				<Image
					src="/favicon.svg"
					alt={t("alt")}
					className="w-full h-full"
					layout="fill"
				/>
			</div>
			<p className="text-2xl font-semibold truncate text-foreground">Pennink</p>
		</div>
	);
};
