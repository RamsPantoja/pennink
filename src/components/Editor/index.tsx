import EditorJS, {
	type OutputData,
	type BlockToolConstructable,
} from "@editorjs/editorjs";
import Header from "@editorjs/header";
import EditorjsList from "@editorjs/list";
// import Quote from "@editorjs/quote";
// import Table from "@editorjs/table";
import { Fragment, useEffect, useState } from "react";
import { Card } from "../ui/card";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	useFloating,
	autoUpdate,
	offset,
	autoPlacement,
	FloatingPortal,
	FloatingOverlay,
} from "@floating-ui/react";
import { SparklesIcon } from "@heroicons/react/24/outline";

export type EditorProps = {
	onSave: (data: OutputData) => void;
	data: OutputData | null | undefined;
};

type PredictionRes = {
	code: number;
	prediction: string;
};

type AcceptSuggestionProps = {
	event: KeyboardEvent;
	blockId: string;
	tool: string;
	suggestion: string;
};

const Editor = ({ onSave, data }: EditorProps) => {
	const { editorJS, setEditorJS } = useWorkspaceStore();
	const [displaySuggestion, setDisplaySuggestion] = useState<boolean>(false);
	const { refs, floatingStyles } = useFloating({
		whileElementsMounted: autoUpdate,
		middleware: [autoPlacement(), offset(10)],
		open: displaySuggestion,
	});
	const [suggestion, setSuggestion] = useState<string>("");

	const { mutateAsync: onSentPromptMutation } = useMutation({
		mutationFn: (prompt: string) => {
			return fetch("/api/ai/edit-prediction", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt,
				}),
			});
		},
		onError: (error) => {
			// Handle error
			console.error("Mutation failed:", error);
			toast.error("An error occurred while sending your message.");
		},
	});

	useEffect(() => {
		if (!editorJS) {
			let suggestionFlag = false;

			const editor = new EditorJS({
				holder: "editorjs",
				placeholder: "Start typing (use `/` for commands)",
				tools: {
					header: {
						class: Header as unknown as BlockToolConstructable,
					},
					list: {
						class: EditorjsList as unknown as BlockToolConstructable,
					},
				},
				data: data ?? undefined,

				onChange: async (api, event) => {
					const controllerOnKeyDown = new AbortController();
					const controllerOnClick = new AbortController();

					const handleOnHideTooltip = (event: MouseEvent) => {
						if (
							refs.floating.current &&
							!refs.floating.current.contains(event.target as Node)
						) {
							controllerOnKeyDown.abort();
							setDisplaySuggestion(false);
							setSuggestion("");
							controllerOnClick.abort();
						}
					};

					const acceptSuggestion = async ({
						tool,
						blockId,
						event,
						suggestion,
					}: AcceptSuggestionProps) => {
						if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
							setDisplaySuggestion(false);
							setSuggestion("");
							suggestionFlag = true;

							switch (tool) {
								case "header":
									{
										await api.blocks.update(blockId, {
											text: suggestion,
										});
									}

									break;
								case "paragraph":
									{
										await api.blocks.update(blockId, {
											text: suggestion,
										});
									}
									break;
								default:
									break;
							}

							controllerOnKeyDown.abort();
						}
					};

					if (!suggestionFlag && !Array.isArray(event)) {
						const data = await event.detail.target.save();

						if (
							event.type === "block-changed" &&
							data &&
							data.data?.text?.trim() !== "/" &&
							data.data?.text?.trim() !== ""
						) {
							const handleStream = async (res: Response) => {
								const stream = res.body;

								if (!stream) return "";

								try {
									const reader = stream.getReader();
									const textDecoder = new TextDecoder();
									const buffer: Uint8Array<ArrayBufferLike>[] = [];

									while (true) {
										const { done, value } = await reader.read();

										if (value) {
											buffer.push(value);
										}

										if (done) {
											reader.releaseLock();
											break;
										}
									}

									const decodedRes = textDecoder.decode(...buffer);
									const parsedRes = JSON.parse(decodedRes) as PredictionRes;

									return parsedRes.prediction;
								} catch (error) {
									console.error(error);
								}
							};

							document.addEventListener("mousedown", handleOnHideTooltip, {
								signal: controllerOnClick.signal,
							});

							switch (data.tool) {
								case "paragraph":
									{
										const res = await onSentPromptMutation(
											`${data.tool}: ${data.data.text}`,
										);

										const streamRes = await handleStream(res);

										if (streamRes) {
											setSuggestion(streamRes);
											refs.setReference(event.detail.target.holder);
											setDisplaySuggestion(true);

											document.addEventListener(
												"keydown",
												async (e) => {
													await acceptSuggestion({
														event: e,
														tool: data.tool,
														blockId: event.detail.target.id,
														suggestion: streamRes,
													});
												},
												{ signal: controllerOnKeyDown.signal },
											);
										}
									}
									break;
								case "header":
									{
										const res = await onSentPromptMutation(
											`${data.tool}: ${data.data.text}`,
										);

										const streamRes = await handleStream(res);

										if (streamRes) {
											setSuggestion(streamRes);
											refs.setReference(event.detail.target.holder);
											setDisplaySuggestion(true);

											document.addEventListener(
												"keydown",
												async (e) => {
													await acceptSuggestion({
														event: e,
														tool: data.tool,
														blockId: event.detail.target.id,
														suggestion: streamRes,
													});
												},
												{ signal: controllerOnKeyDown.signal },
											);
										}
									}
									break;
								default:
									console.log("Unknown tool");
									break;
							}
						}
					}

					suggestionFlag = false;

					api.saver.save().then((outputData) => {
						onSave(outputData);
					});
				},
			});

			setEditorJS(editor);
		}

		return () => {
			if (typeof editorJS?.destroy === "function") {
				editorJS.destroy();
				setEditorJS(null);
			}
		};
	}, [editorJS]);

	return (
		<Fragment>
			{/* <FloatingOverlay /> */}
			{displaySuggestion && (
				<FloatingPortal>
					<div
						className="flex shadow-md overflow-hidden border border-mochaMauve bg-mochaBase rounded-md z-10 flex-col gap-4 max-w-xl max-h-96"
						ref={refs.setFloating}
						style={floatingStyles}
					>
						<div className="flex gap-2 flex-1 overflow-hidden bg-mochaTeal p-2 border-b border-mochaMauve">
							<SparklesIcon className="min-w-5 h-5 text-mochaMauve" />
							<p className="text-sm font-semibold text-mochaMauve">
								AI suggestion
							</p>
						</div>
						<p className="text-xs text-mochaMauve overflow-auto p-2">
							{suggestion}
						</p>
						<div className="flex items-center gap-2 pl-2 pb-2 pr-2 text-xs">
							<p className="text-xs p-1 border border-mochaMauve rounded-md">
								Ctrl
							</p>
							+
							<p className="text-xs p-1 border border-mochaMauve rounded-md">
								Shift
							</p>
							+
							<p className="text-xs p-1 border border-mochaMauve rounded-md">
								Enter
							</p>
							Accept
						</div>
					</div>
				</FloatingPortal>
			)}

			<Card
				id="editorjs"
				className="w-full h-full flex flex-col pl-20 bg-transparent overflow-auto markdown-styles prismjs-theme"
			/>
		</Fragment>
	);
};

export default Editor;
