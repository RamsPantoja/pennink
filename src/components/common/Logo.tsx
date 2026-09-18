import Image from "next/image";

export const Logo = () => {
	return (
		<div className="flex items-center gap-2 p-2">
			<div className="relative w-10 h-10">
				<Image
					src="/favicon.svg"
					alt="Pennink Logo"
					className="w-full h-full"
					layout="fill"
				/>
			</div>
			<p className="text-2xl font-semibold truncate text-foreground">Pennink</p>
		</div>
	);
};
