import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base';
import { Team } from './team.model';

@Entity()
export class PtoTemplate extends BaseEntity {
  @ManyToOne(
    () => Team,
    (team) => team.users,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @Column()
  title: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  description: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: 'float', default: 1 })
  @Check('days_consumed >= 0 AND days_consumed <= 1')
  daysConsumed: number;
}
