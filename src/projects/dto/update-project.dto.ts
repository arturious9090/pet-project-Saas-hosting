import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiPropertyOptional({
    example: 'Updated portfolio',
    description:
      'Новое название. Единственное доступное поле обновления; пустое тело допустимо.',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
