import Image from "next/image";

export const Logo = () => {
	return (
		<div className="flex items-center gap-2 p-2">
			<div className="relative w-6 h-6">
				<Image
					src="/Feather-nb.png"
					alt="Athenscript Logo"
					className="w-full h-full"
					layout="fill"
				/>
			</div>
			<p className="text-2xl font-semibold truncate text-mochaMauve">Pennink</p>
		</div>
	);
};
