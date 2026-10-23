import {
  IsEmail,
  IsOptional,
  IsString,
  IsStrongPassword,
  Length,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'developer@example.com',
    format: 'email',
    description:
      'Email пользователя. Этот DTO используется при регистрации и входе.',
  })
  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  @IsStrongPassword()
  @ApiProperty({
    example: 'ExamplePass123!',
    format: 'password',
    writeOnly: true,
    minLength: 8,
    description:
      'Минимум 8 символов, строчная и заглавная буквы, цифра и специальный символ. Проверяется также при входе.',
  })
  password!: string;

  @ApiPropertyOptional({
    example: 'developer',
    minLength: 5,
    maxLength: 20,
    description:
      'При регистрации по умолчанию равен email. Во входе поле необязательно и не используется, но при передаче валидируется.',
  })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  username?: string;
}
