import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { PtoRequestStatus } from '../src/config/constants';
import { BaseEntity } from './base';
import { PtoApproval } from './pto-approval.model';
import { PtoTemplate } from './pto-template.model';
import { User } from './user.model';

@Entity()
export class PtoRequest extends BaseEntity {
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => PtoTemplate, {
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({ name: 'template_id' })
  template: PtoTemplate;

  @Column({
    type: 'date',
    transformer: {
      from: (value: string | Date) => (value instanceof Date ? value : new Date(value)),
      to: (value: Date) => value,
    },
  })
  startDate: Date;

  @Column({
    type: 'date',
    transformer: {
      from: (value: string | Date) => (value instanceof Date ? value : new Date(value)),
      to: (value: Date) => value,
    },
  })
  endDate: Date;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'simple-enum',
    enum: PtoRequestStatus,
    default: 'pending',
  })
  status: PtoRequestStatus;

  @OneToMany(
    () => PtoApproval,
    (approval) => approval.ptoRequest,
  )
  approvals: PtoApproval[];

  @Column({ type: 'integer', nullable: true })
  currentApprovalId: number | null;

  get consumedDays(): number {
    const daysDifference = Math.floor((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return daysDifference * this.template.daysConsumed;
  }
}
