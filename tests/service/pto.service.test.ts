import {Repository} from "typeorm";
import {testDataSource} from "../config/test-db";
import {PtoService} from "../../src/service/pto.service";
import {PtoTemplate} from "../../src/entity/pto-template.model";
import {PtoRequest} from "../../src/entity/pto-request.model";
import {PtoApproval} from "../../src/entity/pto-approval.model";
import {User} from "../../src/entity/user.model";
import {Organization} from "../../src/entity/organization.model";
import {PtoRequestStatus} from "../../src/constants";
import {UserService} from "../../src/service/user.service";
import {OrganizationService} from "../../src/service/organization.service";
import {getDefaultTemplates} from "../../src/utils";
import {
  createOrganization,
  createUser,
  createPtoTemplate,
  getRepositories,
  getServices,
  clearAllTestData,
  ensureTestDatabaseInitialized
} from "../config/test-utils";

describe("PtoService Tests", () => {
  let organizationService: OrganizationService;
  let userService: UserService;
  let ptoService: PtoService;
  let ptoTemplateRepository: Repository<PtoTemplate>;
  let ptoRequestRepository: Repository<PtoRequest>;
  let ptoApprovalRepository: Repository<PtoApproval>;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;

  beforeAll(async () => {
    // 데이터베이스가 초기화되어 있는지 확인 (setup.ts에서 이미 초기화됨)
    await ensureTestDatabaseInitialized();
    
    const repositories = getRepositories();
    const services = getServices();
    
    ptoTemplateRepository = repositories.ptoTemplateRepository;
    ptoRequestRepository = repositories.ptoRequestRepository;
    ptoApprovalRepository = repositories.ptoApprovalRepository;
    userRepository = repositories.userRepository;
    organizationRepository = repositories.organizationRepository;

    userService = services.userService;
    organizationService = services.organizationService;
    ptoService = new PtoService(testDataSource, userService);
  });

  beforeEach(async () => {
    await clearAllTestData();
  });

  describe("createTemplate", () => {
    test("should create a new PTO template with all fields", async () => {
      // Arrange
      const organization = await createOrganization();
      const templateData: Partial<PtoTemplate> = {
        title: "Vacation",
        description: "Annual vacation template",
        content: "📋 Leave Request Details: \n - Reason:",
        enabled: true,
      };

      // Act
      const result = await ptoService.upsertTemplate(templateData, organization);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe(templateData.title);
      expect(result.description).toBe(templateData.description);
      expect(result.content).toBe(templateData.content);
      expect(result.enabled).toBe(templateData.enabled);
      expect(result.organization.organizationId).toBe("test-organization");
      expect(result.daysConsumed).toBe(1);

      const savedTemplates = await ptoService.getTemplates(organization);
      expect(savedTemplates).toHaveLength(1);
      expect(savedTemplates[0].title).toEqual(templateData.title);
    });
  });

  describe("createDefaultPtoTemplates", () => {
    test("should create default PTO templates for a new organization", async () => {
      // Arrange
      const organization = await createOrganization("new-organization");
      const defaultTemplates = getDefaultTemplates("en-US");

      // Act
      const templates = await ptoService.createDefaultPtoTemplates('en-US', organization);

      // Assert
      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      // Verify the templates were actually persisted
      const savedTemplates = await ptoService.getTemplates(organization);
      expect(savedTemplates.length).toBe(templates.length);

      // Check that default templates match the templates defined in DEFAULT_TEMPLATE
      expect(templates.length).toBe(defaultTemplates.length);

      // Verify properties of the created templates
      templates.forEach((template, index) => {
        expect(template.id).toBeDefined();
        expect(template.organization.organizationId).toBe("new-organization");
        expect(template.title).toBe(defaultTemplates[index].title);
        expect(template.content).toBe(defaultTemplates[index].content);
        expect(template.description).toBe(defaultTemplates[index].description);
      });
    });
  });

  describe("updateTemplate", () => {
    test("should update an existing PTO template", async () => {
      // Arrange
      const organization = await createOrganization();
      const template = await createPtoTemplate(organization);

      const updateData: Partial<PtoTemplate> = {
        id: template.id,
        title: "New Name",
        description: "New description",
        content: "New content",
        enabled: false,
        daysConsumed: 0.5
      };

      // Act
      const result = await ptoService.upsertTemplate(updateData, organization);

      // Assert
      expect(result.title).toBe(updateData.title);
      expect(result.description).toBe(updateData.description);
      expect(result.content).toBe(updateData.content);
      expect(result.enabled).toBe(updateData.enabled);
      expect(result.daysConsumed).toBe(0.5);
    });
  });

  describe("deleteTemplate", () => {
    test("should soft delete a PTO template", async () => {
      // Arrange
      const organization = await createOrganization();
      const template = await createPtoTemplate(organization);

      // Verify template exists before deletion
      const templatesBeforeDelete = await ptoService.getTemplates(organization);
      expect(templatesBeforeDelete).toHaveLength(1);

      // Act
      await ptoService.deleteTemplate(template.id);

      // Assert
      const templatesAfterDelete = await ptoService.getTemplates(organization);
      expect(templatesAfterDelete).toHaveLength(0);

      // Verify template is soft deleted (not hard deleted)
      const softDeletedTemplate = await ptoTemplateRepository.findOne({
        where: { id: template.id },
        withDeleted: true
      });
      expect(softDeletedTemplate).toBeDefined();
      expect(softDeletedTemplate?.deletedAt).toBeDefined();
    });

    test("should preserve template_id in PTO requests after template deletion", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      // Create PTO request
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-01"),
        "Vacation time",
        "Vacation time",
        [approver]
      );

      // Approve the request
      const approval = ptoRequest.approvals[0];
      await ptoService.approve(approver, approval.id, "Approved");

      // Act - Delete the template
      await ptoService.deleteTemplate(template.id);

      // Assert - Verify that template_id foreign key is preserved in the database
      const rawPtoRequest = await ptoRequestRepository
        .createQueryBuilder('ptoRequest')
        .select(['ptoRequest.id', 'ptoRequest.template_id'])
        .where('ptoRequest.id = :id', { id: ptoRequest.id })
        .getRawOne();
      
      expect(rawPtoRequest?.template_id).toBe(template.id);
      expect(rawPtoRequest?.template_id).not.toBeNull();
      
      // Verify the template is soft deleted but still exists in database
      const templateWithDeleted = await ptoTemplateRepository.findOne({
        where: { id: template.id },
        withDeleted: true
      });
      expect(templateWithDeleted?.deletedAt).toBeDefined();
      expect(templateWithDeleted?.id).toBe(template.id);
      
      // Verify template is not accessible through normal queries
      const normalTemplate = await ptoTemplateRepository.findOne({
        where: { id: template.id }
      });
      expect(normalTemplate).toBeNull();
    });
  });

  describe("onGoing getter", () => {
    test("should return true for approved requests within date range", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);
      
      // Create a request for today
      const today = new Date();
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        today,
        today,
        "Today vacation",
        "Vacation today",
        [approver]
      );

      // Assert - Initially onGoing should be false
      expect(ptoRequest.onGoing).toBe(false);

      // Approve the request
      const approval = ptoRequest.approvals[0];
      await ptoService.approve(approver, approval.id, "Approved");

      // Act - Refresh the request from database
      const updatedRequest = await ptoRequestRepository.findOneOrFail({
        where: { id: ptoRequest.id },
        relations: ['template']
      });

      // Assert
      expect(updatedRequest.onGoing).toBe(true);
    });

    test("should return false for pending requests even within date range", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);
      
      // Create a pending request for today
      const today = new Date();
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        today,
        today,
        "Today vacation",
        "Vacation today",
        [approver]
      );

      // Act
      expect(ptoRequest.onGoing).toBe(false);
    });

    test("should return false for rejected requests even within date range", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);
      
      // Create a request for today
      const today = new Date();
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        today,
        today,
        "Today vacation",
        "Vacation today",
        [approver]
      );

      // Reject the request
      const approval = ptoRequest.approvals[0];
      await ptoService.reject(approver, approval.id, "Rejected");

      // Act - Refresh the request from database
      const updatedRequest = await ptoRequestRepository.findOneOrFail({
        where: { id: ptoRequest.id },
        relations: ['template']
      });

      // Assert
      expect(updatedRequest.onGoing).toBe(false);
    });

    test("should return false for approved requests outside date range", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);
      
      // Create a request for next week
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        nextWeek,
        nextWeek,
        "Future vacation",
        "Vacation next week",
        [approver]
      );

      // Approve the request
      const approval = ptoRequest.approvals[0];
      await ptoService.approve(approver, approval.id, "Approved");

      // Act - Refresh the request from database
      const updatedRequest = await ptoRequestRepository.findOneOrFail({
        where: { id: ptoRequest.id },
        relations: ['template']
      });

      // Assert
      expect(updatedRequest.onGoing).toBe(false);
    });

    test("should return false for approved requests in the past", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);
      
      // Create a request for last week
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        lastWeek,
        lastWeek,
        "Past vacation",
        "Vacation last week",
        [approver]
      );

      // Approve the request
      const approval = ptoRequest.approvals[0];
      await ptoService.approve(approver, approval.id, "Approved");

      // Act - Refresh the request from database
      const updatedRequest = await ptoRequestRepository.findOneOrFail({
        where: { id: ptoRequest.id },
        relations: ['template']
      });

      // Assert
      expect(updatedRequest.onGoing).toBe(false);
    });
  });

  describe("createPtoRequest", () => {
    test("should create a PTO request with approvals", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-01");

      // Act
      const request = await ptoService.createPtoRequest(
        user,
        template,
        startDate,
        endDate,
        "Vacation time",
        "Vacation time",
        [approver]
      );

      // Assert
      expect(request).toBeDefined();
      expect(request.user.userId).toBe("test-user");
      expect(request.status).toBe(PtoRequestStatus.Pending);
      expect(request.startDate).toEqual(startDate);
      expect(request.endDate).toEqual(endDate);
      expect(request.title).toBe("Vacation time");
      expect(request.reason).toBe("Vacation time");
      expect(request.approvals).toHaveLength(1);
      expect(request.approvals[0].approver.userId).toBe("approver");
      expect(request.currentApprovalId).toBe(request.approvals[0].id);
      expect(request.template.title).toBe("Vacation");
      expect(request.consumedDays).toBe(1);
    });

    test("should create PTO request with daysConsumed=0 template", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization, {daysConsumed: 0});
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-10");

      // Act
      const request = await ptoService.createPtoRequest(
        user,
        template,
        startDate,
        endDate,
        "Non-working day",
        "Non-working day request",
        [approver]
      );

      // Assert
      expect(request).toBeDefined();
      expect(request.user.userId).toBe("test-user");
      expect(request.status).toBe(PtoRequestStatus.Pending);
      expect(request.startDate).toEqual(startDate);
      expect(request.endDate).toEqual(endDate);
      expect(request.title).toBe("Non-working day");
      expect(request.consumedDays).toBe(0);
    });

    test("should throw error if no approvers provided", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user");
      const template = await createPtoTemplate(organization);

      // Act & Assert
      await expect(
        ptoService.createPtoRequest(user, template, new Date(), new Date(), "Title", "Reason", [])
      ).rejects.toThrow("At least one approver is required for PTO requests");
    });

    test("should throw error if startDate is after endDate", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user");
      const approver = await createUser("approver");
      const template = await createPtoTemplate(organization);

      let startDate = new Date("2025-04-05");
      let endDate = new Date("2025-04-01");

      // Act & Assert
      await expect(
        ptoService.createPtoRequest(user, template, startDate, endDate, "Title", "Reason", [approver])
      ).rejects.toThrow("Start date must be before end date");

      // Arrange
      startDate = new Date("2025-04-01");
      endDate = new Date("2025-04-01");

      // Act
      const result = await ptoService.createPtoRequest
      (user, template, startDate, endDate, "Title", "Reason", [approver]);

      // Assert : same date is valid
      expect(result).toBeDefined();
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
    });

    test("should throw error when using half-day template with different start and end dates", async () => {      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user");
      const approver = await createUser("approver");
      const template = await createPtoTemplate(organization, {daysConsumed: 0.5}); // Half-day template

      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-02"); // Different date

      // Act & Assert
      await expect(
        ptoService.createPtoRequest(user, template, startDate, endDate, "Half-day PTO", "Taking half day", [approver])
      ).rejects.toThrow("Start and end date must be the same for templates that consume less than 1 day");

      // Act
      const result = await ptoService.createPtoRequest(
        user, template, startDate, new Date("2025-04-01"), "Half-day PTO", "Taking half day", [approver]);
      expect(result.consumedDays).toBe(0.5);
    });

  });

  describe("getPtoRequests", () => {
    test("should return PTO requests for a user", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-05");

      await ptoService.createPtoRequest(
        user,
        template,
        startDate,
        endDate,
        "Vacation time",
        "Vacation time",
        [approver]
      );

      // Act
      const requests = await ptoService.getMyPtoRequests(user);

      // Assert
      expect(requests).toHaveLength(1);
      const ptoRequest = requests[0];
      expect(ptoRequest.status).toBe(PtoRequestStatus.Pending);
      expect(ptoRequest.currentApprovalId).not.toBeNull();
    });

  });

  describe("getPendingApprovalsToReview", () => {
    test("should return pending approvals for an approver", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-05");

      await ptoService.createPtoRequest(
        user,
        template,
        startDate,
        endDate,
        "Vacation time",
        "Vacation time",
        [approver]
      );

      // Act
      const approvals = await ptoService.getPendingApprovalsToReview(approver);

      // Assert
      expect(approvals).toHaveLength(1);
      expect(approvals[0].status).toBe(PtoRequestStatus.Pending);
    });

    test("should only show requests to the current approver in the sequence", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("requester", organization);
      const approver1 = await createUser("approver1", organization);
      const approver2 = await createUser("approver2", organization);
      const approver3 = await createUser("approver3", organization);
      const template = await createPtoTemplate(organization);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        "Vacation time",
        [approver1, approver2, approver3]
      );

      // Act
      const approver1Approvals = await ptoService.getPendingApprovalsToReview(approver1);
      const approver2Approvals = await ptoService.getPendingApprovalsToReview(approver2);
      const approver3Approvals = await ptoService.getPendingApprovalsToReview(approver3);

      // Assert
      expect(approver1Approvals).toHaveLength(1);
      expect(approver2Approvals).toHaveLength(0);
      expect(approver3Approvals).toHaveLength(0);
      expect(ptoRequest.currentApprovalId).toBe(approver1Approvals[0].id);
    });

    test("should show request to next approver after current approver approves", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("requester", organization);
      const approver1 = await createUser("approver1", organization);
      const approver2 = await createUser("approver2", organization);
      const approver3 = await createUser("approver3", organization);
      const template = await createPtoTemplate(organization);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        "Vacation time",
        [approver1, approver2, approver3]
      );

      const firstApproval = ptoRequest.approvals.find(a => a.approver.userId === "approver1")!;
      await ptoService.approve(approver1, firstApproval.id, "Approved");

      // Act
      const approver1Requests = await ptoService.getPendingApprovalsToReview(approver1);
      const approver2Requests = await ptoService.getPendingApprovalsToReview(approver2);
      const approver3Requests = await ptoService.getPendingApprovalsToReview(approver3);

      // Assert
      expect(approver1Requests).toHaveLength(0);
      expect(approver2Requests).toHaveLength(1);
      expect(approver3Requests).toHaveLength(0);

      // Act
      const secondApproval = ptoRequest.approvals.find(a => a.approver.userId === "approver2")!;
      await ptoService.approve(approver2, secondApproval.id, "Approved");

      // Assert
      const approver2RequestsAfterApproval = await ptoService.getPendingApprovalsToReview(approver2);
      const approver3RequestsAfterSecondApproval = await ptoService.getPendingApprovalsToReview(approver3);
      expect(approver2RequestsAfterApproval).toHaveLength(0);
      expect(approver3RequestsAfterSecondApproval).toHaveLength(1);
    });
  });

  describe("approve", () => {
    test("should approve a request and move to next approver", async () => {
      // Arrange
      const organization = await createOrganization();
      let user = await createUser("requester", organization);
      const approver1 = await createUser("approver1", organization);
      const approver2 = await createUser("approver2", organization);
      const template = await createPtoTemplate(organization);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        "Vacation time",
        [approver1, approver2]
      );

      const firstApproval = ptoRequest.approvals.find(a => a.approver.userId === "approver1")!;

      // Act
      const approval = await ptoService.approve(approver1, firstApproval.id, "Approved");

      // Assert
      expect(approval.status).toBe(PtoRequestStatus.Approved);
      expect(approval.comment).toBe("Approved");
      expect(approval.actionDate).toBeDefined();

      const secondApprovalId = ptoRequest.approvals
        .find(a => a.approver.userId === "approver2")!.id;
      expect(approval.ptoRequest.currentApprovalId).toBe(secondApprovalId);
      expect(approval.ptoRequest.status).toBe(PtoRequestStatus.Pending);

      user = await userRepository.findOneOrFail({where: {userId: user.userId}});
      expect(user.usedPtoDays).toBe(0);
    });

    test("should approve final approval and mark request as approved", async () => {
      // Arrange
      const organization = await createOrganization();
      let user = await createUser("requester", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        "Vacation time",
        [approver]
      );

      const approval = ptoRequest.approvals[0];

      // Act
      const approved = await ptoService.approve(approver, approval.id, "Final approval");

      // Assert
      expect(approved.ptoRequest.status).toBe(PtoRequestStatus.Approved);
      user = await userRepository.findOneOrFail({where: {userId: user.userId}});
      expect(user.usedPtoDays).toBe(ptoRequest.consumedDays);

      const updatedPtoRequest = await ptoRequestRepository.findOneOrFail({where: {id: ptoRequest.id}});
      expect(updatedPtoRequest.status).toBe(PtoRequestStatus.Approved);
    });

    test("should throw error if non-approver tries to approve", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("requester", organization);
      const correctApprover = await createUser("correct-approver", organization);
      const wrongApprover = await createUser("wrong-approver", organization);
      const template = await createPtoTemplate(organization);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        "Vacation time",
        [correctApprover, wrongApprover]
      );

      const approval = ptoRequest.approvals[0];

      // Act & Assert
      await expect(
        ptoService.approve(wrongApprover, approval.id, "Approved")
      ).rejects.toThrow("You are not the approver for this request");
    });

    test("should throw error if attempting to approve non-pending approval", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("requester", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        "Vacation time",
        [approver]
      );

      const approval = ptoRequest.approvals[0];

      // First approval
      await ptoService.approve(approver, approval.id, "Approved");

      // Act & Assert - try to approve again
      await expect(
        ptoService.approve(approver, approval.id, "Approved again")
      ).rejects.toThrow("This request has already been processed");
    });
  });

  describe("reject", () => {
    test("should reject a request and mark the entire request as rejected", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("requester", organization);
      const approver1 = await createUser("approver1", organization);
      const approver2 = await createUser("approver2", organization);
      const template = await createPtoTemplate(organization);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        "Vacation time",
        [approver1, approver2]
      );

      const firstApproval = ptoRequest.approvals.find(a => a.approver.userId === "approver1")!;

      // Act
      const rejected = await ptoService.reject(approver1, firstApproval.id, "Rejected");

      // Assert
      expect(rejected.status).toBe(PtoRequestStatus.Rejected);
      expect(rejected.comment).toBe("Rejected");
      expect(rejected.actionDate).toBeDefined();
      expect(rejected.ptoRequest.status).toBe(PtoRequestStatus.Rejected);
    });

    test("should throw error if non-approver tries to reject", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("requester", organization);
      const correctApprover = await createUser("correct-approver", organization);
      const wrongApprover = await createUser("wrong-approver", organization);
      const template = await createPtoTemplate(organization);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        "Vacation time",
        [correctApprover]
      );

      const approval = ptoRequest.approvals[0];

      // Act & Assert
      await expect(
        ptoService.reject(wrongApprover, approval.id, "Rejected")
      ).rejects.toThrow("You are not the approver for this request");
    });

    test("should throw error if attempting to reject non-pending approval", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("requester", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        "Vacation time",
        [approver]
      );

      const approval = ptoRequest.approvals[0];

      // First reject
      await ptoService.reject(approver, approval.id, "Rejected");

      // Act & Assert - try to reject again
      await expect(
        ptoService.reject(approver, approval.id, "Rejected again")
      ).rejects.toThrow("This request has already been processed");
    });

    test("should reject all pending approvals when one approver rejects", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("requester", organization);
      const approver1 = await createUser("approver1", organization);
      const approver2 = await createUser("approver2", organization);
      const approver3 = await createUser("approver3", organization);
      const template = await createPtoTemplate(organization);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        "Vacation time",
        [approver1, approver2, approver3]
      );

      const firstApproval = ptoRequest.approvals.find(a => a.approver.userId === "approver1")!;

      // Act - First approver rejects
      const rejected = await ptoService.reject(approver1, firstApproval.id, "Not approved");

      // Assert - Check the rejected approval
      expect(rejected.status).toBe(PtoRequestStatus.Rejected);
      expect(rejected.comment).toBe("Not approved");
      expect(rejected.actionDate).toBeDefined();
      expect(rejected.ptoRequest.status).toBe(PtoRequestStatus.Rejected);

      // Assert - Check that all other approvals are also rejected
      const updatedRequest = rejected.ptoRequest;

      expect(updatedRequest!.status).toBe(PtoRequestStatus.Rejected);
      expect(updatedRequest!.approvals).toHaveLength(3);

      // All approvals should be rejected
      updatedRequest!.approvals.forEach(approval => {
        expect(approval.status).toBe(PtoRequestStatus.Rejected);
        expect(approval.actionDate).toBeDefined();
      });

      // The first approval should have the comment
      const rejectedApproval = updatedRequest!.approvals.find(a => a.id === firstApproval.id);
      expect(rejectedApproval!.comment).toBe("Not approved");

      // Other approvals should not have comments (they were auto-rejected)
      const otherApprovals = updatedRequest!.approvals.filter(a => a.id !== firstApproval.id);
      otherApprovals.forEach(approval => {
        expect(approval.comment).toBeNull();
      });
    });
  });

  describe("getOrganizationPtoRequestsMonthly", () => {
    test("should retrieve PTO requests that start within the month", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      // May 15th - May 20th
      const mayPto = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-05-15"),
        new Date("2025-05-20"),
        "May vacation",
        "Vacation starting in May",
        [approver]
      );

      // Act
      const mayRequests = await ptoService.getOrganizationPtoRequestsMonthly(
        organization.organizationId,
        2025,
        4 // May (0-based index)
      );

      // Assert
      expect(mayRequests).toHaveLength(1);
      expect(mayRequests[0].id).toBe(mayPto.id);
    });

    test("should retrieve PTO requests that end within the month", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      // April 25th - May 5th
      const crossMonthPto = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-25"),
        new Date("2025-05-05"),
        "Cross-month vacation",
        "Vacation starting in April, ending in May",
        [approver]
      );

      // Act
      const mayRequests = await ptoService.getOrganizationPtoRequestsMonthly(
        organization.organizationId,
        2025,
        4 // May (0-based index)
      );

      // Assert
      expect(mayRequests).toHaveLength(1);
      expect(mayRequests[0].id).toBe(crossMonthPto.id);

      // Act
      const aprilRequests = await ptoService.getOrganizationPtoRequestsMonthly(
        organization.organizationId,
        2025,
        3 // April (0-based index)
      );

      // Assert
      expect(aprilRequests).toHaveLength(1);
      expect(aprilRequests[0].id).toBe(crossMonthPto.id);

      // Act
      const februaryRequests = await ptoService.getOrganizationPtoRequestsMonthly(
        organization.organizationId,
        2025,
        1 // February (0-based index)
      );

      // Assert
      expect(februaryRequests).toHaveLength(0);
    });

    test("should return multiple requests sorted by start date", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      // May 20th - May 25th
      const latePto = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-05-20"),
        new Date("2025-05-25"),
        "Late May vacation",
        "Vacation in late May",
        [approver]
      );

      // May 5th - May 10th
      const earlyPto = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-05-05"),
        new Date("2025-05-10"),
        "Early May vacation",
        "Vacation in early May",
        [approver]
      );

      // April 25th - May 15th
      const crossMonthPto = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-25"),
        new Date("2025-05-15"),
        "Cross-month vacation",
        "Vacation starting in April, ending in May",
        [approver]
      );

      // Act
      const mayRequests = await ptoService.getOrganizationPtoRequestsMonthly(
        organization.organizationId,
        2025,
        4 // May (0-based index)
      );

      // Assert
      expect(mayRequests).toHaveLength(3);
      expect(mayRequests[0].id).toBe(crossMonthPto.id); // Earliest start date
      expect(mayRequests[1].id).toBe(earlyPto.id);      // Second earliest
      expect(mayRequests[2].id).toBe(latePto.id);       // Latest start date
    });

    test("should return empty array when no PTO requests exist for the month", async () => {
      // Arrange
      const organization = await createOrganization();

      // Act
      const juneRequests = await ptoService.getOrganizationPtoRequestsMonthly(
        organization.organizationId,
        2025,
        5 // June (0-based index)
      );

      // Assert
      expect(juneRequests).toHaveLength(0);
    });

    test("should default to current month when year and month are not provided", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      // Calculate current month dates
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Current month's 15th day
      const midMonthDate = new Date(currentYear, currentMonth, 15);

      const currentMonthPto = await ptoService.createPtoRequest(
        user,
        template,
        midMonthDate,
        new Date(midMonthDate.getTime() + 86400000 * 2), // 2 days later
        "Current month vacation",
        "Vacation in current month",
        [approver]
      );

      // Act - not passing year and month parameters
      const currentMonthRequests = await ptoService.getOrganizationPtoRequestsMonthly(
        organization.organizationId
      );

      // Assert
      expect(currentMonthRequests).toHaveLength(1);
      expect(currentMonthRequests[0].id).toBe(currentMonthPto.id);
    });
  });

  describe("getPendingRequests", () => {
    test("should return empty map when no pending requests exist", async () => {
      // Arrange
      await createOrganization();

      // Act
      const pendingRequestsMap = await ptoService.getPendingRequests();

      // Assert
      expect(pendingRequestsMap.size).toBe(0);
    });

    test("should group pending requests by current approver", async () => {
      // Arrange
      const organization = await createOrganization();
      const user1 = await createUser("user1", organization);
      const user2 = await createUser("user2", organization);
      const approver1 = await createUser("approver1", organization);
      const approver2 = await createUser("approver2", organization);
      const template = await createPtoTemplate(organization);

      // Create 2 requests for approver1
      await ptoService.createPtoRequest(
        user1,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-02"),
        "Request 1",
        "Request 1 reason",
        [approver1]
      );

      await ptoService.createPtoRequest(
        user2,
        template,
        new Date("2025-04-03"),
        new Date("2025-04-04"),
        "Request 2",
        "Request 2 reason",
        [approver1]
      );

      // Create 1 request for approver2
      await ptoService.createPtoRequest(
        user1,
        template,
        new Date("2025-04-05"),
        new Date("2025-04-06"),
        "Request 3",
        "Request 3 reason",
        [approver2]
      );

      // Act
      const pendingRequestsMap = await ptoService.getPendingRequests();

      // Assert
      expect(pendingRequestsMap.size).toBe(2);

      const approver1Data = pendingRequestsMap.get(approver1.id);
      expect(approver1Data).toBeDefined();
      expect(approver1Data?.user.id).toBe(approver1.id);
      expect(approver1Data?.requests).toHaveLength(2);

      const approver2Data = pendingRequestsMap.get(approver2.id);
      expect(approver2Data).toBeDefined();
      expect(approver2Data?.user.id).toBe(approver2.id);
      expect(approver2Data?.requests).toHaveLength(1);
    });

    test("should only include requests where approver is the current approver in approval chain", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("user", organization);
      const approver1 = await createUser("approver1", organization);
      const approver2 = await createUser("approver2", organization);
      const approver3 = await createUser("approver3", organization);
      const template = await createPtoTemplate(organization);

      // Create request with 3 approvers
      const request = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-02"),
        "Multi-approver request",
        "Request reason",
        [approver1, approver2, approver3]
      );

      // Act - Initially only approver1 should see the request
      let pendingRequestsMap = await ptoService.getPendingRequests();

      // Assert
      expect(pendingRequestsMap.size).toBe(1);
      expect(pendingRequestsMap.has(approver1.id)).toBe(true);
      expect(pendingRequestsMap.has(approver2.id)).toBe(false);
      expect(pendingRequestsMap.has(approver3.id)).toBe(false);

      // Approve by approver1
      const approval1 = request.approvals.find(a => a.approver.id === approver1.id)!;
      await ptoService.approve(approver1, approval1.id, "Approved by approver1");

      // Act - Now only approver2 should see the request
      pendingRequestsMap = await ptoService.getPendingRequests();

      // Assert
      expect(pendingRequestsMap.size).toBe(1);
      expect(pendingRequestsMap.has(approver1.id)).toBe(false);
      expect(pendingRequestsMap.has(approver2.id)).toBe(true);
      expect(pendingRequestsMap.has(approver3.id)).toBe(false);
    });

    test("should exclude approved and rejected requests", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      // Create 3 requests
      const pendingRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-02"),
        "Pending request",
        "Pending reason",
        [approver]
      );

      const approvedRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-03"),
        new Date("2025-04-04"),
        "Approved request",
        "Approved reason",
        [approver]
      );

      const rejectedRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-05"),
        new Date("2025-04-06"),
        "Rejected request",
        "Rejected reason",
        [approver]
      );

      // Approve one request
      await ptoService.approve(
        approver,
        approvedRequest.approvals[0].id,
        "Approved"
      );

      // Reject one request
      await ptoService.reject(
        approver,
        rejectedRequest.approvals[0].id,
        "Rejected"
      );

      // Act
      const pendingRequestsMap = await ptoService.getPendingRequests();

      // Assert
      expect(pendingRequestsMap.size).toBe(1);
      const approverData = pendingRequestsMap.get(approver.id);
      expect(approverData?.requests).toHaveLength(1);
      expect(approverData?.requests[0].id).toBe(pendingRequest.id);
    });

    test("should handle multiple requests with different approvers correctly", async () => {
      // Arrange
      const organization = await createOrganization();
      const user1 = await createUser("user1", organization);
      const user2 = await createUser("user2", organization);
      const user3 = await createUser("user3", organization);
      const approver1 = await createUser("approver1", organization);
      const approver2 = await createUser("approver2", organization);
      const template = await createPtoTemplate(organization);

      // Create various requests
      await ptoService.createPtoRequest(
        user1,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-02"),
        "Request 1",
        "Reason 1",
        [approver1, approver2] // Multi-approver
      );

      await ptoService.createPtoRequest(
        user2,
        template,
        new Date("2025-04-03"),
        new Date("2025-04-04"),
        "Request 2",
        "Reason 2",
        [approver1]
      );

      await ptoService.createPtoRequest(
        user3,
        template,
        new Date("2025-04-05"),
        new Date("2025-04-06"),
        "Request 3",
        "Reason 3",
        [approver2, approver1] // Different order
      );

      // Act
      const pendingRequestsMap = await ptoService.getPendingRequests();

      // Assert
      expect(pendingRequestsMap.size).toBe(2);

      // approver1 should have 2 requests (one direct, one from multi-approver chain)
      const approver1Data = pendingRequestsMap.get(approver1.id);
      expect(approver1Data?.requests).toHaveLength(2);

      // approver2 should have 1 request
      const approver2Data = pendingRequestsMap.get(approver2.id);
      expect(approver2Data?.requests).toHaveLength(1);
    });

    test("should include user and organization relations in the result", async () => {
      // Arrange
      const organization = await createOrganization();
      const user = await createUser("user", organization);
      const approver = await createUser("approver", organization);
      approver.name = "Approver Name";
      await userRepository.save(approver);

      const template = await createPtoTemplate(organization);

      await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-02"),
        "Request",
        "Reason",
        [approver]
      );

      // Act
      const pendingRequestsMap = await ptoService.getPendingRequests();

      // Assert
      const approverData = pendingRequestsMap.get(approver.id);
      expect(approverData).toBeDefined();
      expect(approverData?.user.userId).toBe("approver");
      expect(approverData?.user.name).toBe("Approver Name");
      expect(approverData?.user.organization).toBeDefined();
      expect(approverData?.user.organization.organizationId).toBe("test-organization");
    });
  });

  describe("deletePtoRequestWithUserUpdate", () => {
    test("should delete PTO request and decrement user PTO days for approved request", async () => {
      // Arrange
      const organization = await createOrganization();
      let user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      // Set initial PTO days
      user.annualPtoDays = 20;
      user.usedPtoDays = 5;
      user = await userRepository.save(user);

      // Create and approve a request (1 day)
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-01"), // Single day
        "Vacation time",
        "Vacation time",
        [approver]
      );

      const approval = ptoRequest.approvals[0];
      await ptoService.approve(approver, approval.id, "Approved");

      // Verify user's used PTO days increased
      user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
      expect(user.usedPtoDays).toBe(6); // 5 + 1 consumed day

      // Act
      const result = await ptoService.deletePtoRequestWithUserUpdate(ptoRequest.id);

      // Assert
      expect(result.decrementedDays).toBe(1);

      // Verify user's used PTO days were decremented
      user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
      expect(user.usedPtoDays).toBe(5); // Back to original

      // Verify PTO request is soft deleted
      const deletedRequest = await ptoRequestRepository.findOne({
        where: { id: ptoRequest.id }
      });
      expect(deletedRequest).toBeNull();

      const softDeletedRequest = await ptoRequestRepository.findOne({
        where: { id: ptoRequest.id },
        withDeleted: true
      });
      expect(softDeletedRequest).toBeDefined();
      expect(softDeletedRequest?.deletedAt).toBeDefined();

      // Verify approvals are soft deleted
      const deletedApprovals = await ptoApprovalRepository.find({
        where: { ptoRequest: { id: ptoRequest.id } }
      });
      expect(deletedApprovals).toHaveLength(0);

      const softDeletedApprovals = await ptoApprovalRepository.find({
        where: { ptoRequest: { id: ptoRequest.id } },
        withDeleted: true
      });
      expect(softDeletedApprovals).toHaveLength(1);
      expect(softDeletedApprovals[0].deletedAt).toBeDefined();
    });

    test("should delete PTO request without changing user PTO days for pending request", async () => {
      // Arrange
      const organization = await createOrganization();
      let user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      // Set initial PTO days
      user.annualPtoDays = 20;
      user.usedPtoDays = 5;
      user = await userRepository.save(user);

      // Create a pending request (don't approve)
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-01"), // Single day
        "Vacation time",
        "Vacation time",
        [approver]
      );

      // Act
      const result = await ptoService.deletePtoRequestWithUserUpdate(ptoRequest.id);

      // Assert
      expect(result.decrementedDays).toBe(0);

      // Verify user's used PTO days unchanged
      user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
      expect(user.usedPtoDays).toBe(5); // Unchanged

      // Verify PTO request is soft deleted
      const deletedRequest = await ptoRequestRepository.findOne({
        where: { id: ptoRequest.id }
      });
      expect(deletedRequest).toBeNull();
    });

    test("should delete PTO request without changing user PTO days for rejected request", async () => {
      // Arrange
      const organization = await createOrganization();
      let user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      // Set initial PTO days
      user.annualPtoDays = 20;
      user.usedPtoDays = 5;
      user = await userRepository.save(user);

      // Create and reject a request
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-01"), // Single day
        "Vacation time",
        "Vacation time",
        [approver]
      );

      const approval = ptoRequest.approvals[0];
      await ptoService.reject(approver, approval.id, "Rejected");

      // Act
      const result = await ptoService.deletePtoRequestWithUserUpdate(ptoRequest.id);

      // Assert
      expect(result.decrementedDays).toBe(0);

      // Verify user's used PTO days unchanged
      user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
      expect(user.usedPtoDays).toBe(5); // Unchanged

      // Verify PTO request is soft deleted
      const deletedRequest = await ptoRequestRepository.findOne({
        where: { id: ptoRequest.id }
      });
      expect(deletedRequest).toBeNull();
    });


    test("should throw error when PTO request does not exist", async () => {
      // Act & Assert
      await expect(
        ptoService.deletePtoRequestWithUserUpdate(99999)
      ).rejects.toThrow("연차 요청을 찾을 수 없습니다.");
    });

    test("should handle half-day request deletion correctly", async () => {
      // Arrange
      const organization = await createOrganization();
      let user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization, { daysConsumed: 0.5 });

      user.annualPtoDays = 20;
      user.usedPtoDays = 5;
      user = await userRepository.save(user);

      // Create and approve a half-day request
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-01"),
        "Half day off",
        "Half day off",
        [approver]
      );

      const approval = ptoRequest.approvals[0];
      await ptoService.approve(approver, approval.id, "Approved");

      // Verify user's used PTO days increased by 0.5
      user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
      expect(user.usedPtoDays).toBe(5.5); // 5 + 0.5 consumed days

      // Act
      const result = await ptoService.deletePtoRequestWithUserUpdate(ptoRequest.id);

      // Assert
      expect(result.decrementedDays).toBe(0.5);

      // Verify user's used PTO days were decremented by 0.5
      user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
      expect(user.usedPtoDays).toBe(5); // Back to original
    });

    test("should ensure used PTO days never exceeds annual PTO days after deletion", async () => {
      // Arrange
      const organization = await createOrganization();
      let user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      // Set user with low annual PTO days
      user.annualPtoDays = 10;
      user.usedPtoDays = 8;
      user = await userRepository.save(user);

      // Create and approve a request
      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-01"), // Single day = 1 consumed day
        "Vacation time",
        "Vacation time",
        [approver]
      );

      const approval = ptoRequest.approvals[0];
      await ptoService.approve(approver, approval.id, "Approved");

      // Verify user's used PTO days increased
      user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
      expect(user.usedPtoDays).toBe(9); // 8 + 1 consumed day

      // Manually increase annual PTO days to be less than current used days after deletion
      // This simulates a scenario where admin reduced annual PTO days after approval
      user.annualPtoDays = 6; // Less than the 8 - 1 = 7 that would result from deletion
      user = await userRepository.save(user);

      // Act
      const result = await ptoService.deletePtoRequestWithUserUpdate(ptoRequest.id);

      // Assert
      expect(result.decrementedDays).toBe(1);

      // Verify used PTO days were capped at annual PTO days
      user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
      expect(user.usedPtoDays).toBe(6); // Math.min(Math.max(0, 9 - 1), 6) = Math.min(8, 6) = 6
      expect(user.usedPtoDays).toBeLessThanOrEqual(user.annualPtoDays);
    });

    test("should be atomic - if user update fails, deletion should also fail", async () => {
      // Arrange
      const organization = await createOrganization();
      let user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const template = await createPtoTemplate(organization);

      user.annualPtoDays = 20;
      user.usedPtoDays = 5;
      user = await userRepository.save(user);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-01"), // Single day
        "Vacation time",
        "Vacation time",
        [approver]
      );

      const approval = ptoRequest.approvals[0];
      await ptoService.approve(approver, approval.id, "Approved");

      // Mock userService.updateUser to throw an error
      const updateUserSpy = jest.spyOn(userService, 'updateUser').mockRejectedValue(
        new Error('Database connection failed')
      );

      try {
        // Act - This should fail and rollback the transaction
        await expect(
          ptoService.deletePtoRequestWithUserUpdate(ptoRequest.id)
        ).rejects.toThrow('Database connection failed');

        // Assert - Both operations should have been rolled back
        // 1. PTO request should still exist (not deleted)
        const ptoRequestAfterFailure = await ptoRequestRepository.findOne({
          where: { id: ptoRequest.id }
        });
        expect(ptoRequestAfterFailure).not.toBeNull();
        expect(ptoRequestAfterFailure?.deletedAt).toBeNull();

        // 2. Approvals should still exist (not deleted)
        const approvalsAfterFailure = await ptoApprovalRepository.find({
          where: { ptoRequest: { id: ptoRequest.id } }
        });
        expect(approvalsAfterFailure).toHaveLength(1);
        expect(approvalsAfterFailure[0].deletedAt).toBeNull();

        // 3. User's PTO days should remain unchanged
        user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
        expect(user.usedPtoDays).toBe(6); // Still 5 + 1 from approval (not rolled back to 5)

      } finally {
        // Restore the original method
        updateUserSpy.mockRestore();
      }
    });

    test("should maintain correct usedPtoDays when repeatedly approving and deleting half-day requests", async () => {
      // Arrange
      const organization = await createOrganization();
      let user = await createUser("test-user", organization);
      const approver = await createUser("approver", organization);
      const halfDayTemplate = await createPtoTemplate(organization, { daysConsumed: 0.5 });

      // Set initial PTO days
      user.annualPtoDays = 30;
      user.usedPtoDays = 5.5;
      user = await userRepository.save(user);

      // Act & Assert - Repeat approve and delete cycle 50 times
      for (let i = 0; i < 50; i++) {
        // Create half-day PTO request
        const requestDate = new Date(`2025-04-${String(i % 28 + 1).padStart(2, '0')}`); // Cycle through April dates
        const ptoRequest = await ptoService.createPtoRequest(
          user,
          halfDayTemplate,
          requestDate,
          requestDate, // Same date for half-day requests
          `Half day off ${i + 1}`,
          `Half day request iteration ${i + 1}`,
          [approver]
        );

        // Verify consumed days
        expect(ptoRequest.consumedDays).toBe(0.5);

        // Approve the request
        const approval = ptoRequest.approvals[0];
        await ptoService.approve(approver, approval.id, `Approved iteration ${i + 1}`);

        // Verify user's used PTO days increased by 0.5
        user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
        expect(user.usedPtoDays).toBe(6.0); // 5.5 + 0.5 = 6.0

        // Delete the request
        const result = await ptoService.deletePtoRequestWithUserUpdate(ptoRequest.id);
        expect(result.decrementedDays).toBe(0.5);

        // Verify user's used PTO days returned to initial value
        user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
        expect(user.usedPtoDays).toBe(5.5); // Back to initial value

        // Verify request is soft deleted
        const deletedRequest = await ptoRequestRepository.findOne({
          where: { id: ptoRequest.id }
        });
        expect(deletedRequest).toBeNull();

        // Verify request exists with soft delete
        const softDeletedRequest = await ptoRequestRepository.findOne({
          where: { id: ptoRequest.id },
          withDeleted: true
        });
        expect(softDeletedRequest).toBeDefined();
        expect(softDeletedRequest?.deletedAt).toBeDefined();
      }

      // Final verification - user's used PTO days should be exactly the same as initial
      user = await userRepository.findOneOrFail({ where: { userId: user.userId } });
      expect(user.usedPtoDays).toBe(5.5);
    });
  });
});