import { useEffect, useRef, useState } from "react";
import { Separator } from "../ui/separator";
import { ClipboardIcon } from "@heroicons/react/24/outline";
import { Button } from "./Button";
import { Copy } from "lucide-react";

type SelectionToolbarProps = {
	children: React.ReactNode;
	selection: {
		text: string;
		range: Range | null;
	};
	tools: React.ReactNode[];
	setSelection: (selection: { text: string; range: Range | null }) => void;
};

export function SelectionToolbar({
	children,
	tools,
	selection,
	setSelection,
}: SelectionToolbarProps) {
	const toolbarRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [visible, setVisible] = useState(false);

	const contentRef = useRef<HTMLDivElement>(null);

	const onClose = () => {
		setSelection({ text: "", range: null });
	};

	useEffect(() => {
		const handleMouseUp = () => {
			const selection = window.getSelection();

			if (!selection || selection.isCollapsed || !contentRef.current) {
				setSelection({ text: "", range: null });
				return;
			}

			// Check if selection is within our content area
			let node = selection.anchorNode;
			let isWithinContent = false;

			while (node) {
				if (node === contentRef.current) {
					isWithinContent = true;
					break;
				}
				node = node.parentNode;
			}

			if (!isWithinContent) {
				setSelection({ text: "", range: null });
				return;
			}

			const text = selection.toString().trim();

			if (text) {
				setSelection({
					text,
					range: selection.getRangeAt(0),
				});
			} else {
				setSelection({ text: "", range: null });
			}
		};

		// Only listen for mouseup events, not selectionchange
		contentRef.current?.addEventListener("mouseup", handleMouseUp);

		return () => {
			contentRef.current?.removeEventListener("mouseup", handleMouseUp);
		};
	}, []);

	useEffect(() => {
		if (selection.range && toolbarRef.current) {
			const rect = selection.range.getBoundingClientRect();
			const toolbarRect = toolbarRef.current.getBoundingClientRect();

			// Position the toolbar above the selection
			let top = rect.top - toolbarRect.height - 12 + window.scrollY;

			// If there's not enough space above, position it below
			if (top < 10) {
				top = rect.bottom + 12 + window.scrollY;
			}

			// Center the toolbar horizontally relative to the selection
			let left = rect.left + rect.width / 2 - toolbarRect.width / 2;

			// Make sure the toolbar doesn't go off-screen
			if (left < 10) left = 10;
			if (left + toolbarRect.width > window.innerWidth - 10) {
				left = window.innerWidth - toolbarRect.width - 10;
			}

			setPosition({ top, left });

			// Small delay to ensure smooth animation
			setTimeout(() => {
				setVisible(true);
			}, 10);
		}
	}, [selection]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				toolbarRef.current &&
				!toolbarRef.current.contains(event.target as Node)
			) {
				setVisible(false);
				setTimeout(onClose, 200); // Delay to allow animation to complete
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setVisible(false);
				setTimeout(onClose, 200);
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	const handleCopy = () => {
		navigator.clipboard.writeText(selection.text);
		setVisible(false);
		setTimeout(onClose, 200);
	};

	return (
		<div className="w-full h-full flex" ref={contentRef}>
			{selection.range && (
				<div
					ref={toolbarRef}
					className={`fixed z-50 flex rounded-lg shadow-lg transition-all duration-200 ${
						visible
							? "opacity-100 transform translate-y-0"
							: "opacity-0 transform -translate-y-2"
					}`}
					style={{
						top: `${position.top}px`,
						left: `${position.left}px`,
					}}
				>
					{/* Main toolbar */}
					<div className="bg-background border border-border rounded-lg flex items-center p-1.5 gap-1 w-fit h-full">
						{tools.map((tool) => {
							return tool;
						})}
						<Separator
							className="bg-border min-h-8"
							orientation="vertical"
						/>
						<Button
							type="button"
							onClick={handleCopy}
							size="icon"
							variant="ghost"
							className="hover:bg-border"
							title={"Copy"}
						>
							<Copy className="min-w-5 h-5" />
						</Button>
					</div>
				</div>
			)}
			{children}
		</div>
	);
}
