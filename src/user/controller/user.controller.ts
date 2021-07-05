import { Body, Controller, Get, HttpCode, Post, Req, UseGuards, Param, Put } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateUserDto } from '../models/dto/CreateUser.dto';
import { LoginUserDto } from '../models/dto/LoginUser.dto';
import { UpdateUserDto } from '../models/dto/UpdateUser.dto';
import { UserI } from '../models/user.interface';
import { UserService } from '../service/user.service';

@Controller('users')
export class UserController {

    constructor(private userService: UserService) {}

    @Post()
    @HttpCode(200)
    create(@Body() createdUserDto: CreateUserDto): Observable<UserI> {
        return this.userService.create(createdUserDto);
    }

    @Post('login')
    @HttpCode(200)
    login(@Body() loginUserDto: LoginUserDto): Observable<Object> {
        return this.userService.login(loginUserDto).pipe(
            map((jwt: string) => {
                return {
                    access_token: jwt,
                    token_type: 'JWT',
                    expires_in: 10000
                }
            })
        );
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Req() request): Observable<UserI[]> {
        return this.userService.findAll();
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    findOne(@Param('id') id: string): Observable<UserI> {
        return this.userService.findOne(+id);
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    update(@Param('id') id: string, @Body() updatedUserDto: UpdateUserDto): Observable<UserI> {
        console.log(id, updatedUserDto)
        return this.userService.update(id, updatedUserDto);
    }
}
