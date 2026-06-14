import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { SessionsModule } from 'src/sessions/sessions.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    SessionsModule
  ],
  providers: [
    AuthService,
    LocalStrategy
  ],
  controllers: [AuthController]
})
export class AuthModule { }
