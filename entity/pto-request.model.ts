import {Entity, ManyToOne, JoinColumn, Column, OneToMany} from "typeorm";
import {User} from "./user.model";
import {PtoTemplate} from "./pto-template.model";
import {BaseEntity} from "./base";
import {PtoApproval} from "./pto-approval.model";
import {PtoRequestStatus} from "../config/constants";

@Entity()
export class PtoRequest extends BaseEntity {
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({name: "user_id"})
  user: User;

  @ManyToOne(() => PtoTemplate, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({name: "template_id"})
  template: PtoTemplate;

  @Column({type: 'date'})
  startDate: Date;

  @Column({type: 'date'})
  endDate: Date;

  @Column({type: 'text'})
  reason: string;

  @Column({
    type: 'simple-enum',
    enum: PtoRequestStatus,
    default: 'pending'
  })
  status: PtoRequestStatus;

  // Relationship to track multiple approvers and their decisions
  @OneToMany(() => PtoApproval, approval => approval.ptoRequest)
  approvals: PtoApproval[];
}