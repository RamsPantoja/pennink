import type React from "react";
import { useState, useRef, useEffect } from "react";
import { FileIcon, UploadIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
import { Button } from "./common/Button";
import { Input } from "./ui/input";
import {
	ArrowUpTrayIcon,
	DocumentIcon,
	EyeIcon,
	SparklesIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Loading } from "./common/Loading";

type PDFUploaderProps = {
	onUpload: (file: File) => Promise<void>;
	isPending: boolean;
};

export default function PDFUploader({ onUpload, isPending }: PDFUploaderProps) {
	const [file, setFile] = useState<File | null>(null);
	const [progress, setProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [showPreview, setShowPreview] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);

	useEffect(() => {
		if (file) {
			// Create a URL for the file preview
			const url = URL.createObjectURL(file);
			setPreviewUrl(url);

			// Clean up the URL when component unmounts or file changes
			return () => {
				URL.revokeObjectURL(url);
				setPreviewUrl(null);
				setShowPreview(false);
			};
		}
	}, [file]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];

		if (!selectedFile) return;

		if (selectedFile.type !== "application/pdf") {
			toast("Invalid file type");
			return;
		}

		setFile(selectedFile);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();

		const droppedFile = e.dataTransfer.files?.[0];

		if (!droppedFile) return;

		if (droppedFile.type !== "application/pdf") {
			toast("Invalid file type");
			return;
		}

		setFile(droppedFile);
	};

	const clearFile = () => {
		setFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<Card className="w-full max-w-md flex flex-col p-0">
			<CardContent className="flex flex-col gap-4 p-0">
				<div
					className={`border-2 border-dashed rounded-lg p-6 text-center ${
						file ? "border-border" : "border-muted-foreground/25"
					}`}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
				>
					{!file ? (
						<div className="space-y-4">
							<div className="flex justify-center">
								<ArrowUpTrayIcon className="h-10 w-10 text-muted-foreground" />
							</div>
							<div>
								<p className="text-sm font-medium">
									Drag and drop your PDF here or click to browse
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									Only PDF files are accepted
								</p>
							</div>
							<Button
								variant="secondary"
								onClick={() => fileInputRef.current?.click()}
								className="mt-2"
							>
								Browse Files
							</Button>
							<Input
								ref={fileInputRef}
								type="file"
								accept="application/pdf"
								className="hidden"
								onChange={handleFileChange}
								data-testid="file-input"
							/>
						</div>
					) : (
						<div className="space-y-4">
							<div className="flex items-center justify-between gap-2">
								<DocumentIcon className="h-8 w-8" />
								<div className="text-left">
									<p className="text-sm font-semibold text-border truncate max-w-[200px]">
										{file.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{(file.size / 1024 / 1024).toFixed(2)} MB
									</p>
								</div>
								<Tooltip>
									<TooltipTrigger>
										<Button
											variant="ghost"
											size="icon"
											className="ml-auto"
											onClick={clearFile}
											disabled={isPending}
										>
											<XMarkIcon className="h-5 min-w-5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Remove file</TooltipContent>
								</Tooltip>
							</div>
							{previewUrl && (
								<div className="mt-4 border rounded-lg overflow-hidden h-[400px] bg-background">
									<iframe
										src={previewUrl}
										className="w-full h-full"
										title={`Preview of ${file?.name}`}
									/>
								</div>
							)}
							{isPending && <Loading />}
						</div>
					)}
				</div>
				<Button
					className="w-full"
					disabled={!file || isPending}
					onClick={() => {
						if (!file) {
							toast("Please select a file");
							return;
						}

						onUpload(file);
					}}
					isPending={isPending}
					endIcon={<SparklesIcon className="min-w-5 h-5" />}
				>
					Upload and Ask
				</Button>
			</CardContent>
		</Card>
	);
}
