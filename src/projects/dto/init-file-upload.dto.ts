import { MimeType } from "@prisma/client";
import { IsEnum, IsNumber, IsString, Length, Matches } from "class-validator";


export class InitFileUploadDto {
    @IsString()
    fileName!: string;
    @IsNumber()
    size!: number;
    @IsEnum(MimeType)
    mimeType!: MimeType;
    @IsString()
    @Length(1, 1024)
    @Matches(/^[a-zA-Z0-9/_\-.\s]+$/, {
        message: 'path contains invalid characters',
    })
    path!: string;
}