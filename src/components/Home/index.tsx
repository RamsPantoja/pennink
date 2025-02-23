import { ArrowUpIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

export const HomeComponent = () => {
	return (
		<div className="flex w-full pl-4 pr-4 pt-0 pb-4 h-full justify-center">
			<Card className="max-w-screen-lg w-full gap-8 flex flex-col">
				<p className="text-center text-3xl font-bold">
					¿Que quieres aprender hoy?
				</p>
				<Card className="border-2 w-full bg-white flex flex-col gap-4">
					<Textarea
						placeholder="Sube un archivo o pega un link de youtube"
						className="resize-none bg-mochaBase"
						rows={2}
						// {...register("message")}
						// status={errors.message && "ERROR"}
					/>
					<div className="flex w-full gap-4 justify-between items-center">
						<div className="flex items-center gap-4">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="ghost" size="icon">
										<PaperClipIcon className="min-w-5 w-5 h-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Sube archivos y más</TooltipContent>
							</Tooltip>
						</div>
						<Button variant="ghost" size="icon">
							<ArrowUpIcon className="min-w-5 w-5 h-5" />
						</Button>
					</div>
				</Card>
			</Card>
		</div>
	);
};
