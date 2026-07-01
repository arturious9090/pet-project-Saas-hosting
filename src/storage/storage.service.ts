import { GetObjectAttributesCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileExtension, MimeType } from '@prisma/client';
import { InjectS3, S3 } from 'nestjs-s3';
import { MimeTypeValue } from 'src/common/types/mime-types-value';

@Injectable()
export class StorageService {
    constructor(
        @InjectS3() private readonly s3: S3,
        private readonly config: ConfigService
    ) { }


    async createUploadUrl(key: string, contentType: MimeTypeValue) {
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

    async getFileHead(key: string){
        const command = new HeadObjectCommand({
            Bucket: this.config.get<string>('s3.bucket'),
            Key: key
        })
        try {
            const head = await this.s3.send(command)
            console.log(head)
            return head
        } catch (err) {
            throw new NotFoundException(' File not found ')
        }
    }

    createKey(userId: string, projectId: string, fileId: string, fileExtesion: string) {
        return `users/${userId}/projects/${projectId}/objects/${fileId}.${fileExtesion}`
    }

}
