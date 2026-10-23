import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'api/docs';
export const SESSION_SECURITY = 'session_id';

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('SaaS Hosting API')
    .setVersion('0.0.1')
    .setDescription(
      'API платформы хостинга статических сайтов. Все POST-операции используют ' +
        'стандартный статус NestJS 201 при успехе.\n\n' +
        '**Авторизация:** выполните POST /api/auth/sign-in в этом Swagger UI. ' +
        'Браузер сохранит httpOnly cookie session_id и будет отправлять её ' +
        'в последующих запросах на тот же origin. Срок cookie — 5 дней. ' +
        'Ручной ввод Cookie через Authorize ограничен браузером; используйте вход.\n\n' +
        '**Загрузка файла:** init → PUT бинарного тела по uploadUrl с headers ' +
        'из ответа → complete. PUT выполняется напрямую в S3/MinIO, ' +
        'а не на эндпоинт NestJS. Подписанный URL действует 900 секунд.\n\n' +
        '**Публикация:** файлы сайтов обслуживаются по поддомену проекта через ' +
        'Traefik, который передаёт X-Project-Id. В OpenAPI catch-all маршрут ' +
        'представлен как GET /{path}; он также обслуживает корень /.',
    )
    .addTag(
      'Auth',
      'Регистрация и вход; особенности существующего выхода описаны в операции.',
    )
    .addTag('Users', 'Профиль пользователя текущей сессии.')
    .addTag('Projects', 'Проекты пользователя и метаданные загружаемых файлов.')
    .addTag(
      'Sites',
      'Публичная раздача файлов сайтов, SPA fallback и кеширование.',
    )
    .addCookieAuth(
      'session_id',
      {
        type: 'apiKey',
        in: 'cookie',
        description: 'httpOnly cookie, устанавливаемая при sign-in.',
      },
      SESSION_SECURITY,
    )
    .build();

  return SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controller, method) =>
      `${controller.replace(/Controller$/, '')}_${method}`,
  });
}

export function setupSwagger(app: INestApplication) {
  const document = createOpenApiDocument(app);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    jsonDocumentUrl: 'api/docs-json',
    yamlDocumentUrl: 'api/docs-yaml',
    customSiteTitle: 'SaaS Hosting API',
    swaggerOptions: {
      withCredentials: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  return document;
}
