import {Entity, ManyToOne, JoinColumn, Column, Index} from "typeorm";
import {Team} from "./team.model";
import {BaseEntity} from "./base";

@Entity()
export class PtoTemplate extends BaseEntity {
  @ManyToOne(() => Team, (team) => team.users, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({name: "team_id"})
  team: Team;

  @Column()
  title: string;

  @Column({length: 1024})
  description: string;

  @Column({type: 'text'})
  content: string;
}