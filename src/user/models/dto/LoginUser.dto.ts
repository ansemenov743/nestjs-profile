import { IsEmail, IsNotEmpty } from "class-validator";

export class LoginUserDto {

    @IsEmail()
    login: string;

    @IsNotEmpty()
    password: string;
}