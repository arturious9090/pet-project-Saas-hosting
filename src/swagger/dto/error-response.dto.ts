import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'HTTP-статус ошибки.' })
  statusCode!: number;

  @ApiProperty({
    description: 'Сообщение ошибки или массив сообщений ValidationPipe.',
    oneOf: [
      { type: 'string', example: 'Unauthorized' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['email must be an email'],
      },
    ],
  })
  message!: string | string[];

  @ApiPropertyOptional({
    example: 'Bad Request',
    description: 'Название ошибки; в ответах 500 может отсутствовать.',
  })
  error?: string;
}
