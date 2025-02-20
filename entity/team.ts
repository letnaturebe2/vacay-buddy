import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  team_id: string;

  @Column({ type: "varchar" })
  api_key: string;
}