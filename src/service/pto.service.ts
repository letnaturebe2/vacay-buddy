import { endOfMonth, startOfMonth } from 'date-fns';
import { DataSource, EntityManager, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { PtoRequestStatus } from '../constants';
import { Organization } from '../entity/organization.model';
import { PtoApproval } from '../entity/pto-approval.model';
import { PtoRequest } from '../entity/pto-request.model';
import { PtoTemplate } from '../entity/pto-template.model';
import { User } from '../entity/user.model';
import { logBusinessEvent } from '../logger';
import { UserWithRequests } from '../types';
import { assert, assert400, getDefaultTemplates, isSameDay } from '../utils';
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
    return this.ptoTemplateRepository.find({
      where: { organization: { id: organization.id } },
      order: { daysConsumed: 'DESC' },
    });
  }

  async upsertTemplate(template: Partial<PtoTemplate>, organization: Organization): Promise<PtoTemplate> {
    if (template.id) {
      return this.updateTemplate(template.id, template);
    }

    return this.createTemplate(template, organization);
  }

  async deleteTemplate(id: number): Promise<void> {
    await this.ptoTemplateRepository.softDelete(id);
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

      logBusinessEvent('PTO request created', {
        requestId: savedRequest.id,
        userId: user.userId,
        userName: user.name,
      });

      return savedRequest;
    });
  }

  /**
   * Creates default PTO templates for a organization when it's first created
   * These default templates are provided automatically to every new organization
   */
  async createDefaultPtoTemplates(locale: string, organization: Organization): Promise<PtoTemplate[]> {
    const templates = getDefaultTemplates(locale);
    const defaultTemplatePromises = templates.map((template) => {
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

  async getApprovalWithRelations(id: number, manager?: EntityManager): Promise<PtoApproval> {
    const repository = manager ? manager.getRepository(PtoApproval) : this.ptoApprovalRepository;

    return repository.findOneOrFail({
      where: { id },
      relations: ['approver', 'ptoRequest', 'ptoRequest.user', 'ptoRequest.approvals', 'ptoRequest.approvals.approver'],
    });
  }

  async getApprovalOrNullWithRelations(id: number): Promise<PtoApproval | null> {
    return this.ptoApprovalRepository.findOne({
      where: { id },
      relations: ['approver', 'ptoRequest', 'ptoRequest.user', 'ptoRequest.approvals', 'ptoRequest.approvals.approver'],
    });
  }

  async getMyPendingPtoRequests(user: User): Promise<PtoRequest[]> {
    return this.ptoRequestRepository.find({
      where: { user: { id: user.id }, status: PtoRequestStatus.Pending },
    });
  }

  async getOrganizationPtoRequestsMonthly(
    organizationId: string,
    year?: number,
    month?: number,
  ): Promise<PtoRequest[]> {
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth();

    const startMonth = startOfMonth(new Date(targetYear, targetMonth));
    const endMonth = endOfMonth(new Date(targetYear, targetMonth));

    return this.ptoRequestRepository.find({
      where: {
        user: { organization: { organizationId } },
        startDate: LessThanOrEqual(endMonth),
        endDate: MoreThanOrEqual(startMonth),
      },
      relations: ['user', 'template'],
      order: {
        startDate: 'ASC',
      },
    });
  }

  async getMyPtoRequests(user: User): Promise<PtoRequest[]> {
    return this.ptoRequestRepository.find({
      where: { user: { id: user.id } },
      order: {
        startDate: 'DESC',
      },
      withDeleted: true,
    });
  }

  async getPendingRequests(): Promise<Map<number, UserWithRequests>> {
    const requestsByPendingApprover = new Map<number, UserWithRequests>();
    const pendingRequests = await this.ptoRequestRepository
      .createQueryBuilder('request')
      .innerJoinAndSelect('request.approvals', 'approval')
      .innerJoinAndSelect('approval.approver', 'approver')
      .innerJoinAndSelect('approver.organization', 'organization')
      .where('request.status = :status', { status: PtoRequestStatus.Pending })
      .andWhere('organization.deletedAt IS NULL')
      .getMany();

    for (const request of pendingRequests) {
      const currentApproval = request.approvals.find((approval) => approval.id === request.currentApprovalId);
      assert(currentApproval !== undefined, 'Current approval must exist for pending request');

      const approver = currentApproval.approver;
      const approverId = approver.id;

      if (!requestsByPendingApprover.has(approverId)) {
        requestsByPendingApprover.set(approverId, {
          user: approver,
          requests: [],
        });
      }

      const userWithRequests = requestsByPendingApprover.get(approverId);
      assert(userWithRequests !== undefined, 'User with requests must exist');
      userWithRequests.requests.push(request);
    }

    return requestsByPendingApprover;
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
    return this.dataSource.transaction(async (manager) => {
      const approval = await this.getApprovalWithRelations(approvalId, manager);
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
        await this.userService.updateUser(
          ptoRequest.user.userId,
          {
            usedPtoDays: ptoRequest.user.usedPtoDays + ptoRequest.consumedDays,
          },
          manager,
        );
      }

      await manager.save(ptoRequest);
      approval.status = PtoRequestStatus.Approved;
      approval.comment = comment;
      approval.actionDate = new Date();
      await manager.save(approval);

      logBusinessEvent('PTO approval decision', {
        action: 'approved',
        approvalId: approval.id,
        requestId: ptoRequest.id,
        approverId: approver.userId,
        approverName: approver.name,
      });

      return await this.getApprovalWithRelations(approvalId, manager);
    });
  }

  /**
   * Rejects a PTO request approval.
   * The method validates that the user is the authorized approver and the approval is in pending status.
   * When rejected, the entire PTO request is marked as rejected and all pending approvals are also rejected.
   * Returns the refreshed approval entity after processing.
   *
   * @param approver The user attempting to reject the request
   * @param approvalId The ID of the approval to process
   * @param comment Rejection reason provided by the approver
   * @returns The updated approval entity with related data
   * @throws Error if the user is not authorized or the approval is not in pending status
   */
  async reject(approver: User, approvalId: number, comment: string): Promise<PtoApproval> {
    return this.dataSource.transaction(async (manager) => {
      const approval = await this.getApprovalWithRelations(approvalId, manager);
      this.validatePendingApproval(approver, approval);

      const ptoRequest = approval.ptoRequest;
      ptoRequest.status = PtoRequestStatus.Rejected;
      await manager.save(ptoRequest);

      // Update the current approval with rejection details
      approval.status = PtoRequestStatus.Rejected;
      approval.comment = comment;
      approval.actionDate = new Date();
      await manager.save(approval);

      // Mark all other pending approvals as rejected
      const pendingApprovals = ptoRequest.approvals.filter(
        (a) => a.id !== approvalId && a.status === PtoRequestStatus.Pending,
      );

      if (pendingApprovals.length > 0) {
        const pendingApprovalIds = pendingApprovals.map((a) => a.id);
        await manager.update(PtoApproval, pendingApprovalIds, {
          status: PtoRequestStatus.Rejected,
          actionDate: new Date(),
        });
      }

      return await this.getApprovalWithRelations(approvalId, manager);
    });
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

  /**
   * Retrieves a single PTO request by ID with related data
   */
  async getPtoRequest(id: number): Promise<PtoRequest | null> {
    return this.ptoRequestRepository.findOne({
      where: { id },
      relations: ['user', 'template', 'approvals', 'approvals.approver'],
    });
  }

  /**
   * Soft deletes a PTO request by ID and all related approvals
   */
  async deletePtoRequest(id: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // First, soft delete all related approvals
      await manager.update(PtoApproval, { ptoRequest: { id } }, { deletedAt: new Date() });

      // Then, soft delete the PTO request
      await manager.softDelete(PtoRequest, id);
    });
  }

  /**
   * Soft deletes a PTO request and updates user's PTO days if the request was approved
   * This method ensures both operations happen atomically within a single transaction
   */
  async deletePtoRequestWithUserUpdate(id: number): Promise<{ decrementedDays: number }> {
    return this.dataSource.transaction(async (manager) => {
      // Get the PTO request with user data
      const ptoRequest = await manager.findOne(PtoRequest, {
        where: { id },
        relations: ['user'],
      });

      assert400(ptoRequest !== null, '연차 요청을 찾을 수 없습니다.');

      const user = ptoRequest.user;
      let decrementedDays = 0;

      // If the request was approved, decrement the user's used PTO days
      if (ptoRequest.status === PtoRequestStatus.Approved) {
        decrementedDays = ptoRequest.consumedDays;
        let newUsedDays = Math.max(0, user.usedPtoDays - ptoRequest.consumedDays);
        // Ensure it doesn't exceed total PTO days
        newUsedDays = Math.min(newUsedDays, user.annualPtoDays);
        await this.userService.updateUser(user.userId, { usedPtoDays: newUsedDays }, manager);
      }

      // Soft delete all related approvals
      await manager.update(PtoApproval, { ptoRequest: { id } }, { deletedAt: new Date() });

      // Soft delete the PTO request
      await manager.softDelete(PtoRequest, id);

      logBusinessEvent('PTO request deleted', {
        requestId: id,
        userId: user.userId,
        userName: user.name,
      });

      return { decrementedDays };
    });
  }
}
