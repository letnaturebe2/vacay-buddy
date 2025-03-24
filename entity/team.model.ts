import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base';
import { User } from './user.model';

@Entity()
export class Team extends BaseEntity {
  @Index()
  @Column()
  teamId: string;

  @OneToMany(
    () => User,
    (user) => user.team,
  )
  users: User[];
}
