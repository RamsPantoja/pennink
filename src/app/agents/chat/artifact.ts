import { Document, Packer, Paragraph, TextRun } from "docx";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { tool, type InferUITool } from "ai";
import { z } from "zod";
import { jsPDF } from "jspdf";
import { typeid } from "typeid-js";
import { env } from "~/env";
import { db } from "~/server/db";
import { artifacts } from "~/server/db/schema";

const artifactInputSchema = z.object({
	filename: z
		.string()
		.min(1)
		.max(160)
		.describe("A descriptive filename including the correct extension"),
	format: z.enum(["markdown", "docx", "pdf"]).describe("Output file format"),
	title: z.string().max(200).optional().describe("Document title"),
	content: z
		.string()
		.min(1)
		.max(500_000)
		.describe("The complete content of the classroom artifact"),
});

export type Artifact = {
	id: string;
	filename: string;
	type: string;
	size: number;
	downloadUrl: string;
};

const contentTypes = {
	markdown: "text/markdown; charset=utf-8",
	docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	pdf: "application/pdf",
} as const;

const ensureExtension = (
	filename: string,
	format: keyof typeof contentTypes,
) => {
	const extension = `.${format === "markdown" ? "md" : format}`;
	return filename.toLowerCase().endsWith(extension)
		? filename
		: `${filename.replace(/\.[^/.]+$/, "")}${extension}`;
};

const markdownToDocx = async (content: string, title?: string) => {
	const paragraphs = content.split(/\r?\n/).map((line) => {
		const heading = line.match(/^(#{1,6})\s+(.*)$/);
		if (heading) {
			return new Paragraph({
				text: heading[2],
				heading: `Heading${heading[1]?.length ?? 1}` as
					| "Heading1"
					| "Heading2"
					| "Heading3"
					| "Heading4"
					| "Heading5"
					| "Heading6",
			});
		}

		if (line.startsWith("- ") || line.startsWith("* ")) {
			return new Paragraph({ text: line.slice(2), bullet: { level: 0 } });
		}

		return new Paragraph({ children: [new TextRun(line)] });
	});

	if (title) {
		paragraphs.unshift(new Paragraph({ text: title, heading: "Title" }));
	}

	return Packer.toBuffer(
		new Document({ sections: [{ children: paragraphs }] }),
	);
};

// Keep PDF generation deliberately simple and reliable for printable classroom text.
const markdownToPdf = (content: string, title?: string) => {
	const pdf = new jsPDF({ unit: "pt", format: "letter" });
	const margin = 48;
	const lineHeight = 16;
	const pageWidth = 612 - margin * 2;
	let y = margin;

	const addLine = (line: string, size = 11, bold = false) => {
		pdf.setFont("helvetica", bold ? "bold" : "normal");
		pdf.setFontSize(size);
		const wrapped = pdf.splitTextToSize(line, pageWidth) as string[];
		for (const wrappedLine of wrapped) {
			if (y > 740) {
				pdf.addPage();
				y = margin;
			}
			pdf.text(wrappedLine, margin, y);
			y += lineHeight;
		}
	};

	if (title) {
		addLine(title, 18, true);
		y += 10;
	}

	for (const line of content.split(/\r?\n/)) {
		const heading = line.match(/^#{1,6}\s+(.*)$/);
		addLine(
			heading?.[1] ?? line.replace(/^[-*]\s+/, "• "),
			heading ? 14 : 11,
			!!heading,
		);
	}

	return Buffer.from(pdf.output("arraybuffer"));
};

export const createArtifactTool = ({
	userId,
	workspaceId,
	chatId,
}: {
	userId: string;
	workspaceId?: string;
	chatId?: string;
}) =>
	tool({
		description:
			"Create a permanent downloadable classroom artifact in Markdown, DOCX, or PDF format. Use this for lesson plans, worksheets, quizzes, rubrics, study guides, and other teacher materials.",
		inputSchema: artifactInputSchema,
		execute: async ({ filename, format, title, content }) => {
			const output =
				format === "markdown"
					? Buffer.from(content, "utf8")
					: format === "docx"
						? await markdownToDocx(content, title)
						: markdownToPdf(content, title);
			const id = typeid().toUUID();
			const key = `artifacts/${userId}/${id}/${ensureExtension(filename, format)}`;
			const s3 = new S3Client({
				region: "auto",
				endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
				credentials: {
					accessKeyId: env.CF_PUBLIC_R2_KEY,
					secretAccessKey: env.CF_SECRET_R2_KEY,
				},
			});

			await s3.send(
				new PutObjectCommand({
					Bucket: env.BUCKET,
					Key: key,
					Body: output,
					ContentType: contentTypes[format],
					ContentDisposition: `attachment; filename="${ensureExtension(filename, format)}"`,
				}),
			);

			await db.insert(artifacts).values({
				id,
				filename: ensureExtension(filename, format),
				type: contentTypes[format],
				key,
				bucket: env.BUCKET,
				size: output.byteLength,
				userId,
				workspaceId,
				chatId,
			});

			return {
				artifact: {
					id,
					filename: ensureExtension(filename, format),
					type: contentTypes[format],
					size: output.byteLength,
					downloadUrl: `/api/artifacts/${id}/download`,
				},
			};
		},
	});

export type CreateArtifactTool = InferUITool<
	ReturnType<typeof createArtifactTool>
>;
