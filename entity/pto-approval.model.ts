import {Entity, ManyToOne, JoinColumn, Column} from "typeorm";
import {User} from "./user.model";
import {PtoRequest} from "./pto-request.model";
import {BaseEntity} from "./base";
import {PtoRequestStatus} from "../config/constants";

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

  @Column({name: "approver_id"})
  approverId: number;

  @Column({
    type: 'simple-enum',
    enum: PtoRequestStatus,
    default: PtoRequestStatus.Pending
  })
  status: PtoRequestStatus;

  @Column({type: 'text', nullable: true})
  comment: string | null;

  @Column({nullable: true})
  actionDate: Date;
}