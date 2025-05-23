import { useCallback, useEffect, useRef, useState } from "react";
import { pdfjs, Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import type { PDFDocumentProxy } from "pdfjs-dist";
// @ts-expect-error TS(7053): No type definitions for the following module.
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs";
import { Card } from "../ui/card";
import { Button } from "./Button";
import {
	ArrowLongLeftIcon,
	ArrowLongRightIcon,
	MagnifyingGlassPlusIcon,
	MagnifyingGlassMinusIcon,
	ArrowPathIcon,
	MagnifyingGlassIcon,
	XMarkIcon,
	ChevronUpIcon,
	ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Loading } from "./Loading";
import { ZoomableDiv } from "./ZoomableDiv";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Virtuoso } from "react-virtuoso";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	workerSrc,
	import.meta.url,
).toString();

const options = {
	cMapUrl: "/cmaps/",
	standardFontDataUrl: "/standard_fonts/",
};

const resizeObserverOptions = {};

const maxWidth = 800;

type PDFFile = string | File | null;

type DynamicPDFViewerProps = {
	src: PDFFile;
};

export default function PDFViewer({ src }: DynamicPDFViewerProps) {
	const [pageNumbers, setPageNumbers] = useState<number[]>([]);
	const [numPages, setNumPages] = useState<number>();
	const [containerWidth, setContainerWidth] = useState<number>();
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [zoom, setZoom] = useState<number>(1);
	const [searchTerm, setSearchTerm] = useState("");
	const [caseSensitive, setCaseSensitive] = useState(false);
	const [matches, setMatches] = useState<number[]>([]);
	const [currentMatch, setCurrentMatch] = useState(-1);
	const contentRef = useRef<HTMLDivElement>(null);
	const originalContent = useRef<string>("");

	const onResize = useCallback<ResizeObserverCallback>((entries) => {
		const [entry] = entries;

		if (entry) {
			setContainerWidth(entry.contentRect.width);
		}
	}, []);

	// useResizeObserver(containerRef, resizeObserverOptions, onResize);
	//

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const pageId = entry.target.id;
						const pageNumberString = pageId.split("_")[1];

						if (pageNumberString) {
							const pageNumber = Number.parseInt(pageNumberString);
							setPageNumber(pageNumber);
						}
					}
				}
			},
			{
				root: null,
				rootMargin: "0px",
				threshold: 0.2, // Adjust threshold as needed
			},
		);

		for (const pageNumber of pageNumbers) {
			const pageElement = document.getElementById(`page_${pageNumber + 1}`);

			if (pageElement) {
				observer.observe(pageElement);
			}
		}

		return () => {
			observer.disconnect();
		};
	}, [pageNumbers]);

	const onZoomIn = () => {
		setZoom((previous) => Number.parseFloat((previous + 0.1).toFixed(1)));
	};

	const onZoomOut = () => {
		if (zoom > 0.1) {
			setZoom((previous) => Number.parseFloat((previous - 0.1).toFixed(1)));
		}
	};

	const onDocumentLoadSuccess = ({ numPages }: PDFDocumentProxy) => {
		const pageNumberList = Array.from({ length: numPages }, (_, i) => i);

		setPageNumbers(pageNumberList);
		setNumPages(numPages);
	};

	const performSearch = () => {
		if (!searchTerm || !contentRef.current) {
			resetSearch();
			return;
		}

		// Reset to original content before searching
		// contentRef.current.innerHTML = originalContent.current;

		const content = contentRef.current;
		const text = content.textContent || "";
		const searchRegex = new RegExp(
			escapeRegExp(searchTerm),
			caseSensitive ? "g" : "gi",
		);

		// Find all matches
		const allMatches: number[] = [];
		let match;
		while ((match = searchRegex.exec(text)) !== null) {
			allMatches.push(match.index);
		}

		setMatches(allMatches);
		setCurrentMatch(allMatches.length > 0 ? 0 : -1);

		// Highlight matches
		highlightMatches(content, searchTerm, caseSensitive, allMatches[0]);
	};

	const escapeRegExp = (string: string) => {
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	};

	const highlightMatches = (
		element: HTMLElement,
		term: string,
		caseSensitive: boolean,
		currentIndex = -1,
	) => {
		const highlightText = (
			node: Node,
			term: string,
			caseSensitive: boolean,
			currentIndex: number,
		) => {
			if (node.nodeType === 3) {
				// Text node
				const text = node.nodeValue || "";
				const searchRegex = new RegExp(
					escapeRegExp(term),
					caseSensitive ? "g" : "gi",
				);

				// @ts-expect-error TS(7053): No type definitions for the following module.
				let match;
				let lastIndex = 0;
				const result = document.createDocumentFragment();
				let currentPosition = 0;

				while ((match = searchRegex.exec(text)) !== null) {
					// Add text before the match
					if (match.index > lastIndex) {
						result.appendChild(
							document.createTextNode(text.substring(lastIndex, match.index)),
						);
					}

					// Create highlighted span for the match
					const highlightSpan = document.createElement("span");
					highlightSpan.className =
						currentPosition === currentIndex
							? "bg-mochaTeal text-black rounded current-match"
							: "bg-black text-white rounded";
					highlightSpan.appendChild(document.createTextNode(match[0]));
					result.appendChild(highlightSpan);

					lastIndex = match.index + match[0].length;
					// @ts-expect-error TS(7053): No type definitions for the following module.
					currentPosition = matches.findIndex((pos) => pos === match.index);
				}

				// Add remaining text
				if (lastIndex < text.length) {
					result.appendChild(
						document.createTextNode(text.substring(lastIndex)),
					);
				}

				if (lastIndex > 0) {
					node.parentNode?.replaceChild(result, node);
					return true;
				}
			} else if (node.nodeType === 1) {
				// Element node
				// Skip script and style elements
				if (
					node.nodeName === "SCRIPT" ||
					node.nodeName === "STYLE" ||
					(node.nodeName === "SPAN" &&
						(node as HTMLElement).classList.contains("bg-yellow-200"))
				) {
					return false;
				}

				// Process child nodes
				const childNodes = Array.from(node.childNodes);
				for (const child of childNodes) {
					highlightText(child, term, caseSensitive, currentIndex);
				}
			}

			return false;
		};

		highlightText(element, term, caseSensitive, currentIndex);
	};

	const navigateToMatch = (direction: "next" | "prev") => {
		if (matches.length === 0) return;

		let newIndex;
		if (direction === "next") {
			newIndex = currentMatch < matches.length - 1 ? currentMatch + 1 : 0;
		} else {
			newIndex = currentMatch > 0 ? currentMatch - 1 : matches.length - 1;
		}

		setCurrentMatch(newIndex);

		// Rehighlight with new current match
		if (contentRef.current) {
			// contentRef.current.innerHTML = originalContent.current;
			highlightMatches(contentRef.current, searchTerm, caseSensitive, newIndex);

			// Scroll to the current match
			const currentElement = contentRef.current.querySelector(".current-match");
			if (currentElement) {
				currentElement.scrollIntoView({ behavior: "smooth", block: "center" });
			}
		}
	};

	const resetSearch = () => {
		if (contentRef.current) {
			// contentRef.current.innerHTML = originalContent.current;
		}
		setMatches([]);
		setCurrentMatch(-1);
	};

	return (
		<div className="flex w-full h-full flex-col bg-transparent">
			<div className="flex gap-4 p-4 justify-around">
				{/* <div className="flex flex-col gap-2">
					<div className="flex items-center gap-2 relative">
						<Input
							type="text"
							placeholder="Search for text..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && performSearch()}
							className="pr-10"
						/>
						<Button variant="ghost" size="icon" onClick={performSearch}>
							<MagnifyingGlassIcon className="min-w-5 h-5" />
						</Button>
						{searchTerm && (
							<Button
								className="absolute right-11"
								variant="ghost"
								size="icon"
								onClick={() => {
									setSearchTerm("");
									resetSearch();
								}}
							>
								<XMarkIcon className="min-w-5 h-5" />
							</Button>
						)}
					</div>
					<div className="flex items-center justify-between gap-2">
						{matches.length > 0 && (
							<div className="flex items-center gap-2">
								<span className="text-sm">
									{currentMatch + 1} of {matches.length} matches
								</span>
								<Button
									variant="secondary"
									size="icon"
									onClick={() => navigateToMatch("prev")}
									disabled={matches.length === 0}
								>
									<ChevronUpIcon className="min-w-4 h-4" />
								</Button>
								<Button
									variant="secondary"
									size="icon"
									onClick={() => navigateToMatch("next")}
									disabled={matches.length === 0}
								>
									<ChevronDownIcon className="min-w-4 h-4" />
								</Button>
							</div>
						)}
						<div className="flex items-center space-x-2">
							<Switch
								id="case-sensitive"
								checked={caseSensitive}
								onCheckedChange={setCaseSensitive}
							/>
							<Label htmlFor="case-sensitive">Case sensitive</Label>
						</div>
					</div>
				</div> */}
				<div className="flex items-center gap-2 h-fit">
					<span className="text-xs font-bold">{(zoom * 100).toFixed(0)}%</span>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								disabled={zoom <= 0.1}
								onClick={onZoomOut}
								variant="secondary"
								size="icon"
							>
								<MagnifyingGlassMinusIcon className="min-w-5 h-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Zoom out</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								disabled={zoom === 1}
								onClick={() => setZoom(1)}
								variant="secondary"
								size="icon"
							>
								<ArrowPathIcon className="min-w-5 h-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Reset zoom</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								disabled={zoom >= 2}
								onClick={onZoomIn}
								variant="secondary"
								size="icon"
							>
								<MagnifyingGlassPlusIcon className="min-w-5 h-5" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Zoom in</TooltipContent>
					</Tooltip>
				</div>
			</div>
			<Card className="flex flex-1 overflow-hidden pt-0 pb-0 rounded-none bg-transparent">
				<Document
					file={src}
					onLoadSuccess={onDocumentLoadSuccess}
					options={options}
					loading={<Loading />}
					inputRef={contentRef}
					className="w-full h-full overflow-auto flex flex-col"
				>
					<Virtuoso
						style={{ height: "100%" }}
						totalCount={numPages}
						itemContent={(index) => {
							return (
								<div
									key={`page_${index + 1}`}
									id={`page_${index + 1}`}
									className="flex justify-center min-w-fit p-2"
								>
									<Card className="border flex flex-col">
										<span className="text-xs font-bold">Page {index + 1}</span>
										<Page
											pageNumber={index + 1}
											loading={<Loading />}
											scale={zoom}
										/>
									</Card>
								</div>
							);
						}}
					/>
				</Document>
			</Card>
			{/* <div className="p-4">
				{numPages && (
					<p className="text-xs">
						Page {pageNumber} of {numPages}
					</p>
				)}
			</div> */}
		</div>
	);
}
