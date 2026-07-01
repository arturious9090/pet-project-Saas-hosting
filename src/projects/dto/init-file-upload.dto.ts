import { IsIn, IsNumber, IsString, Length, Matches } from "class-validator";
import { MIME_TYPE_BY_VALUE } from "src/common/types/mime-types-by-value";
import { MimeTypeValue } from "src/common/types/mime-types-value";


export class InitFileUploadDto {
    @IsString()
    fileName!: string;
    @IsNumber()
    size!: number;
    @IsIn(Object.keys(MIME_TYPE_BY_VALUE))
    mimeType!: MimeTypeValue;
    @IsString()
    @Length(1, 1024)
    @Matches(/^[a-zA-Z0-9/_\-.\s]+$/, {
        message: 'path contains invalid characters',
    })
    path!: string;
}