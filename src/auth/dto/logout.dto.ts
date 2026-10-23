import { ApiProperty } from '@nestjs/swagger';

/** Тело читает LocalAuthGuard; ValidationPipe на sign-out его не проверяет. */
export class LogoutDto {
  @ApiProperty({
    example: 'developer@example.com',
    description: 'Email для существующего LocalAuthGuard.',
  })
  email!: string;

  @ApiProperty({
    example: 'ExamplePass123!',
    format: 'password',
    writeOnly: true,
    description: 'Пароль для существующего LocalAuthGuard.',
  })
  password!: string;
}
