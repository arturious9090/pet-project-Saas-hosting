import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { FilesModule } from 'src/files/files.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { UserModule } from 'src/user/user.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService],
  imports: [FilesModule, SessionsModule, UserModule, StorageModule]
})
export class ProjectsModule {}
