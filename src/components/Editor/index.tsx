import EditorJS, {
	type OutputData,
	type BlockToolConstructable,
	type ToolConstructable,
} from "@editorjs/editorjs";
import Header from "@editorjs/header";
import EditorjsList from "@editorjs/list";
// import Quote from "@editorjs/quote";
// import Table from "@editorjs/table";
// @ts-expect-error TS(7053): No type definitions for the following module.
import AIText from "@alkhipce/editorjs-aitext";
import { useEffect, useRef, useState } from "react";
import { Card } from "../ui/card";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { useShallow } from "zustand/react/shallow";
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
					aiText: {
						// if you do not use TypeScript you need to remove "as unknown as ToolConstructable" construction
						// type ToolConstructable imported from @editorjs/editorjs package
						class: AIText as unknown as ToolConstructable,
						config: {
							// here you need to provide your own suggestion provider (e.g., request to your backend)
							// this callback function must accept a string and return a Promise<string>
							callback: async (text: string) => {
								const res = await onSentPromptMutation(text);
								const handleStream = async () => {
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

								return handleStream();
							},
						},
					},
				},
				data: data ?? undefined,
				onChange: (api, event) => {
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
