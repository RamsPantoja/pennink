import EditorJS, {
	type OutputData,
	type BlockToolConstructable,
} from "@editorjs/editorjs";
import Header from "@editorjs/header";
import EditorjsList from "@editorjs/list";
// import Quote from "@editorjs/quote";
// import Table from "@editorjs/table";
import { useEffect, useState } from "react";
import { Card } from "../ui/card";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

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
					const handleOnHideTooltip = () => {
						api.tooltip.hide();
					};

					const acceptSuggestion = async ({
						tool,
						blockId,
						event,
						suggestion,
					}: AcceptSuggestionProps) => {
						if (event.ctrlKey && event.shiftKey && event.key === "Enter") {
							api.tooltip.hide();
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
						}
					};

					if (!suggestionFlag && !Array.isArray(event)) {
						if (event.type === "block-changed") {
							const svg = document.createElementNS(
								"http://www.w3.org/2000/svg",
								"svg",
							);
							const path = document.createElementNS(
								"http://www.w3.org/2000/svg",
								"path",
							);

							// Set SVG attributes
							svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
							svg.setAttribute("fill", "none");
							svg.setAttribute("viewBox", "0 0 24 24");
							svg.setAttribute("stroke-width", "1.5");
							svg.setAttribute("stroke", "currentColor");
							svg.setAttribute("class", "size-6");

							// Set path attributes
							path.setAttribute("stroke-linecap", "round");
							path.setAttribute("stroke-linejoin", "round");
							path.setAttribute(
								"d",
								"M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z",
							);

							svg.appendChild(path);
							svg.classList.add("min-w-5");

							const tooltipNode = document.createElement("div");
							tooltipNode.classList.add("p-2", "flex", "flex-col", "gap-4");
							const suggestionContainer = document.createElement("div");
							suggestionContainer.classList.add(
								"flex",
								"items-center",
								"gap-2",
								"max-w-screen-sm",
							);
							const suggestion = document.createElement("p");
							suggestion.classList.add("text-mochaBase");
							suggestionContainer.append(svg);
							suggestionContainer.append(suggestion);
							const commandContainer = document.createElement("div");
							commandContainer.classList.add("flex", "items-center", "gap-2");
							const command = document.createElement("span");
							command.classList.add(
								"p-2",
								"rounded-md",
								"border",
								"border-mochaTeal",
								"w-fit",
								"text-mochaTeal",
							);
							command.textContent = "Ctrl + Shift + Enter";
							const action = document.createElement("span");
							action.classList.add("text-mochaTeal");
							action.textContent = "Accept";
							commandContainer.append(command);
							commandContainer.append(action);
							tooltipNode.append(suggestionContainer);
							tooltipNode.append(commandContainer);

							const data = await event.detail.target.save();

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

							if (data) {
								document.addEventListener("click", handleOnHideTooltip);

								switch (data.tool) {
									case "paragraph":
										{
											const res = await onSentPromptMutation(data.data.text);

											const streamRes = await handleStream(res);

											if (streamRes) {
												suggestion.textContent = streamRes;

												api.tooltip.show(
													event.detail.target.holder,
													tooltipNode,
												);

												document.addEventListener("keydown", (e) => {
													acceptSuggestion({
														event: e,
														tool: data.tool,
														blockId: event.detail.target.id,
														suggestion: streamRes,
													});
												});
											}
										}
										break;
									case "header":
										{
											const res = await onSentPromptMutation(data.data.text);

											const streamRes = await handleStream(res);

											if (streamRes) {
												suggestion.textContent = streamRes;

												api.tooltip.show(
													event.detail.target.holder,
													tooltipNode,
												);

												document.addEventListener("keydown", (e) => {
													acceptSuggestion({
														event: e,
														tool: data.tool,
														blockId: event.detail.target.id,
														suggestion: streamRes,
													});
												});
											}
										}
										break;
									default:
										console.log("Unknown tool");
										break;
								}
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
		<Card
			id="editorjs"
			className="w-full h-full flex flex-col pl-20 bg-transparent overflow-auto markdown-styles prismjs-theme"
		/>
	);
};

export default Editor;
