import {Entity, PrimaryGeneratedColumn, Column, Index} from "typeorm";

@Entity()
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: "varchar" })
  team_id: string;

  @Column({ type: "varchar" })
  api_key: string;

  @Column({ type: "varchar" })
  model: string;
}