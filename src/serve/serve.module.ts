import { Module } from '@nestjs/common';
import { ServeController } from './serve.controller';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ServeController],
  providers: [],
})
export class ServeModule {}