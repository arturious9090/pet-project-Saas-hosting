import { Module } from '@nestjs/common';
import { TraefikService } from './traefik.service';
import { EtcdModule } from '@globalart/nestjs-etcd';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    EtcdModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        etcdOptions: {
          hosts: config.getOrThrow<string>('etcd.etcdAdvertiseClientUrls')
        }
      })
    }),
  ],
  providers: [TraefikService],
  exports: [TraefikService]
})
export class TraefikModule { }
