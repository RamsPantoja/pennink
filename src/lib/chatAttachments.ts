export const CHAT_ATTACHMENT_PREFIX = "chat-attachments";
export const CHAT_ATTACHMENT_MAX_FILES = 5;
export const CHAT_ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024;

export const CHAT_ATTACHMENT_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif",
	"application/pdf",
] as const;

export const CHAT_ATTACHMENT_ACCEPT = CHAT_ATTACHMENT_TYPES.join(",");

export type ChatAttachment = {
	key: string;
	filename: string;
	mediaType: string;
	size: number;
};

export const isAllowedChatAttachmentType = (mediaType: string) =>
	(CHAT_ATTACHMENT_TYPES as readonly string[]).includes(mediaType);

export const getChatAttachments = (metadata: unknown): ChatAttachment[] => {
	if (
		!metadata ||
		typeof metadata !== "object" ||
		!("attachments" in metadata) ||
		!Array.isArray(metadata.attachments)
	) {
		return [];
	}

	return metadata.attachments as ChatAttachment[];
};
