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
import {TEST_INSTALLATION} from "../config/constants";
import {getDefaultTemplates} from "../../src/utils";

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
    ptoTemplateRepository = testDataSource.getRepository(PtoTemplate);
    ptoRequestRepository = testDataSource.getRepository(PtoRequest);
    ptoApprovalRepository = testDataSource.getRepository(PtoApproval);
    userRepository = testDataSource.getRepository(User);
    organizationRepository = testDataSource.getRepository(Organization);

    userService = new UserService(testDataSource);
    organizationService = new OrganizationService(testDataSource, userService);
    ptoService = new PtoService(testDataSource, userService);
  });

  beforeEach(async () => {
    await ptoApprovalRepository.clear();
    await ptoRequestRepository.clear();
    await ptoTemplateRepository.clear();
    await userRepository.clear();
    await organizationRepository.clear();
  });

  // Helper functions to reduce code duplication
  const createOrganization = async (organizationId = "test-organization"): Promise<Organization> => {
    return await organizationService.createOrganization(
      organizationId,
      false,
      JSON.stringify(TEST_INSTALLATION)
    )
  };

  const createUser = async (userId: string, organization?: Organization): Promise<User> => {
    const user = new User();
    user.userId = userId;
    if (organization) user.organization = organization;
    return userRepository.save(user);
  };

  const createPtoTemplate = async (
    organization: Organization,
    data: Partial<PtoTemplate> = {}
  ): Promise<PtoTemplate> => {
    const template = new PtoTemplate();
    template.title = data.title || "Vacation";
    template.description = data.description || "Vacation template";
    template.content = data.content || "📋 Leave Request Details: \n - Reason:";
    template.enabled = data.enabled ?? true;
    template.daysConsumed = data.daysConsumed ?? 1;
    template.organization = organization;
    return ptoTemplateRepository.save(template);
  };

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
});