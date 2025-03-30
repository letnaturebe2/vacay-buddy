import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base';
import { Organization } from './organization.model';

@Entity()
export class User extends BaseEntity {
  @Index()
  @Column()
  userId: string;

  @ManyToOne(
    () => Organization,
    (organization) => organization.users,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ type: 'varchar', nullable: true, length: 255 })
  name: string | null;

  @Column({ type: 'float', default: 15 })
  annualPtoDays: number;

  @Column({ type: 'float', default: 0 })
  usedPtoDays: number;
}
