import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base';
import { Organization } from './organization.model';

@Entity()
export class User extends BaseEntity {
  @Column()
  userId: string; // TODO : set unique

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

  @Column({ type: 'varchar', nullable: false, length: 30, default: 'Asia/Seoul' })
  tz: string;

  @Column({ type: 'int', nullable: false, default: 32400 })
  tz_offset: number;
}
