import type { ReactNode } from "react";

type SharedContentLayoutProps = {
	children: ReactNode;
};

export const SharedContentLayout = ({ children }: SharedContentLayoutProps) => {
	return (
		<div className="bg-background relative dark:bg-background flex h-screen w-full flex-col overflow-hidden items-center">
			<div className="flex w-full border-b border-border dark:border-border justify-center">
				<div className="flex w-full text-foreground dark:text-foreground h-full gap-2 max-w-5xl border-l border-border dark:border-border p-4 justify-end">
					<h1 className="text-xs">Powered by Pennink</h1>
				</div>
			</div>
			<div className="flex w-full h-full gap-2 max-w-5xl border-l text-foreground border-border dark:border-border p-6 dark:text-foreground overflow-hidden">
				<div className="flex w-full absolute justify-center left-0 right-0 bottom-0 top-[49px] overflow-auto">
					<div className="flex w-full max-w-5xl p-6 flex-col gap-4">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
};
