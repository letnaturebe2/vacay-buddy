import { Installation } from '@slack/bolt';
import { Column, DeleteDateColumn, Entity, Index, OneToMany } from 'typeorm';
import { assert } from '../utils';
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

  @Column({ type: 'text', nullable: true })
  installation: string;

  @DeleteDateColumn()
  deletedAt?: Date | null;

  get appId(): string {
    const installation: Installation = JSON.parse(this.installation);
    assert(installation.appId !== undefined, 'App ID is undefined');
    return installation.appId;
  }

  get botToken(): string {
    const installation: Installation = JSON.parse(this.installation);
    assert(installation.bot?.token !== undefined, 'Bot token is undefined');
    return installation.bot.token;
  }
}
