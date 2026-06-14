import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MimeType } from '@prisma/client';
import { InjectS3, S3 } from 'nestjs-s3';

@Injectable()
export class StorageService {
    constructor(
        @InjectS3() private readonly s3: S3,
        private readonly config: ConfigService
    ) { }


    async createUploadUrl(key: string, contentType: MimeType, size: number) {
        const command = new PutObjectCommand({
            Bucket: this.config.get<string>('s3.bucket'),
            Key: key,
            ContentType: contentType,

            /**
             * Можно добавить metadata.
             * Она потом будет видна через HeadObject.
             */
            Metadata: {
                uploadedBy: 'user',
            },
        });
        const expiresIn = 60 * 15
        const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn });

        return {
            uploadUrl,
            method: 'PUT' as const,
            key: key,
            headers: {
                'Content-Type': contentType,
            },
            expiresIn
        };
    }

    createKey(userId: string, projectId: string, fileId: string) {
        return `${userId}/projects/${projectId}/objects/${fileId}`
    }

}
