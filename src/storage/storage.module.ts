import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { S3Module } from 'nestjs-s3';

@Module({
  imports: [
    S3Module.forRootAsync({
      useFactory: () => ({
        config: {
          credentials: {
            accessKeyId: 'minio',     // todo do wariables from env file 
            secretAccessKey: 'password',
          },
          // region: 'us-east-1',
          endpoint: 'http://localhost:9000',
          forcePathStyle: true,
          signatureVersion: 'v4',
        },
      }),
    }),
  ],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
