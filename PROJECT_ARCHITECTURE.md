# Полное описание проекта pet-project-Saas-hosting

## 1. Обзор проекта

**pet-project-Saas-hosting** — это бэкенд-приложение на NestJS, реализующее SaaS-платформу для хостинга статических веб-сайтов. Пользователи регистрируются, создают проекты, загружают статические файлы (HTML, CSS, JS, изображения и т.д.) через S3-совместимое хранилище (MinIO), после чего каждый проект становится доступен по собственному поддомену через reverse-прокси Traefik.

Приложение разворачивается в Docker-окружении с PostgreSQL, MinIO, etcd и Traefik.

---

## 2. Технологический стек

### 2.1 Язык и рантайм
- **TypeScript 5.7.3** — основной язык разработки
- **Node.js 20** (Alpine в Docker)
- **CommonJS** модульная система (target ES2023, emit — CommonJS)

### 2.2 Фреймворк
- **NestJS 11.0** — основной бэкенд-фреймворк
  - `@nestjs/core`, `@nestjs/common`
  - `@nestjs/platform-express` — HTTP-сервер Express
  - `@nestjs/config` — конфигурация из переменных окружения
  - `@nestjs/passport` + `passport` + `passport-local` — аутентификация
  - `@nestjs/schedule` — cron-задачи
  - `@nestjs/cli` — CLI для генерации/сборки

### 2.3 База данных и ORM
- **PostgreSQL 16** — реляционная база данных
- **Prisma ORM 6.19** — ORM с генерацией типизированного клиента
  - `@prisma/client` — типизированный клиент
  - `prisma` — CLI для миграций и генерации
  - Миграции хранятся в `prisma/migrations/`

### 2.4 Хранилище файлов
- **MinIO** (S3-совместимое) — локальное объектное хранилище
- **AWS SDK v3** (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`) — работа с S3 API
- **nestjs-s3** — NestJS-обёртка для S3

### 2.5 Reverse-прокси и маршрутизация
- **Traefik v2.11** — reverse-прокси
  - Docker provider — автоматическое обнаружение контейнеров
  - etcd provider — динамическая конфигурация маршрутов
  - Поддержка HTTP (порт 80) и HTTPS (порт 443)
  - Панель управления Traefik на порту 8080
- **etcd 3.5** — распределённое key-value хранилище для хранения конфигурации Traefik
  - `etcd3` (npm-пакет) — клиент etcd для Node.js
  - `@globalart/nestjs-etcd` — NestJS-обёртка для etcd

### 2.6 Контейнеризация
- **Docker / Docker Compose** — оркестрация сервисов
  - `Dockerfile` — multi-stage сборка приложения
  - `docker-compose.yml` — 6 сервисов: db, app, minio, createbuckets, etcd, traefik

### 2.7 Валидация и трансформация данных
- **class-validator 0.14** — декораторы для валидации DTO
- **class-transformer 0.5** — трансформация объектов
- **ValidationPipe** на уровне приложения с `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`

### 2.8 Безопасность
- **bcrypt 6.0** — хеширование паролей (10 раундов соли)
- **cookie-parser** — парсинг cookies
- **Session-based auth** — сессии через httpOnly cookies (5 дней жизни)
- Passport.js Local Strategy

### 2.9 Инструменты разработки
- **ESLint 9** + **typescript-eslint 8** + **Prettier 3** — линтинг и форматирование
- **Jest 29** + **ts-jest** — тестирование
- **SWC** (`@swc/core`, `@swc/cli`) — быстрый компилятор (альтернатива tsc)

---

## 3. Архитектура проекта

### 3.1 Общая структура каталогов

```
/
├── docker-compose.yml          # Docker-окружение (6 сервисов)
├── Dockerfile                  # Сборка NestJS-приложения
├── package.json                # Зависимости и скрипты
├── tsconfig.json               # Конфигурация TypeScript
├── tsconfig.build.json         # Конфигурация для сборки
├── eslint.config.mjs           # Конфигурация ESLint (ES module)
├── .prettierrc                 # Конфигурация Prettier
├── .env.example                # Пример переменных окружения
├── nest-cli.json               # Конфигурация NestJS CLI
├── prisma/
│   ├── schema.prisma           # Схема базы данных
│   └── migrations/             # Миграции Prisma
└── src/
    ├── main.ts                 # Точка входа, bootstrap()
    ├── app.module.ts           # Корневой модуль
    ├── common/                 # Общие типы, интерфейсы, константы
    │   ├── payloads/           # Payload-типы (UserPayload)
    │   ├── requests/           # Расширенные интерфейсы Request
    │   └── types/              # MimeType маппинги
    ├── configs/                # Конфигурации (registerAs)
    │   ├── app.config.ts
    │   ├── db.config.ts
    │   ├── etcd.config.ts
    │   └── s3.config.ts
    ├── prisma/                 # PrismaModule (глобальный)
    │   ├── prisma.module.ts
    │   └── prisma.service.ts
    ├── auth/                   # Аутентификация
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── local.strategy.ts
    │   ├── local-auth.guard.ts
    │   ├── session.guard.ts
    │   └── dto/
    │       └── register.dto.ts
    ├── user/                   # Пользователи
    │   ├── user.module.ts
    │   ├── user.controller.ts
    │   └── user.service.ts
    ├── sessions/               # Сессии
    │   ├── sessions.module.ts
    │   └── sessions.service.ts
    ├── projects/               # Проекты
    │   ├── projects.module.ts
    │   ├── projects.controller.ts
    │   ├── projects.service.ts
    │   └── dto/
    │       ├── create-project.dto.ts
    │       ├── update-project.dto.ts
    │       └── init-file-upload.dto.ts
    ├── files/                  # Файлы
    │   ├── files.module.ts
    │   ├── files.service.ts
    │   └── dto/
    │       └── create-file.dto.ts
    ├── storage/                # S3/MinIO хранилище
    │   ├── storage.module.ts
    │   └── storage.service.ts
    ├── serve/                  # Обслуживание файлов проектов
    │   ├── serve.module.ts
    │   └── serve.controller.ts
    └── traefik/                # Управление Traefik
        ├── traefik.module.ts
        └── traefik.service.ts
```

### 3.2 Диаграмма зависимостей модулей

```
AppModule
├── ConfigModule (глобальный)
├── ScheduleModule (глобальный)
├── PrismaModule (глобальный) ──────> PrismaService
├── AuthModule
│   ├── UserModule ──────────────> UserService
│   ├── SessionsModule ──────────> SessionsService
│   └── PassportModule
├── UserModule
│   └── SessionsModule
├── SessionsModule
├── ProjectsModule
│   ├── FilesModule ─────────────> FilesService
│   ├── SessionsModule
│   ├── UserModule
│   ├── StorageModule ───────────> StorageService
│   └── TraefikModule ───────────> TraefikService
├── FilesModule
│   └── StorageModule
├── StorageModule (S3Module)
└── TraefikModule (EtcdModule)
```

### 3.3 Потоки данных (Use Cases)

#### Регистрация пользователя
```
POST /api/auth/sign-up  { email, password, username? }
  -> AuthController.register()
    -> AuthService.register()
      -> bcrypt.hash(password, 10)
      -> UserService.create({ email, password: hash, userName })
        -> PrismaService.user.create()
      -> возвращает пользователя без пароля
```

#### Вход в систему
```
POST /api/auth/sign-in  { email, password }
  -> LocalAuthGuard (Passport Local Strategy)
    -> LocalStrategy.validate(email, password)
      -> AuthService.validateUser(email, password)
        -> UserService.findByEmail(email)
        -> bcrypt.compare(password, user.password)
      -> возвращает пользователя без пароля
  -> AuthController.login()
    -> AuthService.login(dto, { ua, ip })
      -> ищет последнюю ACTIVE сессию (getLastActiveSession)
      -> если нет — создаёт новую (createSession с randomUUID)
      -> возвращает sessionId
    -> устанавливает httpOnly cookie "session_id" на 5 дней
```

#### Аутентификация через сессию (SessionGuard)
```
Запрос к защищённому эндпоинту
  -> SessionGuard.canActivate()
    -> извлекает "session_id" из cookies
    -> SessionsService.validateSession(sessionId)
      -> проверяет, не истекла ли сессия и статус ACTIVE
    -> UserService.findById(session.userId)
    -> прикрепляет user к request
```

#### Создание проекта
```
POST /api/projects  { name }
  -> SessionGuard
  -> ProjectsController.create()
    -> ProjectsService.create(dto, userId)
      -> PrismaService.project.create() (статус DRAFT)
      -> PrismaService.project.update() — создаёт домен:
           rootDomain = DOMAIN_NAME,
           subdomain = project.id,
           fqdn = project.id + '.' + DOMAIN_NAME
      -> TraefikService.addProject(fqdn, projectId)
        -> создаёт router (Host rule)
        -> прокидывает X-Project-Id через middleware
        -> service projects-backend → app:3000 (общий для всех проектов)
```

#### Загрузка файла (инициализация)
```
POST /api/projects/:projectId/files/init  { fileName, size, mimeType, path }
  -> SessionGuard
  -> ProjectsController.initFileUpload()
    -> ProjectsService.createFileUploadRequest(userId, projectId, dto)
      -> FilesService.createFile(projectId, userId, dto)
        -> создаёт storedName = randomUUID()
        -> создаёт S3 key: users/{userId}/projects/{projectId}/objects/{storedName}.{ext}
        -> PrismaService.file.create() (статус PENDING_UPLOAD)
      -> StorageService.createUploadUrl(key, mimeType)
        -> создаёт presigned PUT URL (действует 15 минут)
      -> привязывает файл к проекту
      -> возвращает { uploadUrl, method: 'PUT', key, headers, expiresIn, fileId }
```

#### Завершение загрузки файла
```
POST /api/projects/:projectId/files/:fileId/complete
  -> SessionGuard
  -> ProjectsController.completeFileUpload()
    -> проверяет принадлежность файла пользователю и проекту
    -> FilesService.checkFile(file)
      -> StorageService.getFileHead(key) — проверяет HeadObject S3
      -> сверяет размер файла (ContentLength vs file.size)
      -> если не совпадает — REJECTED
      -> если совпадает — сохраняет ETag (хеш) и статус UPLOADED
    -> файл готов к показу (статус UPLOADED + hashSum не null)
```

#### Доступ к сайту проекта (новая архитектура)
```
Браузер -> http://{projectId}.{DOMAIN_NAME}/{path}
  -> Traefik (порт 80)
    -> Router: Host(`{projectId}.{DOMAIN_NAME}`)
    -> Middleware: X-Project-Id={projectId}
    -> Service: projects-backend → app:3000
  -> NestJS ServeController (@Get('*'))
    -> Извлекает X-Project-Id из заголовка
    -> Prisma: ищет File { projectId, path, status: UPLOADED, hashSum: not null }
    -> Если не найден — SPA fallback (path.html → path/index.html → /index.html)
    -> Если найден — заголовки (Content-Type, ETag, Cache-Control)
    -> Conditional GET (304 Not Modified)
    -> S3 GetObject → stream.pipe(response)
```

#### Cron-очистка сессий
```
Каждую минуту (на 5-й секунде: '5 * * * *')
  -> SessionsService.checkSessions()
    -> PrismaService.session.updateMany()
      -> WHERE expiresAt < now(), status = ACTIVE
      -> SET status = EXPIRED
```

---

## 4. Схема базы данных (Prisma)

### 4.1 Модели

| Модель | Таблица | Описание |
|--------|---------|----------|
| User | users | Пользователи платформы |
| Session | sessions | Пользовательские сессии |
| Project | projects | Проекты (сайты) |
| File | files | Файлы проектов |
| Domain | domains | Домены проектов (Cloudflare-ready) |

### 4.2 Поля и связи

**User:**
- `id: String @id @default(cuid())` — первичный ключ (CUID)
- `email: String @unique` — уникальный email
- `password: String` — хеш bcrypt
- `status: UserStatus @default(PANDING)` — PANDING | VERIFIED | BANNED
- `role: UserRole @default(USER)` — USER | ADMIN
- `userName: String @unique` — уникальное имя пользователя
- `createdAt, updatedAt: DateTime` — авто-метки времени
- Связи: `sessions Session[]`, `projects Project[]`

**Session:**
- `id: String @id @default(cuid())`
- `userId: String` — FK к User
- `status: SessionStatus` — ACTIVE | EXPIRED | REVOKED
- `ip: String?` — IP пользователя
- `ua: String?` — User-Agent
- `sessionId: String @unique` — UUID сессии
- `createdAt, expiresAt: DateTime`
- Связь: `user User @relation(fields: [userId], onDelete: Cascade)`

**Project:**
- `id: String @id @default(cuid())`
- `name: String`
- `status: ProjectStatus` — ACTIVE | DRAFT | DELETED | ARCHIVED
- `ownerId: String` — FK к User
- Связи: `owner User`, `files File[]`, `domain Domain?`

**File:**
- `id: String @id @default(cuid())`
- `name: String` — оригинальное имя файла
- `storedName: String? @unique` — UUID-имя в хранилище
- `mimeType: MimeType?` — enum типов MIME
- `path: String` — внешний путь к файлу (на сайте)
- `key: String` — ключ в S3 хранилище
- `size: Int?` — размер в байтах
- `hashSum: String?` — ETag хеш (MD5)
- `extension: FileExtension?` — расширение файла
- `status: FileStatus` — PENDING_UPLOAD | UPLOADED | PROCESSING | READY | FAILED | REJECTED
- `metaData: Json?` — дополнительные метаданные
- `ownerId: String` — FK к User (но не связан напрямую)
- `projectId: String` — FK к Project
- `createdAt, updatedAt: DateTime`
- Связь: `project Project @relation(fields: [projectId])`

**Domain:**
- `id: String @id @default(cuid())`
- `rootDomain: String` — основной домен
- `subdomain: String?` — поддомен (null/'' для apex)
- `fqdn: String @unique` — полное доменное имя (FQDN)
- `ipv6: String?`
- `proxied: Boolean @default(true)` — Cloudflare-прокси
- `zoneId: String` — Cloudflare Zone ID
- `cfRecordIds: Json` — `{ A?: string, AAAA?: string, CNAME?: string }`
- `projectId: String @unique` — 1:1 связь с проектом
- Связь: `project Project`

### 4.3 Enum-ы

**UserRole:** USER, ADMIN
**SessionStatus:** ACTIVE, EXPIRED, REVOKED
**UserStatus:** PANDING, VERIFIED, BANNED
**ProjectStatus:** ACTIVE, DRAFT, DELETED, ARCHIVED
**FileStatus:** PENDING_UPLOAD, UPLOADED, PROCESSING, READY, FAILED, REJECTED
**MimeType:** ~30 значений (APPLICATION_PDF, IMAGE_JPEG, VIDEO_MP4, etc.)
**FileExtension:** ~60 значений (JPG, PDF, JS, TS, MP4, ZIP, etc.)

---

## 5. API Эндпоинты

### 5.1 Аутентификация (`/api/auth`)

| Метод | Путь | Защита | Описание |
|-------|------|--------|----------|
| POST | `/sign-up` | — | Регистрация нового пользователя |
| POST | `/sign-in` | LocalAuthGuard | Вход, возвращает cookie session_id |
| POST | `/sign-out` | LocalAuthGuard | Выход (Passport logout) |

### 5.2 Пользователи (`/api/user`)

| Метод | Путь | Защита | Описание |
|-------|------|--------|----------|
| GET | `/profile` | SessionGuard | Профиль текущего пользователя |

### 5.3 Проекты (`/api/projects`)

| Метод | Путь | Защита | Описание |
|-------|------|--------|----------|
| POST | `/` | SessionGuard | Создание проекта |
| GET | `/` | SessionGuard | Список проектов пользователя |
| GET | `/:projectId` | SessionGuard | Детали проекта + проверка владельца |
| POST | `/:projectId` | SessionGuard | Обновление проекта |
| POST | `/:projectId/files/init` | SessionGuard | Инициализация загрузки файла (presigned URL) |
| POST | `/:projectId/files/:fileId/complete` | SessionGuard | Подтверждение завершения загрузки |

---

## 6. Стиль кода

### 6.1 NestJS-паттерны

- **Декораторы**: активное использование `@Injectable()`, `@Module()`, `@Controller()`, `@Get()`, `@Post()`, `@Param()`, `@Body()`, `@Req()`, `@Res()`, `@UseGuards()`, `@Cron()`, `@InjectS3()`, `@InjectEtcdClient()`
- **Dependency Injection**: все зависимости внедряются через конструкторы с `private readonly`
- **DTO + Validation**: все входные данные валидируются через class-validator декораторы:
  ```typescript
  export class RegisterDto {
    @IsString()
    @IsEmail()
    email!: string;

    @IsString()
    @IsStrongPassword()
    password!: string;

    @IsOptional()
    @IsString()
    @Length(5, 20)
    username?: string;
  }
  ```
- **definite assignment assertion (`!`)**: все поля DTO используют `!` вместо инициализации

### 6.2 Обработка ошибок

- Стандартные NestJS исключения: `NotFoundException`, `UnauthorizedException`, `ConflictException`, `ForbiddenException`, `InternalServerErrorException`
- Prisma-специфичные ошибки обрабатываются через `PrismaClientKnownRequestError` с проверкой кодов P2002 (unique constraint), P2025 (not found)
- Шаблон обработки:
  ```typescript
  try {
    return await this.prisma.user.create({ data })
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002')
      throw new ConflictException('...');
    throw err
  }
  ```

### 6.3 Именование

- Файлы: kebab-case (`session.guard.ts`, `create-project.dto.ts`)
- Классы: PascalCase (`AuthService`, `RegisterDto`, `SessionGuard`)
- Методы: camelCase (`validateUser`, `createFile`, `getLastActiveSession`)
- Переменные: camelCase (`sessionId`, `userId`, `middlewareName`)
- Константы: UPPER_SNAKE_CASE (`MIME_TYPE_VALUES`, `MIME_TYPE_BY_VALUE`)
- Типы: PascalCase (`UserPyload`, `MimeTypeValue`)
- Используются и украинские, и английские названия переменных/методов
- Комментарии: на русском и украинском языках

### 6.4 Prettier конфигурация

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

### 6.5 ESLint правила (основные)

- `@typescript-eslint/no-explicit-any`: off (разрешён any)
- `@typescript-eslint/no-floating-promises`: warn
- `@typescript-eslint/no-unsafe-argument`: warn
- Type-checked ESLint включён через `projectService: true`

### 6.6 Импорты

- Относительные импорты внутри модуля
- Абсолютные импорты через алиасы `src/` для межмодульных зависимостей:
  ```typescript
  import { UserService } from 'src/user/user.service';
  import { PrismaService } from 'src/prisma/prisma.service';
  ```
- Библиотеки импортируются стандартно

---

## 7. Docker-окружение

### 7.1 Сервисы docker-compose.yml

| Сервис | Образ | Порт(ы) | Назначение |
|--------|-------|---------|------------|
| db | postgres:16 | 5432 | База данных |
| app | собранный образ | 3000 | NestJS приложение |
| minio | minio/minio | 9000, 9001 | S3-хранилище + консоль |
| createbuckets | minio/mc:latest | — | Авто-создание бакета |
| etcd | bitnamilegacy/etcd:3.5 | 2379 | Key-value хранилище |
| traefik | traefik:v2.11 | 80, 443, 8080 | Reverse-прокси |

### 7.2 Dockerfile

```
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["node", "--env-file", ".env.production.local", "dist/main"]
```

### 7.3 Traefik конфигурация (Labels)

```yaml
# Панель Traefik
- traefik.http.routers.traefik.rule=Host(`${TRAEFIC_PANEL_DOMAIN}`)
- traefik.http.routers.traefik.entrypoints=web

# Прокси на API
- traefik.http.routers.api.rule=Host(`${DOMAIN_NAME}`) && PathPrefix(`/api`)
- traefik.http.routers.api.entrypoints=websecure
- traefik.http.routers.api.tls=true
- traefik.http.services.api.loadbalancer.server.port=3000
```

### 7.4 etcd конфигурация (через Traefik provider)

```yaml
- --providers.etcd=true
- --providers.etcd.endpoints=etcd:2379
```

### 7.5 Volumes

| Volume | Назначение |
|--------|------------|
| postgres_data | Данные PostgreSQL |
| minio_data | Данные MinIO |
| etcd-data | Данные etcd |
| traefik-acme | ACME сертификаты |
| certs | Пользовательские сертификаты |

---

## 8. Конфигурация приложения

### 8.1 Переменные окружения

| Переменная | Назначение | По умолчанию |
|-----------|------------|---------------|
| DATABASE_URL | URL подключения к БД | postgresql://postgres:postgres@localhost:5432/postgres |
| POSTGRES_USER | Пользователь БД | postgres |
| POSTGRES_PASSWORD | Пароль БД | postgres |
| POSTGRES_DB | Имя БД | postgres |
| SESSION_SECRET | Секрет сессий | secret |
| PORT | Порт приложения | 3000 |
| DOMAIN_NAME | Основной домен | localhost |
| AWS_ACCESS_KEY_ID | S3 Access Key | minio |
| AWS_SECRET_ACCESS_KEY | S3 Secret Key | miniominio |
| AWS_REGION | S3 регион | us-east-1 |
| AWS_ENDPOIN | S3 endpoint (опечатка в коде) | http://localhost:9000 |
| AWS_BUCKET | Имя бакета | main-bucket |
| PROVIDERS_ETCD | etcd провайдер включён | true |
| PROVIDERS_ETCD_ENDPOINTS | etcd эндпоинт | etcd:2379 |
| TRAEFIC_PANEL_DOMAIN | Домен панели Traefik | traefic.localhost |
| ALLOW_NONE_AUTHENTICATION | etcd без аутентификации | yes |
| ETCD_ADVERTISE_CLIENT_URLS | etcd advertise URL | http://etcd:2379 |
| ETCD_LISTEN_CLIENT_URLS | etcd listen URL | http://0.0.0.0:2379 |

### 8.2 ConfigService namespaces

| Namespace | Ключи | Источник |
|-----------|-------|----------|
| `app` | port, env, sessionSecret, domainName | app.config.ts |
| `db` | databaseUrl, postgresPass, postgresUser, postgresDb | db.config.ts |
| `s3` | secretKey, keyId, region, endpoint, bucket | s3.config.ts |
| `etcd` | etcdAdvertiseClientUrls | etcd.config.ts |

---

## 9. Ключевые бизнес-логики и алгоритмы

### 9.1 Жизненный цикл проекта

```
DRAFT -> ACTIVE -> ARCHIVED/DELETED
```

1. Пользователь создаёт проект → статус **DRAFT**
2. Пользователь загружает файлы
3. После загрузки индексного файла сайт доступен по поддомену
4. Статус меняется на **ACTIVE** (логика перевода не реализована в коде — TODO)
5. Можно заархивировать или удалить

### 9.2 Жизненный цикл файла

```
PENDING_UPLOAD -> UPLOADED -> READY
     |              |
     v              v
   FAILED        REJECTED
```

1. `initFileUpload` → создаёт запись в БД со статусом **PENDING_UPLOAD**, генерирует presigned URL
2. Клиент загружает файл напрямую в S3/MinIO по presigned URL
3. `completeFileUpload` → проверяет HeadObject (размер), сверяет:
   - Совпадает → статус **UPLOADED**, сохраняется ETag
   - Не совпадает → статус **REJECTED**

### 9.3 Сессионная модель

- Сессии живут 5 дней (5 × 24 × 60 × 60 × 1000 мс)
- Session ID = randomUUID()
- Хранятся в httpOnly cookies (не доступны из JS)
- Passport.js LocalStrategy использует email как username field
- Cron-задача каждую минуту на 5-й секунде проставляет EXPIRED просроченным сессиям
- При логине ищется последняя ACTIVE сессия — если есть, переиспользуется

### 9.4 Генерация S3 ключа

```
users/{userId}/projects/{projectId}/objects/{storedName}.{extension}
```

- `storedName` = UUID без дефисов
- `extension` берётся из `path.extname(originalFileName)`
- S3 бакет: `main-bucket`

### 9.5 Traefik маршрутизация (новая архитектура)

**Статические роуты (docker labels):**
- Панель Traefik: `Host(traefik.localhost)` → api@internal
- API: `Host(localhost) && PathPrefix(/api)` → app:3000

**Динамические роуты проектов (etcd, O(проекты)):**
- **Router**: `Host(\`{projectId}.{domainName}\`)` → service `projects-backend`
- **Middleware**: `X-Project-Id={projectId}` (прокидывается в заголовок запроса)
- **Service**: `projects-backend` → `http://app:3000` (один глобальный сервис для всех проектов)

**ServeController (NestJS):**
- Catch-all `@Get('*')` — обслуживает все запросы к сайтам проектов
- Ищет файл в БД по `projectId` (из X-Project-Id) + `path` (из URL)
- SPA fallback: `/about` → `/about.html` → `/about/index.html` → `/index.html`
- Стримит файл из S3 напрямую в response
- Заголовки: Content-Type (из БД MIME типа), ETag, Cache-Control, 304 Not Modified
- Клиент никогда не видит внутренние S3 ключи — только логические URL

---

## 10. Особенности и TODO/Проблемы

### 10.1 Известные проблемы и недоработки

1. **Опечатка в переменной**: `AWS_ENDPOIN` вместо `AWS_ENDPOINT` (в .env.example, s3.config.ts и docker-compose.yml)
2. **UserStatus email verification**: статус PANDING не меняется на VERIFIED — нет email-верификации
3. **Project status flow**: проекты создаются как DRAFT, но нет логики перевода в ACTIVE
4. **Нет валидации владельца на уровне БД**: File.ownerId не связан с User через relation, проверка идёт в коде
5. **createProject**: создание проекта и домена не обёрнуто в транзакцию (комментарий в коде: "обернуть все в транзакцию")
6. **Определение расширения**: `path.extname(dto.fileName).slice(1)` — примитивный подход, комментарий: "Сделать нормальное определение расширения файла"
7. **Encoding в Traefik**: комментарий "Сделать путь и имяфайла сделать на других языках в биты" — неполная поддержка Unicode в путях
8. **Logout**: реализован через `req.logout()` Passport, но не очищает сессию в БД
9. **Domain модель**: поля zoneId и cfRecordIds не заполняются реальными данными (Cloudflare интеграция не реализована)
10. **CORS**: не настроен
11. **Rate limiting**: отсутствует
12. **HTTPS**: роутер API использует TLS, но сертификаты не настроены

### 10.2 Языковая смесь

- Код и идентификаторы: преимущественно английский
- DTO имена: английские
- Комментарии: русский и украинский
- Сообщения ошибок: английские
- Переменная `PANDING` в enum: опечатка, должно быть `PENDING`

### 10.3 Неиспользуемые файлы

- `events.json` в корне — пустой или неиспользуемый
- `Діаграма без назви.drawio` — вероятно, диаграмма архитектуры
- `test/` директория содержит только boilerplate e2e тест

---

## 11. Команды (npm scripts)

| Команда | Описание |
|---------|----------|
| `npm run build` | Сборка через Nest CLI |
| `npm start` | Запуск production |
| `npm run start:dev` | Запуск dev с watch + .env.development.local |
| `npm run start:debug` | Запуск с дебагом |
| `npm run start:prod` | Production через `node dist/main` |
| `npm run format` | Prettier форматирование |
| `npm run lint` | ESLint с автофиксом |
| `npm test` | Jest unit тесты |
| `npm run test:e2e` | e2e тесты |
| `npm run test:cov` | Тесты с coverage |

---

## 12. Рекомендации для AI-агента

### 12.1 При работе с кодом

1. **Всегда используй class-validator декораторы** для новых DTO
2. **Обрабатывай Prisma ошибки** через `PrismaClientKnownRequestError` с кодами P2002, P2025
3. **Используй `!` (definite assignment)** для полей DTO
4. **Следуй паттерну**: Module → Service → Controller → DTO
5. **Импортируй межмодульные зависимости** через `src/` префикс
6. **Используй `private readonly`** в конструкторах для DI
7. **Глобальный PrismaModule**: не нужно импортировать в каждый модуль
8. **Валидация прав**: проверяй `ownerId` перед операциями над проектами/файлами

### 12.2 При добавлении фич

- Новый модуль: создай `feature.module.ts`, `feature.service.ts`, `feature.controller.ts`, `dto/`
- Зарегистрируй в `app.module.ts`
- Если нужна защита — используй `SessionGuard`
- Для работы с БД — инжектируй `PrismaService` (глобальный)
- Для S3 — инжектируй `StorageService`
- Для Traefik — инжектируй `TraefikService`

### 12.3 Ключевые паттерны

- **Создание ресурса с транзакцией**: оборачивай несколько Prisma-запросов в `this.prisma.$transaction([])`
- **Presigned URL паттерн**: init → upload to S3 → complete → verify HeadObject
- **ServeController + S3 стриминг**: обслуживание файлов проектов через NestJS (поиск в БД → S3 GetObject → stream), логические URL клиента не раскрывают структуру S3
- **Traefik host-based routing**: только роутинг на уровне хостов + прокидывание X-Project-Id, без per-file middleware
