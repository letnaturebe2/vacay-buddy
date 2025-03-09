import {Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn} from "typeorm";
import { Team } from "./team";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Team, (team) => team.users, {
    onDelete: 'SET NULL',
    cascade: true,
  })
  @JoinColumn({ name: "team_id" })
  team: Team;
}