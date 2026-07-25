import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    { logger: ['log', 'error', 'warn', 'debug', 'verbose'], }
  );

  // Global prefix removed — controllers define their own /api prefix
  // ServeController must NOT have /api prefix (serves project sites at root)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser())

  const config = app.get(ConfigService);

  await app.listen(config.get<string>('PORT') ?? 3000);
}
bootstrap();
