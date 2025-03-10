import {Entity, Column, Index, OneToMany} from "typeorm";
import {User} from "./user.model";
import {BaseEntity} from "./base";

@Entity()
export class Team extends BaseEntity {
  @Index()
  @Column()
  teamId: string;

  @OneToMany(() => User, (user) => user.team)
  users: User[];
}