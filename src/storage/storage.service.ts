import {
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { File } from '@prisma/client';
import { InjectS3, S3 } from 'nestjs-s3';
import { MimeTypeValue } from 'src/common/types/mime-types-value';

@Injectable()
export class StorageService {
  private readonly s3Public: S3Client;

  constructor(
    @InjectS3() private readonly s3: S3,
    private readonly config: ConfigService,
  ) {
    this.s3Public = new S3Client({
      region: config.get<string>('s3.region'),
      endpoint: config.get<string>('s3.publicEndpoint'),
      credentials: {
        accessKeyId: config.getOrThrow<string>('s3.keyId'),
        secretAccessKey: config.getOrThrow<string>('s3.secretKey'),
      },
      forcePathStyle: true,
    });
  }

  async createUploadUrl(key: string, contentType: MimeTypeValue) {
    const command = new PutObjectCommand({
      Bucket: this.config.get<string>('s3.bucket'),
      Key: key,
      ContentType: contentType,
      Metadata: {
        uploadedBy: 'user',
      },
    });
    const expiresIn = 60 * 15;

    const uploadUrl = await getSignedUrl(this.s3Public, command, {
      expiresIn,
    });

    return {
      uploadUrl,
      method: 'PUT' as const,
      key: key,
      headers: {
        'Content-Type': contentType,
      },
      expiresIn,
    };
  }

  async getFileHead(key: string) {
    const command = new HeadObjectCommand({
      Bucket: this.config.get<string>('s3.bucket'),
      Key: key,
    });
    try {
      const head = await this.s3.send(command);
      console.log(head);
      return head;
    } catch (err) {
      throw new NotFoundException(' File not found ');
    }
  }

  async getFileStream(key: string): Promise<GetObjectCommandOutput> {
    const command = new GetObjectCommand({
      Bucket: this.config.get<string>('s3.bucket'),
      Key: key,
    });
    return this.s3.send(command);
  }

  createKey(
    userId: string,
    projectId: string,
    fileId: string,
    fileExtesion: string,
  ) {
    return `users/${userId}/projects/${projectId}/objects/${fileId}.${fileExtesion}`;
  }
}