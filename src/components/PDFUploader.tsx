import type React from "react";
import { useState, useRef } from "react";
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
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function PDFUploader() {
	const [file, setFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [progress, setProgress] = useState(0);
	const fileInputRef = useRef<HTMLInputElement>(null);

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

	const handleUpload = async () => {
		if (!file) return;

		setUploading(true);

		// Simulate upload progress
		const interval = setInterval(() => {
			setProgress((prev) => {
				if (prev >= 100) {
					clearInterval(interval);
					return 100;
				}
				return prev + 10;
			});
		}, 300);

		try {
			// This is where you would implement your actual file upload logic
			// For example, using FormData to send to your API endpoint

			// Simulating API call
			await new Promise((resolve) => setTimeout(resolve, 3000));

			toast.success("Upload successful");
		} catch (error) {
			toast.error("Upload failed");
		} finally {
			clearInterval(interval);
			setUploading(false);
			setProgress(0);
		}
	};

	const clearFile = () => {
		setFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<Card className="w-full max-w-md flex flex-col">
			<CardContent>
				<div
					className={`border-2 border-dashed rounded-lg p-6 text-center ${
						file
							? "border-mochaTeal bg-mochaCrust"
							: "border-muted-foreground/25"
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
									<p className="text-sm font-medium truncate max-w-[200px]">
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
											disabled={uploading}
										>
											<XMarkIcon className="h-5 min-w-5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Remove file</TooltipContent>
								</Tooltip>
							</div>
							{uploading && (
								<div className="space-y-2">
									{/* <Progress value={progress} className="h-2" /> */}
									<p className="text-xs text-center text-muted-foreground">
										Uploading... {progress}%
									</p>
								</div>
							)}
						</div>
					)}
				</div>
			</CardContent>
			<CardFooter>
				<Button
					className="w-full"
					disabled={!file || uploading}
					onClick={handleUpload}
				>
					{uploading ? "Uploading..." : "Read PDF"}
				</Button>
			</CardFooter>
		</Card>
	);
}
