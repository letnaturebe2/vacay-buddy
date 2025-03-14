import {DataSource, Repository} from "typeorm";
import {PtoTemplate} from "../entity/pto-template.model";
import {PtoRequest} from "../entity/pto-request.model";
import {PtoApproval} from "../entity/pto-approval.model";
import {User} from "../entity/user.model";
import {Team} from "../entity/team.model";
import {PtoRequestStatus} from "../config/constants";
import {assert} from "../config/utils";

export class PtoService {
  private readonly ptoTemplateRepository: Repository<PtoTemplate>;
  private readonly ptoRequestRepository: Repository<PtoRequest>;
  private readonly ptoApprovalRepository: Repository<PtoApproval>;
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.ptoTemplateRepository = dataSource.getRepository(PtoTemplate);
    this.ptoRequestRepository = dataSource.getRepository(PtoRequest);
    this.ptoApprovalRepository = dataSource.getRepository(PtoApproval);
    this.dataSource = dataSource;
  }

  async getTemplates(team: Team): Promise<PtoTemplate[]> {
    return this.ptoTemplateRepository.find({where: {team: {id: team.id}}});
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
    return this.ptoTemplateRepository.findOneByOrFail({id});
  }

  async createPtoRequest(
    user: User,
    template: PtoTemplate,
    startDate: Date,
    endDate: Date,
    reason: string,
    approvers: User[]
  ): Promise<PtoRequest> {
    assert(approvers.length > 0, 'At least one approver is required for PTO requests');
    assert(startDate <= endDate, 'Start date must be before end date');

    return this.dataSource.transaction(async (manager) => {
      const request = this.ptoRequestRepository.create({
        user,
        template,
        startDate,
        endDate,
        reason,
        status: PtoRequestStatus.Pending,
      });

      const savedRequest = await manager.save(request);
      const approvals = approvers.map((approver) =>
        this.ptoApprovalRepository.create({
          ptoRequest: savedRequest,
          approver,
          status: PtoRequestStatus.Pending,
        })
      );

      savedRequest.approvals = await manager.save(approvals);
      savedRequest.currentApproverId = savedRequest.approvals[0].id;
      await manager.save(savedRequest);
      return savedRequest;
    });
  }

  async getOwnedPtoRequests(user: User): Promise<PtoRequest[]> {
    return this.ptoRequestRepository.find({
      where: {user: {id: user.id}},
      relations: ['user', 'template', 'approvals', 'approvals.approver']
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
        approver: {id: approver.id},
        status: PtoRequestStatus.Pending
      },
      relations: ['approver', 'ptoRequest', 'ptoRequest.user']
    });

    return approvals.filter(approval => approval.ptoRequest.currentApproverId === approval.id);
  }
}