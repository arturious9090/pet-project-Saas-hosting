import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    example: 'My portfolio',
    description:
      'Название проекта. Текущая валидация проверяет только тип строки.',
  })
  @IsString()
  name!: string;
}
