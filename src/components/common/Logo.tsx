import Image from "next/image";

export const Logo = () => {
	return (
		<div className="flex items-center gap-2 p-2">
			<div className="relative w-10 h-10">
				<Image
					src="/icon.png"
					alt="Athenscript Logo"
					className="w-full h-full"
					layout="fill"
				/>
			</div>
			<p className="text-2xl font-semibold truncate text-mocha-text">Pennink</p>
		</div>
	);
};
