import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@prisma/client';
import { FileResponseDto } from '../../files/dto/file-response.dto';

export class ProjectResponseDto {
  @ApiProperty({
    example: 'cmproject1234567890abcdef',
    description: 'Идентификатор проекта (CUID).',
  })
  id!: string;

  @ApiProperty({ example: 'My portfolio' })
  name!: string;

  @ApiProperty({
    enum: ProjectStatus,
    enumName: 'ProjectStatus',
    example: ProjectStatus.DRAFT,
  })
  status!: ProjectStatus;

  @ApiProperty({ example: 'cm1234567890abcdef12345678' })
  ownerId!: string;
}

export class ProjectDetailsResponseDto extends ProjectResponseDto {
  @ApiProperty({
    type: () => [FileResponseDto],
    description: 'Все записи файлов проекта, включая незавершённые загрузки.',
  })
  files!: FileResponseDto[];
}
