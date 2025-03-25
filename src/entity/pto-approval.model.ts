import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { PtoRequestStatus } from '../constants';
import { BaseEntity } from './base';
import { PtoRequest } from './pto-request.model';
import { User } from './user.model';

@Entity()
export class PtoApproval extends BaseEntity {
  @ManyToOne(
    () => PtoRequest,
    (request) => request.approvals,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'request_id' })
  ptoRequest: PtoRequest;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'approver_id' })
  approver: User;

  @Column({ name: 'approver_id' })
  approverId: number;

  @Column({
    type: 'simple-enum',
    enum: PtoRequestStatus,
    default: PtoRequestStatus.Pending,
  })
  status: PtoRequestStatus;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @Column({ nullable: true })
  actionDate: Date;
}
