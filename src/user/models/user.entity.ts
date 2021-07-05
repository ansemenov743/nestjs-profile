import { BeforeInsert, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class UserEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    lastname: string;

    @Column()
    birth: string;

    @Column({unique: true})
    login: string;

    @Column({select: false})
    password: string;

    @BeforeInsert()
    loginToLowerCase() {
        this.login = this.login.toLowerCase();
    }
}