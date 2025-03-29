import { DataSource, Repository } from 'typeorm';
import { DEFAULT_TEMPLATE, PtoRequestStatus } from '../constants';
import { PtoApproval } from '../entity/pto-approval.model';
import { PtoRequest } from '../entity/pto-request.model';
import { PtoTemplate } from '../entity/pto-template.model';
import { Organization } from '../entity/organization.model';
import { User } from '../entity/user.model';
import { assert, isSameDay } from '../utils';
import { UserService } from './user.service';

export class PtoService {
  private readonly ptoTemplateRepository: Repository<PtoTemplate>;
  private readonly ptoRequestRepository: Repository<PtoRequest>;
  private readonly ptoApprovalRepository: Repository<PtoApproval>;
  private readonly userService: UserService;
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource, userService: UserService) {
    this.ptoTemplateRepository = dataSource.getRepository(PtoTemplate);
    this.ptoRequestRepository = dataSource.getRepository(PtoRequest);
    this.ptoApprovalRepository = dataSource.getRepository(PtoApproval);
    this.dataSource = dataSource;
    this.userService = userService;
  }

  async getTemplate(id: number): Promise<PtoTemplate> {
    return this.ptoTemplateRepository.findOneByOrFail({ id });
  }

  async getTemplates(organization: Organization): Promise<PtoTemplate[]> {
    return this.ptoTemplateRepository.find({ where: { organization: { id: organization.id } } });
  }

  async upsertTemplate(template: Partial<PtoTemplate>, organization: Organization): Promise<PtoTemplate> {
    if (template.id) {
      return this.updateTemplate(template.id, template);
    }

    return this.createTemplate(template, organization);
  }

  async deleteTemplate(id: number): Promise<void> {
    await this.ptoTemplateRepository.delete(id);
  }

  private async createTemplate(template: Partial<PtoTemplate>, organization: Organization): Promise<PtoTemplate> {
    const newTemplate = this.ptoTemplateRepository.create({
      ...template,
      organization,
    });
    return this.ptoTemplateRepository.save(newTemplate);
  }

  private async updateTemplate(id: number, templateData: Partial<PtoTemplate>): Promise<PtoTemplate> {
    await this.ptoTemplateRepository.update(id, templateData);
    return this.ptoTemplateRepository.findOneByOrFail({ id });
  }

  async createPtoRequest(
    user: User,
    template: PtoTemplate,
    startDate: Date,
    endDate: Date,
    title: string,
    reason: string,
    approvers: User[],
  ): Promise<PtoRequest> {
    assert(approvers.length > 0, 'At least one approver is required for PTO requests');
    assert(startDate <= endDate, 'Start date must be before end date');

    if (template.daysConsumed < 1 && template.daysConsumed > 0) {
      assert(
        isSameDay(startDate, endDate),
        'Start and end date must be the same for templates that consume less than 1 day',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const request = this.ptoRequestRepository.create({
        user,
        template,
        startDate,
        endDate,
        title,
        reason,
        status: PtoRequestStatus.Pending,
      });

      const savedRequest = await manager.save(request);
      const approvals = approvers.map((approver) =>
        this.ptoApprovalRepository.create({
          ptoRequest: savedRequest,
          approver,
          status: PtoRequestStatus.Pending,
        }),
      );

      savedRequest.approvals = await manager.save(approvals);
      savedRequest.currentApprovalId = savedRequest.approvals[0].id;
      await manager.save(savedRequest);
      return savedRequest;
    });
  }

  /**
   * Creates default PTO templates for a organization when it's first created
   * These default templates are provided automatically to every new organization
   */
  async createDefaultPtoTemplates(organization: Organization): Promise<PtoTemplate[]> {
    const defaultTemplatePromises = DEFAULT_TEMPLATE.map((template) => {
      return this.createTemplate(template, organization);
    });

    return Promise.all(defaultTemplatePromises);
  }

  async getApproval(id: number): Promise<PtoApproval> {
    return this.ptoApprovalRepository.findOneOrFail({
      where: { id },
      relations: ['approver'],
    });
  }

  async getApprovalWithRelations(id: number): Promise<PtoApproval> {
    return this.ptoApprovalRepository.findOneOrFail({
      where: { id },
      relations: ['approver', 'ptoRequest', 'ptoRequest.user', 'ptoRequest.approvals', 'ptoRequest.approvals.approver'],
    });
  }

  async getMyPendingPtoRequests(user: User): Promise<PtoRequest[]> {
    return this.ptoRequestRepository.find({
      where: { user: { id: user.id }, status: PtoRequestStatus.Pending },
    });
  }

  async getMyPtoRequests(user: User): Promise<PtoRequest[]> {
    return this.ptoRequestRepository.find({
      where: { user: { id: user.id } },
    });
  }

  private validatePendingApproval(approver: User, approval: PtoApproval): void {
    if (!approver.isAdmin) {
      assert(approver.id === approval.approver.id, 'You are not the approver for this request');
    }

    assert(approval.status === PtoRequestStatus.Pending, 'This request has already been processed');
  }

  /**
   * Approves a PTO request approval.
   * The method validates that the user is the authorized approver and the approval is in pending status.
   * If approved and there are more approvers in the chain, it updates the current approval ID to the next approver.
   * If this is the final approval, it marks the request as approved and updates the user's PTO balance.
   * Returns the refreshed approval entity after processing.
   *
   * @param approver The user attempting to approve the request
   * @param approvalId The ID of the approval to process
   * @param comment Comment provided by the approver
   * @returns The updated approval entity with related data
   * @throws Error if the user is not authorized or the approval is not in pending status
   */
  async approve(approver: User, approvalId: number, comment: string): Promise<PtoApproval> {
    const approval = await this.getApprovalWithRelations(approvalId);
    this.validatePendingApproval(approver, approval);

    const requestApprovals = approval.ptoRequest.approvals;
    const ptoRequest = approval.ptoRequest;

    const nextApproverIndex = requestApprovals.findIndex((a) => a.id === approvalId) + 1;
    if (nextApproverIndex < requestApprovals.length) {
      ptoRequest.currentApprovalId = requestApprovals[nextApproverIndex].id;
    } else {
      // All approvers have approved the request
      ptoRequest.status = PtoRequestStatus.Approved;
      // update user's used PTO days
      await this.userService.updateUser(ptoRequest.user.userId, {
        usedPtoDays: ptoRequest.user.usedPtoDays + ptoRequest.template.daysConsumed,
      });
    }

    await this.ptoRequestRepository.save(ptoRequest);
    approval.status = PtoRequestStatus.Approved;
    approval.comment = comment;
    approval.actionDate = new Date();
    await this.ptoApprovalRepository.save(approval);

    return await this.getApprovalWithRelations(approvalId);
  }

  /**
   * Rejects a PTO request approval.
   * The method validates that the user is the authorized approver and the approval is in pending status.
   * When rejected, the entire PTO request is marked as rejected.
   * Returns the refreshed approval entity after processing.
   *
   * @param approver The user attempting to reject the request
   * @param approvalId The ID of the approval to process
   * @param comment Rejection reason provided by the approver
   * @returns The updated approval entity with related data
   * @throws Error if the user is not authorized or the approval is not in pending status
   */
  async reject(approver: User, approvalId: number, comment: string): Promise<PtoApproval> {
    const approval = await this.getApprovalWithRelations(approvalId);
    this.validatePendingApproval(approver, approval);

    const ptoRequest = approval.ptoRequest;
    ptoRequest.status = PtoRequestStatus.Rejected;
    await this.ptoRequestRepository.save(ptoRequest);

    approval.status = PtoRequestStatus.Rejected;
    approval.comment = comment;
    approval.actionDate = new Date();
    await this.ptoApprovalRepository.save(approval);

    return await this.getApprovalWithRelations(approvalId);
  }

  /**
   * Retrieves pending approvals that the given user needs to review
   * Only returns approvals where the approval ID matches the currentApproverId
   * of the PTO request, as only the next approver in sequence should see the request
   */
  async getPendingApprovalsToReview(approver: User): Promise<PtoApproval[]> {
    const approvals = await this.ptoApprovalRepository.find({
      where: {
        approver: { id: approver.id },
        status: PtoRequestStatus.Pending,
      },
      relations: ['ptoRequest'],
    });

    return approvals.filter((approval) => approval.ptoRequest.currentApprovalId === approval.id);
  }
}
