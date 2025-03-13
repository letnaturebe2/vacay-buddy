import { DataSource, Repository } from "typeorm";
import { PtoTemplate } from "../entity/pto-template.model";
import {PtoRequest} from "../entity/pto-request.model";
import { PtoApproval } from "../entity/pto-approval.model";
import { User } from "../entity/user.model";
import { Team } from "../entity/team.model";
import {UserService} from "./user.service";
import {PtoRequestStatus} from "../config/constants";

export class PtoService {
  private ptoTemplateRepository: Repository<PtoTemplate>;
  private ptoRequestRepository: Repository<PtoRequest>;
  private ptoApprovalRepository: Repository<PtoApproval>;
  private userService: UserService;

  constructor(dataSource: DataSource, userService: UserService) {
    this.ptoTemplateRepository = dataSource.getRepository(PtoTemplate);
    this.ptoRequestRepository = dataSource.getRepository(PtoRequest);
    this.ptoApprovalRepository = dataSource.getRepository(PtoApproval);
    this.userService = userService;
  }

  async getTemplates(team: Team, enabledOnly = true): Promise<PtoTemplate[]> {
    const query = { team };
    if (enabledOnly) {
      Object.assign(query, { enabled: true });
    }
    return this.ptoTemplateRepository.find({ where: query });
  }

  async createTemplate(template: Partial<PtoTemplate>, team: Team): Promise<PtoTemplate> {
    const newTemplate = this.ptoTemplateRepository.create({
      ...template,
      team
    });
    return this.ptoTemplateRepository.save(newTemplate);
  }

  async updateTemplate(id: number, templateData: Partial<PtoTemplate>): Promise<PtoTemplate> {
    await this.ptoTemplateRepository.update(id, templateData);
    return this.ptoTemplateRepository.findOneByOrFail({ id });
  }

  async createPtoRequest(
    user: User,
    template: PtoTemplate,
    startDate: Date,
    endDate: Date,
    reason: string
  ): Promise<PtoRequest> {
    const request = this.ptoRequestRepository.create({
      user,
      template,
      startDate,
      endDate,
      reason,
      status: PtoRequestStatus.Pending
    });

    return this.ptoRequestRepository.save(request);
  }

  async getPtoRequests(user: User, status?: PtoRequestStatus): Promise<PtoRequest[]> {
    const query: any = { user };
    if (status) {
      query.status = status;
    }

    return this.ptoRequestRepository.find({
      where: query,
      relations: ['template', 'approvals', 'approvals.approver']
    });
  }

  async getPendingApprovalsForApprover(approver: User): Promise<PtoApproval[]> {
    return this.ptoApprovalRepository.find({
      where: {
        approver,
        status: PtoRequestStatus.Pending
      },
      relations: ['ptoRequest', 'ptoRequest.user']
    });
  }

  async getOverlappingRequests(
    teamId: string,
    startDate: Date,
    endDate: Date,
    excludeRequestId?: string
  ): Promise<PtoRequest[]> {
    // Find users in the team with overlapping PTO requests
    const queryBuilder = this.ptoRequestRepository
      .createQueryBuilder('request')
      .innerJoinAndSelect('request.user', 'user')
      .innerJoinAndSelect('user.team', 'team')
      .where('team.id = :teamId', { teamId })
      .andWhere(
        '(request.startDate <= :endDate AND request.endDate >= :startDate)',
        { startDate, endDate }
      )
      .andWhere('request.status != :rejectedStatus', { rejectedStatus: 'rejected' });

    if (excludeRequestId) {
      queryBuilder.andWhere('request.id != :excludeRequestId', { excludeRequestId });
    }

    return queryBuilder.getMany();
  }

  // Approval methods
  async assignApprovers(ptoRequest: PtoRequest, approvers: User[]): Promise<PtoApproval[]> {
    const approvals = approvers.map(approver =>
      this.ptoApprovalRepository.create({
        ptoRequest,
        approver,
        status: PtoRequestStatus.Pending
      })
    );

    return this.ptoApprovalRepository.save(approvals);
  }

  async updateApproval(
    approvalId: number,
    status: PtoRequestStatus.Approved | PtoRequestStatus.Rejected,
    comment?: string
  ): Promise<PtoApproval> {
    const approval = await this.ptoApprovalRepository.findOneByOrFail({ id: approvalId });

    approval.status = status;
    approval.comment = comment || null;
    approval.actionDate = new Date();

    await this.ptoApprovalRepository.save(approval);

    // Check if we need to update the request status
    await this.updateRequestStatusBasedOnApprovals(approval.ptoRequest.id);

    return approval;
  }

  private async updateRequestStatusBasedOnApprovals(requestId: number): Promise<void> {
    const request = await this.ptoRequestRepository.findOne({
      where: { id: requestId },
      relations: ['approvals']
    });

    if (!request) return;

    const approvals = request.approvals || [];

    // If any rejection exists, request is rejected
    if (approvals.some(a => a.status === PtoRequestStatus.Rejected)) {
      request.status = PtoRequestStatus.Rejected;
    }
    // If all approvals are approved, request is approved
    else if (approvals.length > 0 && approvals.every(a => a.status === PtoRequestStatus.Approved)) {
      request.status = PtoRequestStatus.Approved;
    }
    // Otherwise it stays pending

    await this.ptoRequestRepository.save(request);
  }
}