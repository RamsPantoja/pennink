import type { ReactNode } from "react";

type SharedContentLayoutProps = {
	children: ReactNode;
};

export const SharedContentLayout = ({ children }: SharedContentLayoutProps) => {
	return (
		<div className="bg-light-mocha-base relative dark:bg-mocha-base flex h-screen w-full flex-col overflow-hidden items-center">
			<div className="flex w-full border-b border-light-mocha-mauve dark:border-mocha-mauve justify-center">
				<div className="flex w-full text-light-mocha-text dark:text-mocha-text h-full gap-2 max-w-5xl border-l border-light-mocha-mauve dark:border-mocha-mauve p-4 justify-end">
					<h1 className="text-xs">Powered by Pennink</h1>
				</div>
			</div>
			<div className="flex w-full h-full gap-2 max-w-5xl border-l text-light-mocha-text border-light-mocha-mauve dark:border-mocha-mauve p-6 dark:text-mocha-text overflow-hidden">
				{children}
			</div>
		</div>
	);
};
