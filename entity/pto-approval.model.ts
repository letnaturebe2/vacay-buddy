import {Entity, ManyToOne, JoinColumn, Column} from "typeorm";
import {User} from "./user.model";
import {PtoRequest} from "./pto-request.model";
import {BaseEntity} from "./base";

@Entity()
export class PtoApproval extends BaseEntity {
  @ManyToOne(() => PtoRequest, request => request.approvals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({name: "request_id"})
  ptoRequest: PtoRequest;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({name: "approver_id"})
  approver: User;

  @Column({
    type: 'simple-enum',
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  })
  status: 'pending' | 'approved' | 'rejected';

  @Column({nullable: true})
  comment: string;

  @Column({nullable: true})
  actionDate: Date;
}