import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base';
import { Team } from './team.model';

@Entity()
export class User extends BaseEntity {
  @Index()
  @Column()
  userId: string;

  @ManyToOne(
    () => Team,
    (team) => team.users,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  name: string | null;

  @Column({ type: 'float', default: 15 })
  annualPtoDays: number;

  @Column({ type: 'float', default: 0 })
  usedPtoDays: number;
}
