import {Entity, PrimaryGeneratedColumn, Column, Index, OneToMany} from "typeorm";
import {User} from "./user";

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({type: "varchar"})
  team_id: string;

  @OneToMany(() => User, (user) => user.team)
  users: User[];
}