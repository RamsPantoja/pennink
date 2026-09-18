import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { artifacts } from "~/server/db/schema";
import { env } from "~/env";
import { and, eq } from "drizzle-orm";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getServerAuthSession();
	if (!session?.user) {
		return new Response("Unauthorized", { status: 401 });
	}

	const { id } = await params;
	const artifact = await db.query.artifacts.findFirst({
		where: (table) => and(eq(table.id, id), eq(table.userId, session.user.id)),
	});

	if (!artifact) {
		return new Response("Artifact not found", { status: 404 });
	}

	const s3 = new S3Client({
		region: "auto",
		endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: env.CF_PUBLIC_R2_KEY,
			secretAccessKey: env.CF_SECRET_R2_KEY,
		},
	});
	const url = await getSignedUrl(
		s3,
		new GetObjectCommand({
			Bucket: artifact.bucket,
			Key: artifact.key,
			ResponseContentDisposition: `attachment; filename="${artifact.filename}"`,
			ResponseContentType: artifact.type,
		}),
		{ expiresIn: 300 },
	);

	return Response.redirect(url);
}
