import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [StorageModule],
  providers: [FilesService],
  exports: [FilesService]
})
export class FilesModule {
}
