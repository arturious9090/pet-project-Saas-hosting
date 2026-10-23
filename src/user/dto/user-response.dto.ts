import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({
    example: 'cm1234567890abcdef12345678',
    description: 'Идентификатор пользователя (CUID).',
  })
  id!: string;

  @ApiProperty({ example: 'developer@example.com', format: 'email' })
  email!: string;

  @ApiProperty({
    example: 'developer',
    description:
      'В ответе используется userName; в запросе регистрации — username.',
  })
  userName!: string;

  @ApiProperty({
    enum: UserStatus,
    enumName: 'UserStatus',
    example: UserStatus.PANDING,
    description: 'PANDING — текущее имя значения enum в БД.',
  })
  status!: UserStatus;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole', example: UserRole.USER })
  role!: UserRole;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-23T12:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-10-23T12:00:00.000Z',
  })
  updatedAt!: Date;
}

export class UserProfileResponseDto extends UserResponseDto {
  @ApiProperty({
    description:
      'Текущая реализация profile возвращает также bcrypt-хеш пароля из записи User. Регистрация это поле исключает.',
    readOnly: true,
    example: '<bcrypt hash>',
  })
  password!: string;
}
