import { ApiProperty } from '@nestjs/swagger';
import { FileExtension, FileStatus, MimeType, Prisma } from '@prisma/client';

export class FileResponseDto {
  @ApiProperty({
    example: 'cmfile1234567890abcdef1234',
    description: 'Идентификатор файла (CUID).',
  })
  id!: string;

  @ApiProperty({ example: 'index.html', description: 'Исходное имя файла.' })
  name!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'ab123456-1234-4234-8234-123456789012',
  })
  storedName!: string | null;

  @ApiProperty({ example: 'cm1234567890abcdef12345678' })
  ownerId!: string;

  @ApiProperty({ example: 'cmproject1234567890abcdef' })
  projectId!: string;

  @ApiProperty({
    enum: MimeType,
    enumName: 'MimeType',
    nullable: true,
    example: MimeType.TEXT_HTML,
    description:
      'В ответе — enum БД (TEXT_HTML), в init-запросе — MIME-строка (text/html).',
  })
  mimeType!: MimeType | null;

  @ApiProperty({
    example: '/index.html',
    description: 'Путь файла на сайте проекта.',
  })
  path!: string;

  @ApiProperty({
    example: 'users/user-id/projects/project-id/objects/object-id.html',
    description: 'Ключ объекта в S3/MinIO.',
  })
  key!: string;

  @ApiProperty({
    type: 'integer',
    nullable: true,
    example: 1024,
    description: 'Заявленный размер в байтах.',
  })
  size!: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '"d41d8cd98f00b204e9800998ecf8427e"',
    description: 'ETag S3 после проверки загрузки.',
  })
  hashSum!: string | null;

  @ApiProperty({
    enum: FileExtension,
    enumName: 'FileExtension',
    nullable: true,
    example: null,
    description: 'Поле БД; текущая загрузка оставляет null.',
  })
  extension!: FileExtension | null;

  @ApiProperty({
    enum: FileStatus,
    enumName: 'FileStatus',
    example: FileStatus.UPLOADED,
  })
  status!: FileStatus;

  @ApiProperty({
    nullable: true,
    description: 'Произвольное JSON-значение или null.',
    oneOf: [
      { type: 'object', additionalProperties: true },
      { type: 'array', items: {} },
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
    ],
    example: null,
  })
  metaData!: Prisma.JsonValue | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-23T12:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-23T12:01:00.000Z',
  })
  updatedAt!: Date;
}
