import { type KeyboardEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
	useFloating,
	autoUpdate,
	offset,
	autoPlacement,
	FloatingPortal,
} from "@floating-ui/react";
import { ArrowUpTrayIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { BlockNoteView, darkDefaultTheme } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
	FormattingToolbar,
	FormattingToolbarController,
	getDefaultReactSlashMenuItems,
	getFormattingToolbarItems,
	SuggestionMenuController,
	useCreateBlockNote,
} from "@blocknote/react";
import { en } from "@blocknote/core/locales";
import { en as aiEn } from "@blocknote/xl-ai/locales";
import {
	AIMenuController,
	AIToolbarButton,
	createAIExtension,
	getAISlashMenuItems,
} from "@blocknote/xl-ai";
import "@blocknote/xl-ai/style.css"; // add the AI stylesheet
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import {
	type BlockNoteEditor,
	filterSuggestionItems,
	type Block,
} from "@blocknote/core";
import { env } from "~/env";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../common/Button";
import {
	PDFExporter,
	pdfDefaultSchemaMappings,
} from "@blocknote/xl-pdf-exporter";
import * as ReactPDF from "@react-pdf/renderer";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import {
	DOCXExporter,
	docxDefaultSchemaMappings,
} from "@blocknote/xl-docx-exporter";
import { Packer } from "docx";
import InsertContentLinkDialog from "./InsertContentLinkDialog";
import type { EditPredictionData } from "~/app/api/ai/edit-prediction/route";
import { ShareLinkEditor } from "./ShareLinkEditor";
import type { RouterOutputs } from "~/utils/api";

const allowedBlockTypesWithAIPrediction: Block["type"][] = [
	"paragraph",
	"heading",
	"numberedListItem",
	"bulletListItem",
];

const concatTextContentFromBlock = (block: Block) => {
	const { type, content } = block;

	const recursivelyConcatTextContent = (content: Block["content"]): string => {
		if (!Array.isArray(content)) {
			return "";
		}

		return content.reduce((accumulator, item) => {
			if (item.type === "text") {
				return accumulator + item.text;
			}

			if (item.content && item.content.length >= 1) {
				return accumulator + recursivelyConcatTextContent(item.content);
			}

			return accumulator;
		}, "");
	};

	if (allowedBlockTypesWithAIPrediction.includes(type)) {
		// Base case: if data is not an array, return empty string
		if (!Array.isArray(content)) {
			return "";
		}

		// Reduce the array to a single string
		return recursivelyConcatTextContent(content);
	}

	return null;
};

export type EditorProps = {
	onSave: (data: Block[]) => void;
	data: RouterOutputs["workspace"]["workspaceById"]["note"];
};

type PredictionRes = {
	code: number;
	prediction: string;
};

type AcceptSuggestionProps = {
	event: globalThis.KeyboardEvent;
	block: Block;
	suggestion: string;
};

const getCredentials = async () => {
	const res = await fetch(`${env.NEXT_PUBLIC_BASE_URL}/api/ai-credentials`, {
		method: "GET",
	});
	const resJson = await res.json();

	return resJson.credentials;
};

export const Editor = ({ onSave, data }: EditorProps) => {
	const { content, id } = data;

	const bedrock = createAmazonBedrock({
		region: "us-west-2",
		credentialProvider: getCredentials,
	});
	const model = bedrock("us.amazon.nova-pro-v1:0");
	const [displaySuggestion, setDisplaySuggestion] = useState<boolean>(false);
	const { refs, floatingStyles } = useFloating({
		whileElementsMounted: autoUpdate,
		middleware: [autoPlacement(), offset(10)],
		open: displaySuggestion,
	});
	const [suggestion, setSuggestion] = useState<string>("");
	const controllerOnSendPrompt = new AbortController();
	const controllerOnKeyDown = new AbortController();
	const controllerOnClick = new AbortController();
	const [suggestionTimer, setSuggestionTimer] = useState<NodeJS.Timeout | null>(
		null,
	);
	const [saveTimer, setSaveTimer] = useState<NodeJS.Timeout | null>(null);
	const { workspaceTitle, setEditor } = useWorkspaceStore();
	const [isExporting, setIsExporting] = useState<boolean>(false);

	const editor = useCreateBlockNote({
		defaultStyles: false,
		dictionary: {
			...en,
			ai: aiEn, // add default translations for the AI extension
			placeholders: {
				...en.placeholders,
				default: "Write, type '/ai' for AI, '/' for commands...",
			},
		},
		// Register the AI extension
		extensions: [
			createAIExtension({
				model,
				agentCursor: { name: "AI", color: "#f76f53" },
			}),
		],
		initialContent: content ? content : undefined,
	});

	useEffect(() => {
		setEditor(editor);
	}, [editor, setEditor]);

	const { mutateAsync: onSentPromptMutation } = useMutation({
		mutationFn: (data: EditPredictionData) => {
			return fetch("/api/ai/edit-prediction", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt: data.prompt,
					context: data.context,
				}),
				signal: controllerOnSendPrompt.signal,
			});
		},
		onError: (error) => {
			console.error("Mutation failed:", error);
		},
	});

	const [isTyping, setIsTyping] = useState(false);
	const [debouncedValue, setDebouncedValue] = useState<number | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsTyping(false);
		}, 500);

		return () => clearTimeout(timer);
	}, [debouncedValue]);

	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Enter") {
			return;
		}

		if (event.altKey) {
			return;
		}

		if (event.altKey && (event.key === "a" || event.key === "A")) {
			return;
		}

		setIsTyping(true);
		setDebouncedValue(event.timeStamp);

		if (suggestionTimer) {
			clearTimeout(suggestionTimer);
			setSuggestionTimer(null);
		}
	};

	const onExportPDF = async () => {
		setIsExporting(true);
		// Create the exporter
		const exporter = new PDFExporter(editor.schema, pdfDefaultSchemaMappings);

		// Convert the blocks to a react-pdf document
		const pdfDocument = await exporter.toReactPDFDocument(editor.document);

		// Use react-pdf to write to file:
		// Create blob and download
		const blob = await ReactPDF.pdf(pdfDocument).toBlob();
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${workspaceTitle}-notes.pdf`;
		link.click();
		URL.revokeObjectURL(url);
		setIsExporting(false);
	};

	const onExportToMarkdown = async () => {
		setIsExporting(true);
		const markdown = await editor.blocksToMarkdownLossy(editor.document);

		// Create blob and download
		const blob = new Blob([markdown], { type: "text/markdown" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${workspaceTitle}-notes.md`;
		link.click();
		URL.revokeObjectURL(url);
		setIsExporting(false);
	};

	const onExportToDocx = async () => {
		setIsExporting(true);
		// Create the exporter
		const exporter = new DOCXExporter(editor.schema, docxDefaultSchemaMappings);

		// Convert the blocks to a docxjs document
		const docxDocument = await exporter.toDocxJsDocument(editor.document);

		// Use docx to write to file:
		const buffer = await Packer.toBuffer(docxDocument);

		//  Use docx to write to file:
		// Create blob and download
		const blob = new Blob([buffer], {
			type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${workspaceTitle}-notes.docx`;
		link.click();
		URL.revokeObjectURL(url);
		setIsExporting(false);
	};

	const onInsertContentFromLink = (content: string) => {
		editor.pasteMarkdown(content);
	};

	return (
		<div className="flex flex-col w-full h-full">
			<div className="flex p-2 justify-end items-center">
				<ShareLinkEditor noteId={id} />
				<InsertContentLinkDialog onInsert={onInsertContentFromLink} />
				<DropdownMenu>
					<Tooltip>
						<TooltipTrigger asChild>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									isPending={isExporting}
									disabled={editor.document.length === 0}
								>
									<ArrowUpTrayIcon className="h-5 min-w-5" />
								</Button>
							</DropdownMenuTrigger>
						</TooltipTrigger>
						<TooltipContent>Export options</TooltipContent>
					</Tooltip>
					<DropdownMenuContent
						side="right"
						onCloseAutoFocus={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}
					>
						<DropdownMenuItem
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onExportPDF();
							}}
							disabled={isExporting}
							className="flex gap-2"
						>
							Export to PDF
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onExportToMarkdown();
							}}
							disabled={isExporting}
							className="flex gap-2"
						>
							Export to MD
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								onExportToDocx();
							}}
							disabled={isExporting}
							className="flex gap-2"
						>
							Export to DOCX
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="flex flex-1 w-full h-full overflow-hidden">
				<div
					className="w-full h-full overflow-auto relative"
					onKeyDown={(e) => handleKeyDown(e)}
				>
					{/* <FloatingOverlay /> */}
					{displaySuggestion && (
						<FloatingPortal>
							<div
								className="flex p-4 shadow-md overflow-hidden border border-mocha-mauve bg-mocha-base rounded-md z-10 flex-col gap-4 max-w-xl max-h-96"
								ref={refs.setFloating}
								style={floatingStyles}
							>
								<div className="flex gap-2 flex-1 items-center">
									<div className="p-1 rounded-md">
										<SparklesIcon className="min-w-5 h-5 text-mocha-teal" />
									</div>
									<p className="text-sm text-mocha-text font-semibold">
										AI suggestion
									</p>
								</div>
								<p className="text-sm text-mocha-text overflow-auto">
									{suggestion}
								</p>
								<div className="flex items-center gap-2 text-xs text-mocha-sub-text">
									<p className="text-xs p-1 border rounded-md">Alt</p>+
									<p className="text-xs p-1 border rounded-md">A</p>
									Accept
								</div>
							</div>
						</FloatingPortal>
					)}
					<BlockNoteView
						onChange={async (editor, context) => {
							if (saveTimer) {
								clearTimeout(saveTimer);
							}

							const blockEvents = context.getChanges();

							if (blockEvents.length === 1) {
								const blockEvent = blockEvents[0];

								if (blockEvent && blockEvent.type === "update") {
									const block = blockEvent.block;

									if (
										allowedBlockTypesWithAIPrediction.includes(block.type) &&
										isTyping
									) {
										setDisplaySuggestion(false);

										const content = concatTextContentFromBlock(block);

										const reset = () => {
											setDisplaySuggestion(false);
											setSuggestion("");
											controllerOnKeyDown.abort("Closing suggestion");
											controllerOnClick.abort("Closing suggestion");
											controllerOnSendPrompt.abort(
												"Suggestion closed before displaying",
											);
											if (suggestionTimer) {
												clearTimeout(suggestionTimer);
												setSuggestionTimer(null);
											}
										};

										const handleOnHideTooltip = (event: MouseEvent) => {
											if (
												!refs.floating.current?.contains(event.target as Node)
											) {
												reset();
											}
										};

										const acceptSuggestion = ({
											block,
											event,
											suggestion,
										}: AcceptSuggestionProps) => {
											if (
												event.altKey &&
												(event.key === "a" || event.key === "A")
											) {
												if (Array.isArray(block.content)) {
													editor.updateBlock(block.id, {
														content: [...block.content, suggestion],
													});
												}

												reset();
											}

											if (
												!event.altKey &&
												(event.key === "Enter" || event.key === "Tab")
											) {
												reset();
											}
										};

										if (
											content &&
											content.trim() !== "" &&
											content.trim() !== "/" &&
											content.trim() !== "/a" &&
											content.trim() !== "/ai"
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
													const parsedRes = JSON.parse(
														decodedRes,
													) as PredictionRes;

													return parsedRes.prediction;
												} catch (error) {
													console.error(error);
												}
											};

											document.addEventListener(
												"mousedown",
												handleOnHideTooltip,
												{
													signal: controllerOnClick.signal,
												},
											);

											setSuggestionTimer(
												setTimeout(async () => {
													const signal = controllerOnSendPrompt.signal;

													// Check if cancelled before first async operation
													if (signal.aborted) return;

													const markdown = await editor.blocksToMarkdownLossy(
														editor.document,
													);

													// Check if cancelled before first async operation
													if (signal.aborted) return;

													const res = await onSentPromptMutation({
														prompt: `${block.type}: ${content}`,
														context: markdown,
													});

													// Check if cancelled before first async operation
													if (signal.aborted) return;

													const streamRes = await handleStream(res);

													// Check if cancelled before first async operation
													if (signal.aborted) return;

													if (streamRes) {
														setSuggestion(streamRes);

														const elementBlock = document.querySelector(
															`[data-id="${block.id}"]`,
														);

														refs.setReference(elementBlock);
														setDisplaySuggestion(true);

														document.addEventListener(
															"keydown",
															(e) => {
																acceptSuggestion({
																	event: e,
																	block,
																	suggestion: streamRes,
																});
															},
															{ signal: controllerOnKeyDown.signal },
														);
													}
												}, 500),
											);
										}
									}
								}
							}

							setSaveTimer(
								setTimeout(() => {
									onSave(editor.document);
								}, 1000),
							);
						}}
						theme={{
							fontFamily: "GeistMono",
							colors: {
								...darkDefaultTheme.colors,
								editor: {
									text: "#d1cfc0",
									background: "#1f1f1f",
								},
							},
						}}
						editor={editor}
						// We're disabling some default UI elements
						formattingToolbar={false}
						slashMenu={false}
					>
						{/* Add the AI Command menu to the editor */}
						<AIMenuController />

						{/* We disabled the default formatting toolbar with `formattingToolbar=false`
        and replace it for one with an "AI button" (defined below).
        (See "Formatting Toolbar" in docs)
        */}
						<FormattingToolbarWithAI />

						{/* We disabled the default SlashMenu with `slashMenu=false`
        and replace it for one with an AI option (defined below).
        (See "Suggestion Menus" in docs)
        */}
						<CustomSuggestionMenu editor={editor} />
					</BlockNoteView>
				</div>
			</div>
		</div>
	);
};

// Formatting toolbar with the `AIToolbarButton` added
function FormattingToolbarWithAI() {
	return (
		<FormattingToolbarController
			formattingToolbar={() => (
				<FormattingToolbar>
					{/* Add the AI button */}
					<div className="flex border-mocha-teal border-2 rounded-sm">
						<AIToolbarButton />
					</div>

					{...getFormattingToolbarItems()}
				</FormattingToolbar>
			)}
		/>
	);
}

// Slash menu with the AI option added
function CustomSuggestionMenu(props: {
	editor: BlockNoteEditor<any, any, any>;
}) {
	return (
		<SuggestionMenuController
			triggerCharacter="/"
			getItems={async (query) =>
				filterSuggestionItems(
					[
						...getAISlashMenuItems(props.editor),
						...getDefaultReactSlashMenuItems(props.editor),
						// add the default AI slash menu items, or define your own
					],
					query,
				)
			}
		/>
	);
}
