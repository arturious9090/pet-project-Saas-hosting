import { IsEmail, IsOptional, IsString, IsStrongPassword, Length } from "class-validator";

export class RegisterDto {
    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @IsStrongPassword()
    password: string;
    
    @IsOptional()
    @IsString()
    @Length(5, 20)
    username?: string;
}