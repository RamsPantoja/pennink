"use client";

import type React from "react";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "./Button";
import { cn } from "~/lib/utils";
import {
	MagnifyingGlassMinusIcon,
	ArrowPathIcon,
	MagnifyingGlassPlusIcon,
} from "@heroicons/react/24/outline";

interface ZoomableDivProps {
	className?: string;
	contentClassName?: string;
	children: React.ReactNode;
	minZoom?: number;
	maxZoom?: number;
	zoomStep?: number;
	initialZoom?: number;
}

export function ZoomableDiv({
	className,
	contentClassName,
	children,
	minZoom = 0.5,
	maxZoom = 3,
	zoomStep = 0.1,
	initialZoom = 1,
}: ZoomableDivProps) {
	const t = useTranslations("ZoomableDiv");
	const [zoom, setZoom] = useState(initialZoom);

	const handleZoomIn = () => {
		setZoom((prevZoom) => Math.min(prevZoom + zoomStep, maxZoom));
	};

	const handleZoomOut = () => {
		setZoom((prevZoom) => Math.max(prevZoom - zoomStep, minZoom));
	};

	const handleReset = () => {
		setZoom(initialZoom);
	};

	return (
		<div className={cn("flex flex-col gap-4", className)}>
			<div className="flex items-center gap-2 justify-end">
				<div className="text-sm font-medium">{Math.round(zoom * 100)}%</div>
				<Button
					variant="outline"
					size="icon"
					onClick={handleZoomOut}
					disabled={zoom <= minZoom}
					aria-label={t("zoomOut")}
				>
					<MagnifyingGlassMinusIcon className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					onClick={handleReset}
					disabled={zoom === initialZoom}
					aria-label={t("resetZoom")}
				>
					<ArrowPathIcon className="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					onClick={handleZoomIn}
					disabled={zoom >= maxZoom}
					aria-label={t("zoomIn")}
				>
					<MagnifyingGlassPlusIcon className="h-4 w-4" />
				</Button>
			</div>
			<div className="overflow-auto border rounded-lg p-4 relative">
				<div
					className={cn(
						"transform origin-top-left transition-transform",
						contentClassName,
					)}
					style={{ transform: `scale(${zoom})` }}
				>
					{children}
				</div>
			</div>
		</div>
	);
}
