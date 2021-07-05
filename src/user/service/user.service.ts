import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AuthService } from 'src/auth/services/auth/auth.service';
import { Repository } from 'typeorm';
import { CreateUserDto } from '../models/dto/CreateUser.dto';
import { LoginUserDto } from '../models/dto/LoginUser.dto';
import { UpdateUserDto } from '../models/dto/UpdateUser.dto';
import { UserEntity } from '../models/user.entity';
import { UserI } from '../models/user.interface';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(UserEntity)
        private userRepository: Repository<UserEntity>,
        private authService: AuthService
    ) { }

    create(createdUserDto: CreateUserDto): Observable<UserI> {
        return this.mailExists(createdUserDto.login).pipe(
            switchMap((exists: boolean) => {
                if (!exists) {
                    return this.authService.hashPassword(createdUserDto.password).pipe(
                        switchMap((passwordHash: string) => {
                            // Overwrite the user password with the hash to store it in the db not in the open
                            createdUserDto.password = passwordHash;
                            return from(this.userRepository.save(createdUserDto)).pipe(
                                map((savedUser: UserI) => {
                                    const { password, ...user } = savedUser;
                                    this.authService.generateJwt(user)
                                    return user;
                                }) 
                            )
                        })
                    )
                } else {
                    throw new HttpException('Email already in use', HttpStatus.CONFLICT);
                }
            })
        )
    }

    login(loginUserDto: LoginUserDto): Observable<string> {
        return this.findUserByEmail(loginUserDto.login).pipe(
            switchMap((user: UserI) => {
                if (user) {
                    return this.validatePassword(loginUserDto.password, user.password).pipe(
                        switchMap((passwordsMatches: boolean) => {
                            if (passwordsMatches) {
                                return this.findOne(user.id).pipe(
                                    switchMap((user: UserI) => this.authService.generateJwt(user))
                                )
                            } else {
                                throw new HttpException('Login was unsuccessfulll', HttpStatus.UNAUTHORIZED);
                            }
                        })
                    )
                } else {
                    throw new HttpException('User not found', HttpStatus.NOT_FOUND);
                }
            })
        )
    }

    update(id: string, updatedUserDto: UpdateUserDto): Observable<UserI> {
        return from(this.userRepository.save({ ...updatedUserDto, id: Number(id) }))
    }

    findAll(): Observable<UserI[]> {
        return from(this.userRepository.find());
    }

    findOne(id: number): Observable<UserI> {
        return from(this.userRepository.findOne({ id }));
    }

    private findUserByEmail(login: string): Observable<UserI> {
        return from(this.userRepository.findOne({ login }, { select: ['id', 'login', 'name', 'lastname', 'birth', 'password'] }));
    }

    private validatePassword(password: string, storedPasswordHash: string): Observable<boolean> {
        return this.authService.comparePasswords(password, storedPasswordHash);
    }

    private mailExists(login: string): Observable<boolean> {
        return from(this.userRepository.findOne({ login })).pipe(
            map((user: UserI) => {
                if (user) {
                    return true;
                } else {
                    return false;
                }
            })
        )
    }

}
