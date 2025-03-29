import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base';
import { Organization } from './organization.model';

@Entity()
export class PtoTemplate extends BaseEntity {
  @ManyToOne(
    () => Organization,
    (organization) => organization.users,
    {
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

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
