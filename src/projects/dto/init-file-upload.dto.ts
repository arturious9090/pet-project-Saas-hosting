import { Transform } from 'class-transformer';
import { IsIn, IsNumber, IsString, Length, Matches } from 'class-validator';
import { MIME_TYPE_BY_VALUE } from 'src/common/types/mime-types-by-value';
import { MimeTypeValue } from 'src/common/types/mime-types-value';
import { ApiProperty } from '@nestjs/swagger';

export class InitFileUploadDto {
  @ApiProperty({
    example: 'index.html',
    description: 'Исходное имя файла с расширением.',
  })
  @IsString()
  fileName!: string;
  @ApiProperty({
    type: Number,
    example: 1024,
    description:
      'Размер в байтах. DTO проверяет только число; дробные и отрицательные значения не запрещены валидатором, но могут быть отклонены БД/проверкой загрузки.',
  })
  @IsNumber()
  size!: number;
  @ApiProperty({
    enum: Object.keys(MIME_TYPE_BY_VALUE),
    enumName: 'UploadMimeType',
    example: 'text/html',
    description:
      'MIME-строка из поддерживаемого списка, передаётся также в Content-Type при PUT.',
  })
  @IsIn(Object.keys(MIME_TYPE_BY_VALUE))
  mimeType!: MimeTypeValue;
  @ApiProperty({
    example: '/index.html',
    minLength: 1,
    maxLength: 1024,
    pattern: '^/[a-zA-Z0-9/_\\-.\\s]+$',
    description:
      'Путь на сайте. Пробелы по краям и конечные / убираются, начальный / добавляется. Пустое значение и / преобразуются в /index.html. Ограничения проверяются после нормализации.',
  })
  @IsString()
  @Length(1, 1024)
  @Transform(({ value }) => {
    let p = (value as string).trim().replace(/\/+$/, '');
    if (!p.startsWith('/')) p = '/' + p;
    return p || '/index.html';
  })
  @Matches(/^\/[a-zA-Z0-9/_\-.\s]+$/, {
    message: 'path must start with / and contains only valid characters',
  })
  path!: string;
}
