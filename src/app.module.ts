import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { SessionsModule } from './sessions/sessions.module';
import { ProjectsModule } from './projects/projects.module';
import { FilesModule } from './files/files.module';
import appConfig from './configs/app.config';
import s3Config from './configs/s3.config';
import dbConfig from './configs/db.config';


@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true
      load: [appConfig, s3Config, dbConfig],
    }),
    PrismaModule,
    AuthModule,
    SessionsModule,
    ProjectsModule,
    FilesModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
