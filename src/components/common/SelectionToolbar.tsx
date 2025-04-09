import type React from "react";

import { useEffect, useRef, useState } from "react";
import { Bold, Italic, Copy, Link, Share2, Trash } from "lucide-react";

interface SelectionToolbarProps {
	selection: {
		text: string;
		range: Range | null;
	};
	onClose: () => void;
}

export function SelectionToolbar({
	selection,
	onClose,
}: SelectionToolbarProps) {
	const toolbarRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [visible, setVisible] = useState(false);

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
	}, [onClose]);

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
	}, [onClose]);

	const handleCopy = () => {
		navigator.clipboard.writeText(selection.text);
		setVisible(false);
		setTimeout(onClose, 200);
	};

	const handleFormat = (format: string) => {
		if (!selection.range) return;

		document.execCommand(format);
		setVisible(false);
		setTimeout(onClose, 200);
	};

	return (
		<div
			ref={toolbarRef}
			className={`fixed z-50 flex items-center rounded-lg shadow-lg transition-all duration-200 ${
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
			<div className="bg-gray-900 rounded-lg flex items-center p-1.5 gap-1">
				<ToolbarButton
					icon={<Bold size={16} />}
					label="Bold"
					onClick={() => handleFormat("bold")}
				/>

				<ToolbarButton
					icon={<Italic size={16} />}
					label="Italic"
					onClick={() => handleFormat("italic")}
				/>

				<div className="w-px h-5 bg-gray-700 mx-1" />

				<ToolbarButton
					icon={<Copy size={16} />}
					label="Copy"
					onClick={handleCopy}
				/>

				<ToolbarButton
					icon={<Link size={16} />}
					label="Link"
					onClick={() => {}}
				/>

				<ToolbarButton
					icon={<Share2 size={16} />}
					label="Share"
					onClick={() => {}}
				/>

				<div className="w-px h-5 bg-gray-700 mx-1" />

				<ToolbarButton
					icon={<Trash size={16} />}
					label="Delete"
					onClick={() => {}}
					className="text-red-400 hover:text-red-300 hover:bg-gray-800"
				/>
			</div>
		</div>
	);
}

interface ToolbarButtonProps {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	className?: string;
}

function ToolbarButton({
	icon,
	label,
	onClick,
	className = "",
}: ToolbarButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center justify-center h-8 w-8 rounded-md text-gray-200 hover:bg-gray-800 hover:text-white transition-colors ${className}`}
			title={label}
		>
			{icon}
			<span className="sr-only">{label}</span>
		</button>
	);
}
