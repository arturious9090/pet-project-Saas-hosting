import { ApiProperty } from '@nestjs/swagger';

export class FileUploadHeadersDto {
  @ApiProperty({
    example: 'text/html',
    description: 'Передать этот Content-Type при PUT в S3/MinIO.',
  })
  'Content-Type'!: string;
}

export class FileUploadResponseDto {
  @ApiProperty({
    format: 'uri',
    example:
      'http://localhost:9000/main-bucket/users/user-id/projects/project-id/objects/object-id.html?X-Amz-Signature=example',
    description:
      'Подписанный URL. Отправить сюда бинарное тело файла напрямую, без обёртки JSON или multipart.',
  })
  uploadUrl!: string;

  @ApiProperty({ enum: ['PUT'], example: 'PUT' })
  method!: 'PUT';

  @ApiProperty({
    example: 'users/user-id/projects/project-id/objects/object-id.html',
  })
  key!: string;

  @ApiProperty({ type: () => FileUploadHeadersDto })
  headers!: FileUploadHeadersDto;

  @ApiProperty({
    type: 'integer',
    example: 900,
    description: 'Время действия URL в секундах.',
  })
  expiresIn!: number;

  @ApiProperty({
    example: 'cmfile1234567890abcdef1234',
    description: 'Передать как fileId в complete после успешного PUT.',
  })
  fileId!: string;
}
