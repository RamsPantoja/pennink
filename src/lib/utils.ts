import { env } from "~/env";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import { DateTime, type Duration } from "luxon";
import markdownit from "markdown-it";
import digitalMarkdownPlugin from "@digitalocean/do-markdownit";
import type { MessageRole } from "./enum";
import type { ReactNode } from "react";
import { tool } from "ai";
import { jsonSchemaToZod } from "json-schema-to-zod";
import type { Session } from "next-auth";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

interface ExpiryOptions {
	timezone?: string;
}

interface ExpiryResult {
	isExpired: boolean;
	remainingTime?: Duration;
	error?: string;
}

type MapSkeletonsProps = {
	numberOfSkeletons: number;
	skeleton: ReactNode;
};

export const mapSkeletons = ({
	numberOfSkeletons,
	skeleton,
}: MapSkeletonsProps) => {
	const skeletons: ReactNode[] = [];

	for (let index = 0; index < numberOfSkeletons; index++) {
		skeletons.push(skeleton);
	}

	return skeletons;
};

export const getPublicBaseUrl = () => {
	if (env.NEXT_PUBLIC_BASE_URL) return env.NEXT_PUBLIC_BASE_URL;
	return `http://localhost:${process.env.PORT ?? 3000}`;
};

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
type Literal = z.infer<typeof literalSchema>;
type Json = Literal | { [key: string]: Json } | Json[];

export const jsonSchema: z.ZodType<Json> = z.lazy(() =>
	z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)]),
);

type Operation = "add" | "subtract";

export const operateHours = (
	time1: string,
	time2: string,
	operation: Operation,
): string => {
	const [hours1, minutes1] = time1.split(":").map(Number);
	const [hours2, minutes2] = time2.split(":").map(Number);

	if (
		hours1 !== undefined &&
		minutes1 !== undefined &&
		hours2 !== undefined &&
		minutes2 !== undefined
	) {
		const totalMinutes1 = hours1 * 60 + minutes1;
		const totalMinutes2 = hours2 * 60 + minutes2;

		let resultMinutes: number;

		if (operation === "add") {
			resultMinutes = totalMinutes1 + totalMinutes2;
		} else if (operation === "subtract") {
			resultMinutes = totalMinutes1 - totalMinutes2;
		} else {
			throw new Error("Invalid operation. Use 'add' or 'subtract'.");
		}

		if (resultMinutes < 0) {
			resultMinutes = (24 * 60 + resultMinutes) % (24 * 60);
		} else {
			resultMinutes = resultMinutes % (24 * 60);
		}

		const resultHours = Math.floor(resultMinutes / 60);
		const resultRemainingMinutes = resultMinutes % 60;

		const formattedHours = String(resultHours).padStart(2, "0");
		const formattedMinutes = String(resultRemainingMinutes).padStart(2, "0");

		return `${formattedHours}:${formattedMinutes}`;
	}

	return "00:00";
};

export const compareHours = (time1: string, time2: string): number | null => {
	// returns  -1 if the first time is earlier than the second time,
	// 1 if the first time is later than the second time,
	// 0 if both times are equal.

	const [hours1, minutes1] = time1.split(":").map(Number);
	const [hours2, minutes2] = time2.split(":").map(Number);

	if (
		hours1 !== undefined &&
		minutes1 !== undefined &&
		hours2 !== undefined &&
		minutes2 !== undefined
	) {
		if (hours1 < hours2 || (hours1 === hours2 && minutes1 < minutes2)) {
			return -1;
		} else if (hours1 > hours2 || (hours1 === hours2 && minutes1 > minutes2)) {
			return 1;
		} else {
			return 0;
		}
	} else {
		return null;
	}
};

export const shiftTimeInterval = (
	startTime: number,
	endTime: number,
	hours: number,
): { newStartTime: number; newEndTime: number } => {
	// Shift the start and end times
	let newStartTime = (startTime + hours) % 24;
	let newEndTime = (endTime + hours) % 24;

	// Handle negative times
	if (newStartTime < 0) newStartTime += 24;
	if (newEndTime < 0) newEndTime += 24;

	// Return the new start and end times as numbers
	return { newStartTime, newEndTime };
};

export const convertTo12HourFormat = (hour: number | string): string => {
	/**
	 * Convert 24-hour time to 12-hour format
	 * @param time24 Time in 24-hour format (HH:mm string or HH number)
	 * @returns Formatted 12-hour time
	 */

	if (typeof hour === "number") {
		const period = hour < 12 || hour === 24 ? "AM" : "PM";
		const adjustedHour = hour % 12 || 12;
		return `${adjustedHour}:00 ${period}`;
	}

	const [hoursStr, minutes] = hour.split(":");
	const hours = Number.parseInt(hoursStr!, 10);

	if (Number.isNaN(hours) || hours < 0 || hours > 23) {
		throw new Error("Invalid hours");
	}

	// Determine period (AM/PM)
	const period = hours >= 12 ? "PM" : "AM";

	// Convert hours to 12-hour format
	const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

	// Format the time string
	const timeComponents = [hours12.toString(), minutes].filter(Boolean); // Remove undefined values

	return `${timeComponents.join(":")} ${period}`;
};

export const convert24HourNumberToHHMMFormat = (hour: number): string => {
	const formattedHour = String(hour).padStart(2, "0");
	return `${formattedHour}:00`;
};

export const isExpiredDateAndTime = (
	expiryDateTime: DateTime,
	options?: ExpiryOptions,
): ExpiryResult => {
	try {
		// Convert string to DateTime if necessary
		const expiryDate = expiryDateTime.setZone(options?.timezone);

		// Get current time in the specified timezone
		const currentDate = DateTime.now().setZone(options?.timezone);

		// Calculate remaining time
		const remainingTime = expiryDate.diff(currentDate, "seconds");

		// Compare without milliseconds
		return {
			isExpired: remainingTime.seconds <= 0,
			remainingTime,
		};
	} catch (error) {
		return {
			isExpired: false,
			error: error instanceof Error ? error.message : "Unknown error occurred",
		};
	}
};

export const isoDateFromDateAndTime = (date: Date, time: string) => {
	const [hours, minutes] = time.split(":").map(Number);

	const luxonTime = DateTime.fromJSDate(date);

	const isoDate = DateTime.fromObject({
		year: luxonTime.year,
		month: luxonTime.month,
		day: luxonTime.day,
		hour: hours,
		minute: minutes,
		second: 0,
	});

	return isoDate;
};

export const markdownToHtml = (markdown: string) => {
	const mdit = markdownit();
	const htmlString = mdit.use(digitalMarkdownPlugin).render(markdown);
	return htmlString;
};

type Role = "assistant" | "user" | "system";

const toolParameters = {
	"create-made-in-project": z.object({
		projectName: z.string(),
		category: z.string(),
		productType: z.string().optional(),
		startDate: z.string(),
		limitDate: z.string().optional(),
		currency: z.string(),
		baseBudget: z.number(),
		limitBudget: z.number().optional(),
		startAmount: z.number().int(),
		maxAmount: z.number().int().optional(),
	}),
};

export const messageRoleVercelSDK: Record<MessageRole, Role> = {
	AGENT: "assistant",
	USER: "user",
	SYSTEM: "system",
};

// export const convertToolsArrayToObject = (tools: any) => {
// 	if (tools) {
// 		const objectTools = tools.reduce((acc, item) => {
// 			if (!item.name) {
// 				throw new Error("Invalid tool: missing name property");
// 			}

// 			acc[item.name] = tool({
// 				description: item.description ?? "",
// 				parameters: toolParameters[item.name],
// 			});

// 			return acc;
// 		}, {});

// 		return objectTools;
// 	}

// 	return undefined;
// };

type ValidateFileSizeParams = {
	file: File;
	maxSizeMB: number;
};

export const validateFileSize = ({
	file,
	maxSizeMB,
}: ValidateFileSizeParams) => {
	// Convert MB to bytes (1 MB = 1,048,576 bytes)
	const maxSizeInBytes = maxSizeMB * 1024 * 1024;

	// Check if file exists and size is within limit
	if (file && file.size > maxSizeInBytes) {
		return {
			isValid: false,
			message: `File size exceeds ${maxSizeMB}MB limit`,
		};
	}

	return {
		isValid: true,
		message: "File size is valid",
	};
};

type FileSizeRuleParams = {
	session: Session;
	file: File;
};

export const fileSizeRule = ({ session, file }: FileSizeRuleParams) => {
	switch (session.user.subscription) {
		case "PRO": {
			const res = validateFileSize({ file, maxSizeMB: 50 });
			if (!res.isValid) {
				toast("You can not upload files up to 5OMB of size");
			}
			return res;
		}
		case "FREE": {
			const res = validateFileSize({ file, maxSizeMB: 6 });
			if (!res.isValid) {
				toast(
					"You need to upgrade to Pennink Pro to upload files up to 6MB of size",
				);
			}
			return res;
		}
		default: {
			const res = validateFileSize({ file, maxSizeMB: 6 });
			if (!res.isValid) {
				toast(
					"You need to upgrade to Pennink Pro to upload files up to 6MB of size",
				);
			}
			return res;
		}
	}
};
