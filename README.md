# SaaS Hosting Platform

Бэкенд-приложение на NestJS для хостинга статических веб-сайтов. Пользователи регистрируются, создают проекты, загружают статические файлы через S3-совместимое хранилище (MinIO), после чего каждый проект становится доступен по собственному поддомену через reverse-прокси Traefik.

## Технологический стек

| Категория | Технология |
|-----------|------------|
| Рантайм | Node.js 20 (Alpine) |
| Язык | TypeScript 5.7 |
| Фреймворк | NestJS 11 |
| База данных | PostgreSQL 16 |
| ORM | Prisma 6.19 |
| Хранилище файлов | MinIO (S3-совместимое) |
| Reverse-прокси | Traefik v2.11 |
| Service Discovery | etcd 3.5 |
| Аутентификация | Passport.js (Local Strategy + httpOnly cookies) |
| Хеширование | bcrypt 6.0 |
| Контейнеризация | Docker / Docker Compose |
| Тестирование | Jest 29 |

## Архитектура

```
Браузер
  │
  ▼
Traefik (порт 80/443)
  ├── Host(api.domain) /api/*       → app:3000 (API)
  ├── Host(traefik.domain)          → панель Traefik
  └── Host({projectId}.domain)/*    → app:3000 (ServeController, стриминг из S3)
        │
        ▼
   NestJS App (порт 3000)
        │
        ├── PostgreSQL (порт 5432)
        ├── MinIO (порты 9000, 9001)
        └── etcd (порт 2379)
```

### Модули

| Модуль | Назначение |
|--------|------------|
| `auth` | Регистрация, вход/выход, Passport Local Strategy |
| `user` | Профиль пользователя |
| `sessions` | Управление сессиями (httpOnly cookies, 5 дней) |
| `projects` | CRUD проектов, инициализация и завершение загрузки файлов |
| `files` | Управление файлами (метаданные в БД, содержимое в S3) |
| `storage` | S3/MinIO — presigned URL, стриминг файлов |
| `serve` | Обслуживание сайтов проектов (SPA fallback, Conditional GET) |
| `traefik` | Динамическое управление роутами Traefik через etcd |
| `prisma` | Глобальный PrismaModule (доступ к БД) |

## Требования

- [Node.js](https://nodejs.org/) ≥ 20
- [Docker](https://www.docker.com/) и [Docker Compose](https://docs.docker.com/compose/)
- [npm](https://www.npmjs.com/) ≥ 10

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/arturious9090/pet-project-Saas-hosting.git
cd pet-project-Saas-hosting
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` и создайте файлы окружения:

```bash
cp .env.example .env.development.local   # для разработки
cp .env.example .env.production.local    # для продакшена
```

Отредактируйте переменные при необходимости. Основные:

| Переменная | Описание | По умолчанию |
|-----------|----------|--------------|
| `DATABASE_URL` | URL подключения к БД | `postgresql://postgres:postgres@localhost:5432/postgres` |
| `SESSION_SECRET` | Секрет для сессий | `secret` |
| `PORT` | Порт приложения | `3000` |
| `DOMAIN_NAME` | Основной домен | `localhost` |
| `AWS_ACCESS_KEY_ID` | S3 Access Key | `minio` |
| `AWS_SECRET_ACCESS_KEY` | S3 Secret Key | `miniominio` |
| `AWS_BUCKET` | Имя S3 бакета | `main-bucket` |

### 3. Запуск через Docker Compose

```bash
docker compose up -d
```

Будут запущены 6 сервисов:
- **app** — NestJS приложение (порт 3000)
- **db** — PostgreSQL (порт 5432)
- **minio** — S3-хранилище + веб-консоль (порты 9000, 9001)
- **etcd** — key-value хранилище для Traefik (порт 2379)
- **traefik** — reverse-прокси (порты 80, 443, 8080)
- **createbuckets** — авто-создание S3 бакета (однократно)

### 4. Проверка работоспособности

- API: `http://localhost:3000/api`
- Панель Traefik: `http://traefic.localhost:8080`
- Консоль MinIO: `http://localhost:9001` (логин: `minio`, пароль: `miniominio`)

## Разработка

### Установка зависимостей

```bash
npm install
```

### Генерация Prisma-клиента

```bash
npx prisma generate
```

### Применение миграций

```bash
npx prisma migrate dev
```

### Запуск в dev-режиме

```bash
npm run start:dev
```

Приложение запустится на `http://localhost:3000` с автоматической перезагрузкой при изменениях.

### Линтинг и форматирование

```bash
npm run lint       # ESLint с автофиксом
npm run format     # Prettier
```

### Тестирование

```bash
npm test           # unit-тесты
npm run test:e2e   # e2e-тесты
npm run test:cov   # покрытие тестами
```

## API

### Аутентификация

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/sign-up` | Регистрация |
| POST | `/api/auth/sign-in` | Вход (возвращает httpOnly cookie `session_id`) |
| POST | `/api/auth/sign-out` | Выход |

### Пользователи

| Метод | Путь | Защита | Описание |
|-------|------|--------|----------|
| GET | `/api/user/profile` | SessionGuard | Профиль текущего пользователя |

### Проекты

| Метод | Путь | Защита | Описание |
|-------|------|--------|----------|
| POST | `/api/projects` | SessionGuard | Создание проекта |
| GET | `/api/projects` | SessionGuard | Список проектов |
| GET | `/api/projects/:projectId` | SessionGuard | Детали проекта |
| POST | `/api/projects/:projectId` | SessionGuard | Обновление проекта |
| POST | `/api/projects/:projectId/files/init` | SessionGuard | Инициализация загрузки файла |
| POST | `/api/projects/:projectId/files/:fileId/complete` | SessionGuard | Подтверждение загрузки |

## Жизненный цикл загрузки файла

1. **Init** — клиент запрашивает presigned URL через `POST /api/projects/:id/files/init`
2. **Upload** — клиент загружает файл напрямую в MinIO/S3 по presigned URL (PUT)
3. **Complete** — клиент подтверждает загрузку через `POST /api/projects/:id/files/:fileId/complete`, сервер проверяет размер файла через HeadObject
4. **Ready** — файл доступен по URL проекта

## Доступ к сайту проекта

После загрузки индексного файла сайт становится доступен по адресу:

```
http://{projectId}.{DOMAIN_NAME}/
```

ServeController обрабатывает запросы:
- Ищет файл в БД по projectId и пути
- SPA fallback: `/about` → `/about.html` → `/about/index.html` → `/index.html`
- Поддержка Conditional GET (304 Not Modified)
- Стриминг файла напрямую из S3

## Команды

| Команда | Описание |
|---------|----------|
| `npm run build` | Сборка проекта |
| `npm start` | Запуск production |
| `npm run start:dev` | Dev-режим с watch |
| `npm run start:debug` | Dev-режим с отладкой |
| `npm run start:prod` | Production через `node dist/main` |
| `npm run format` | Форматирование Prettier |
| `npm run lint` | ESLint с автофиксом |
| `npm test` | Unit-тесты |
| `npm run test:e2e` | e2e-тесты |
| `npm run test:cov` | Покрытие тестами |

## Структура проекта

```
├── docker-compose.yml          # Docker-окружение
├── Dockerfile                  # Сборка приложения
├── prisma/
│   ├── schema.prisma           # Схема БД
│   └── migrations/             # Миграции
├── src/
│   ├── main.ts                 # Точка входа
│   ├── app.module.ts           # Корневой модуль
│   ├── auth/                   # Аутентификация
│   ├── user/                   # Пользователи
│   ├── sessions/               # Сессии
│   ├── projects/               # Проекты
│   ├── files/                  # Файлы
│   ├── storage/                # S3/MinIO
│   ├── serve/                  # Обслуживание сайтов
│   ├── traefik/                # Управление Traefik
│   ├── prisma/                 # PrismaModule (глобальный)
│   ├── configs/                # Конфигурации
│   └── common/                 # Общие типы и интерфейсы
└── test/                       # e2e-тесты
```

## Лицензия

UNLICENSED — проприетарное программное обеспечение.