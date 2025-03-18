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

  @Column({type: 'varchar', length: 1024, nullable: true})
  description: string | null;

  @Column({type: 'text'})
  content: string;

  @Column({default: true})
  enabled: boolean;

  @Column({type: "float", default: 1})
  daysConsumed: number;
}