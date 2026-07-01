import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { S3Module } from 'nestjs-s3';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    S3Module.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        config: {
          credentials: {
            accessKeyId: config.getOrThrow<string>('s3.keyId'),    
            secretAccessKey: config.getOrThrow<string>('s3.secretKey'),
          },
          region: config.get<string>('s3.region'),
          endpoint: config.get<string>('s3.endpoint'),
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

