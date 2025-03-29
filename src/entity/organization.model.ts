import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base';
import { User } from './user.model';

@Entity()
export class Organization extends BaseEntity {
  @Index()
  @Column()
  organizationId: string;

  @Column({ default: false })
  isEnterprise: boolean;

  @OneToMany(
    () => User,
    (user) => user.organization,
  )
  users: User[];
}
