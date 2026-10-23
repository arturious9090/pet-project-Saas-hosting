import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ErrorResponseDto } from './dto/error-response.dto';

const errors = {
  400: [
    'Bad Request',
    'Неверное тело запроса, ошибки валидации или отсутствующие credentials.',
  ],
  401: [
    'Unauthorized',
    'Неверные credentials, отсутствующая, истёкшая или отозванная сессия.',
  ],
  403: [
    'Forbidden',
    'Проверка загруженного файла не пройдена: размер отличается от заявленного.',
  ],
  404: [
    'Not Found',
    'Пользователь, проект, файл или объект S3 не найден; ресурс может быть недоступен текущему пользователю.',
  ],
  409: ['Conflict', 'Пользователь с таким email или userName уже существует.'],
  500: [
    'Internal Server Error',
    'Внутренняя ошибка приложения или зависимого сервиса.',
  ],
} as const;

export function ApiErrors(...statuses: (keyof typeof errors)[]) {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ...statuses.map((status) =>
      ApiResponse({
        status,
        description: errors[status][1],
        content: {
          'application/json': {
            schema: { $ref: getSchemaPath(ErrorResponseDto) },
            example: {
              statusCode: status,
              message: errors[status][0],
              error: errors[status][0],
            },
          },
        },
      }),
    ),
  );
}
