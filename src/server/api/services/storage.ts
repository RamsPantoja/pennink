import type { TRPCContext } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
	DeleteObjectsCommand,
	type DeletedObject,
	type ObjectIdentifier,
	PutObjectCommand,
	S3Client,
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "~/env";
import type { z } from "zod";
import type { createPresignedUrlInputSchema } from "../schemas/storage";

type StorageServiceParams = {
	ctx: TRPCContext;
};

type CreatePresignedUrlInputSchema = z.infer<
	typeof createPresignedUrlInputSchema
>;

export class StorageService {
	ctx: TRPCContext;
	s3: S3Client;

	constructor({ ctx }: StorageServiceParams) {
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

	public async createPresignedUrl({
		key,
		command,
	}: CreatePresignedUrlInputSchema) {
		try {
			if (!key || !command) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Invalid input",
				});
			}

			switch (command) {
				case "PUT": {
					const command = new PutObjectCommand({
						Bucket: env.BUCKET,
						Key: key,
					});

					const signedUrl = await getSignedUrl(this.s3, command, {
						expiresIn: 30,
					});

					return {
						signedUrl,
						key,
					};
				}
				case "GET": {
					const command = new GetObjectCommand({
						Bucket: env.BUCKET,
						Key: key,
					});

					const signedUrl = await getSignedUrl(this.s3, command, {
						expiresIn: 30,
					});

					return {
						signedUrl,
						key,
					};
				}
				default:
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid command",
					});
			}
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Something went wrong on generating the presigned URL",
			});
		}
	}

	public async deleteFromBucket(
		objects: ObjectIdentifier[],
	): Promise<DeletedObject[] | undefined> {
		const command = new DeleteObjectsCommand({
			Bucket: "",
			Delete: {
				Objects: objects,
			},
		});

		try {
			const { Deleted } = await this.s3.send(command);
			return Deleted;
		} catch (error) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Something went wrong on deleting the objects",
			});
		}
	}
}
