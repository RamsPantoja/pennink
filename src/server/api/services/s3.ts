import type { TRPCContext } from "../trpc";
import { TRPCError } from "@trpc/server";
import {
	S3Client,
	ListBucketsCommand,
	ListObjectsV2Command,
	GetObjectCommand,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "~/env";

type S3Constructor = {
	ctx: TRPCContext;
};

export class S3Service {
	ctx: TRPCContext;
	s3: S3Client;

	constructor({ ctx }: S3Constructor) {
		this.ctx = ctx;
		this.s3 = new S3Client({
			region: "auto",
			endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId: env.CF_PUBLIC_R2_KEY,
				secretAccessKey: env.CF_SECRET_R2_KEY,
			},
		});
	}

	public async generatePresignedUrl(id: string) {}
}
