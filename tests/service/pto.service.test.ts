import {Repository} from "typeorm";
import {testDataSource} from "../config/test-db";
import {PtoService} from "../../service/pto.service";
import {PtoTemplate} from "../../entity/pto-template.model";
import {PtoRequest} from "../../entity/pto-request.model";
import {PtoApproval} from "../../entity/pto-approval.model";
import {User} from "../../entity/user.model";
import {Team} from "../../entity/team.model";
import {PtoRequestStatus} from "../../config/constants";
import {UserService} from "../../service/user.service";

describe("PtoService Tests", () => {
  let userService: UserService;
  let ptoService: PtoService;
  let ptoTemplateRepository: Repository<PtoTemplate>;
  let ptoRequestRepository: Repository<PtoRequest>;
  let ptoApprovalRepository: Repository<PtoApproval>;
  let userRepository: Repository<User>;
  let teamRepository: Repository<Team>;

  beforeAll(async () => {
    ptoTemplateRepository = testDataSource.getRepository(PtoTemplate);
    ptoRequestRepository = testDataSource.getRepository(PtoRequest);
    ptoApprovalRepository = testDataSource.getRepository(PtoApproval);
    userRepository = testDataSource.getRepository(User);
    teamRepository = testDataSource.getRepository(Team);

    userService = new UserService(testDataSource);
    ptoService = new PtoService(testDataSource, userService);
  });

  beforeEach(async () => {
    await ptoApprovalRepository.clear();
    await ptoRequestRepository.clear();
    await ptoTemplateRepository.clear();
    await userRepository.clear();
    await teamRepository.clear();
  });

  // Helper functions to reduce code duplication
  const createTeam = async (teamId = "test-team"): Promise<Team> => {
    const team = new Team();
    team.teamId = teamId;
    return teamRepository.save(team);
  };

  const createUser = async (userId: string, team?: Team): Promise<User> => {
    const user = new User();
    user.userId = userId;
    if (team) user.team = team;
    return userRepository.save(user);
  };

  const createPtoTemplate = async (
    team: Team,
    data: Partial<PtoTemplate> = {}
  ): Promise<PtoTemplate> => {
    const template = new PtoTemplate();
    template.title = data.title || "Vacation";
    template.description = data.description || "Vacation template";
    template.content = data.content || "📅 Date Range: MM/DD/YYYY - MM/DD/YYYY\n📝 Reason: ";
    template.enabled = data.enabled ?? true;
    template.team = team;
    return ptoTemplateRepository.save(template);
  };

  describe("createTemplate", () => {
    test("should create a new PTO template with all fields", async () => {
      // Arrange
      const team = await createTeam();
      const templateData: Partial<PtoTemplate> = {
        title: "Vacation",
        description: "Annual vacation template",
        content: "📅 Date Range: MM/DD/YYYY - MM/DD/YYYY\n📝 Reason: Vacation",
        enabled: true,
      };

      // Act
      const result = await ptoService.upsertTemplate(templateData, team);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe(templateData.title);
      expect(result.description).toBe(templateData.description);
      expect(result.content).toBe(templateData.content);
      expect(result.enabled).toBe(templateData.enabled);
      expect(result.team.teamId).toBe("test-team");
      expect(result.daysConsumed).toBe(1);

      const savedTemplates = await ptoService.getTemplates(team);
      expect(savedTemplates).toHaveLength(1);
      expect(savedTemplates[0].title).toEqual(templateData.title);
    });
  });

  describe("updateTemplate", () => {
    test("should update an existing PTO template", async () => {
      // Arrange
      const team = await createTeam();
      const template = await createPtoTemplate(team);

      const updateData: Partial<PtoTemplate> = {
        id: template.id,
        title: "New Name",
        description: "New description",
        content: "New content",
        enabled: false,
        daysConsumed: 2
      };

      // Act
      const result = await ptoService.upsertTemplate(updateData, team);

      // Assert
      expect(result.title).toBe(updateData.title);
      expect(result.description).toBe(updateData.description);
      expect(result.content).toBe(updateData.content);
      expect(result.enabled).toBe(updateData.enabled);
      expect(result.daysConsumed).toBe(2);
    });
  });

  describe("createPtoRequest", () => {
    test("should create a PTO request with approvals", async () => {
      // Arrange
      const team = await createTeam();
      const user = await createUser("test-user", team);
      const approver = await createUser("approver", team);
      const template = await createPtoTemplate(team);
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-05");

      // Act
      const result = await ptoService.createPtoRequest(
        user,
        template,
        startDate,
        endDate,
        "Vacation time",
        [approver]
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.user.userId).toBe("test-user");
      expect(result.status).toBe(PtoRequestStatus.Pending);
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
      expect(result.reason).toBe("Vacation time");
      expect(result.approvals).toHaveLength(1);
      expect(result.approvals[0].approver.userId).toBe("approver");
      expect(result.currentApproverId).toBe(result.approvals[0].id);
      expect(result.template.title).toBe("Vacation");

    });

    test("should throw error if no approvers provided", async () => {
      // Arrange
      const team = await createTeam();
      const user = await createUser("test-user");
      const template = await createPtoTemplate(team);

      // Act & Assert
      await expect(
        ptoService.createPtoRequest(user, template, new Date(), new Date(), "Reason", [])
      ).rejects.toThrow("At least one approver is required for PTO requests");
    });

    test("should throw error if startDate is after endDate", async () => {
      // Arrange
      const team = await createTeam();
      const user = await createUser("test-user");
      const approver = await createUser("approver");
      const template = await createPtoTemplate(team);

      let startDate = new Date("2025-04-05");
      let endDate = new Date("2025-04-01");

      // Act & Assert
      await expect(
        ptoService.createPtoRequest(user, template, startDate, endDate, "Reason", [approver])
      ).rejects.toThrow("Start date must be before end date");

      // Arrange
      startDate = new Date("2025-04-01");
      endDate = new Date("2025-04-01");

      // Act
      const result = await ptoService.createPtoRequest(user, template, startDate, endDate, "Reason", [approver]);

      // Assert : same date is valid
      expect(result).toBeDefined();
      expect(result.startDate).toEqual(startDate);
      expect(result.endDate).toEqual(endDate);
    });
  });

  describe("getPtoRequests", () => {
    test("should return PTO requests for a user", async () => {
      // Arrange
      const team = await createTeam();
      const user = await createUser("test-user", team);
      const approver = await createUser("approver", team);
      const template = await createPtoTemplate(team);
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-05");

      await ptoService.createPtoRequest(
        user,
        template,
        startDate,
        endDate,
        "Vacation time",
        [approver]
      );

      // Act
      const requests = await ptoService.getOwnedPtoRequests(user);

      // Assert
      expect(requests).toHaveLength(1);
      const ptoRequest = requests[0];
      expect(ptoRequest.user.userId).toBe("test-user");
      expect(ptoRequest.status).toBe(PtoRequestStatus.Pending);
      expect(ptoRequest.template.title).toBe("Vacation");
      expect(ptoRequest.currentApproverId).not.toBeNull();
    });

  });

  describe("getPendingApprovalsToReview", () => {
    test("should return pending approvals for an approver", async () => {
      // Arrange
      const team = await createTeam();
      const user = await createUser("test-user", team);
      const approver = await createUser("approver", team);
      const template = await createPtoTemplate(team);
      const startDate = new Date("2025-04-01");
      const endDate = new Date("2025-04-05");

      await ptoService.createPtoRequest(
        user,
        template,
        startDate,
        endDate,
        "Vacation time",
        [approver]
      );

      // Act
      const approvals = await ptoService.getPendingApprovalsToReview(approver);

      // Assert
      expect(approvals).toHaveLength(1);
      expect(approvals[0].approver.userId).toBe("approver");
      expect(approvals[0].status).toBe(PtoRequestStatus.Pending);
      expect(approvals[0].ptoRequest.user.userId).toBe("test-user");
    });

    test("should only show requests to the current approver in the sequence", async () => {
      // Arrange
      const team = await createTeam();
      const user = await createUser("requester", team);
      const approver1 = await createUser("approver1", team);
      const approver2 = await createUser("approver2", team);
      const approver3 = await createUser("approver3", team);
      const template = await createPtoTemplate(team);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        [approver1, approver2, approver3]
      );

      // Act
      const approver1Requests = await ptoService.getPendingApprovalsToReview(approver1);
      const approver2Requests = await ptoService.getPendingApprovalsToReview(approver2);
      const approver3Requests = await ptoService.getPendingApprovalsToReview(approver3);

      // Assert
      expect(approver1Requests).toHaveLength(1);
      expect(approver1Requests[0].approver.userId).toBe("approver1");
      expect(approver2Requests).toHaveLength(0);
      expect(approver3Requests).toHaveLength(0);
      expect(ptoRequest.currentApproverId).toBe(approver1Requests[0].id);
    });

    test("should show request to next approver after current approver approves", async () => {
      // Arrange
      const team = await createTeam();
      const user = await createUser("requester", team);
      const approver1 = await createUser("approver1", team);
      const approver2 = await createUser("approver2", team);
      const approver3 = await createUser("approver3", team);
      const template = await createPtoTemplate(team);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        [approver1, approver2, approver3]
      );

      // Simulate first approver approving the request
      const firstApproval = ptoRequest.approvals.find(a => a.approver.userId === "approver1")!;
      firstApproval.status = PtoRequestStatus.Approved;
      await ptoApprovalRepository.save(firstApproval);

      // Update the current approver ID to the second approver
      const secondApproval = ptoRequest.approvals.find(a => a.approver.userId === "approver2")!;
      ptoRequest.currentApproverId = secondApproval.id;
      await ptoRequestRepository.save(ptoRequest);

      // Act
      const approver1Requests = await ptoService.getPendingApprovalsToReview(approver1);
      const approver2Requests = await ptoService.getPendingApprovalsToReview(approver2);
      const approver3Requests = await ptoService.getPendingApprovalsToReview(approver3);

      // Assert
      expect(approver1Requests).toHaveLength(0);
      expect(approver2Requests).toHaveLength(1);
      expect(approver2Requests[0].approver.userId).toBe("approver2");
      expect(approver3Requests).toHaveLength(0);
    });
  });

  describe("approve", () => {
    test("should approve a request and move to next approver", async () => {
      // Arrange
      const team = await createTeam();
      let user = await createUser("requester", team);
      const approver1 = await createUser("approver1", team);
      const approver2 = await createUser("approver2", team);
      const template = await createPtoTemplate(team);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        [approver1, approver2]
      );

      const firstApproval = ptoRequest.approvals.find(a => a.approver.userId === "approver1")!;

      // Act
      const result = await ptoService.approve(approver1, firstApproval.id, "Approved");

      // Re-fetch the request
      const updatedRequest = await ptoRequestRepository.findOne({
        where: {id: ptoRequest.id},
        relations: ['approvals']
      });

      // Assert
      expect(result.status).toBe(PtoRequestStatus.Approved);
      expect(result.comment).toBe("Approved");
      expect(result.actionDate).toBeDefined();

      const secondApprovalId = ptoRequest.approvals
        .find(a => a.approver.userId === "approver2")!.id;
      expect(updatedRequest!.currentApproverId).toBe(secondApprovalId);
      expect(updatedRequest!.status).toBe(PtoRequestStatus.Pending);

      user = await userRepository.findOneOrFail({where: {userId: user.userId}});
      expect(user.usedPtoDays).toBe(0);
    });

    test("should approve final approval and mark request as approved", async () => {
      // Arrange
      const team = await createTeam();
      let user = await createUser("requester", team);
      const approver = await createUser("approver", team);
      const template = await createPtoTemplate(team);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        [approver]
      );

      const approval = ptoRequest.approvals[0];

      // Act
      await ptoService.approve(approver, approval.id, "Final approval");

      // Re-fetch the request
      const updatedRequest = await ptoRequestRepository.findOne({
        where: {id: ptoRequest.id}
      });

      // Assert
      expect(updatedRequest?.status).toBe(PtoRequestStatus.Approved);
      user = await userRepository.findOneOrFail({where: {userId: user.userId}});
      expect(user.usedPtoDays).toBe(template.daysConsumed);
    });

    test("should throw error if non-approver tries to approve", async () => {
      // Arrange
      const team = await createTeam();
      const user = await createUser("requester", team);
      const correctApprover = await createUser("correct-approver", team);
      const wrongApprover = await createUser("wrong-approver", team);
      const template = await createPtoTemplate(team);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
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
      const team = await createTeam();
      const user = await createUser("requester", team);
      const approver = await createUser("approver", team);
      const template = await createPtoTemplate(team);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
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
      const team = await createTeam();
      const user = await createUser("requester", team);
      const approver1 = await createUser("approver1", team);
      const approver2 = await createUser("approver2", team);
      const template = await createPtoTemplate(team);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
        "Vacation time",
        [approver1, approver2]
      );

      const firstApproval = ptoRequest.approvals.find(a => a.approver.userId === "approver1")!;

      // Act
      const rejected = await ptoService.reject(approver1, firstApproval.id, "Rejected");

      // Re-fetch the request
      const updatedRequest = await ptoRequestRepository.findOne({
        where: {id: ptoRequest.id}
      });

      // Assert
      expect(rejected.status).toBe(PtoRequestStatus.Rejected);
      expect(rejected.comment).toBe("Rejected");
      expect(rejected.actionDate).toBeDefined();
      expect(updatedRequest?.status).toBe(PtoRequestStatus.Rejected);
    });

    test("should throw error if non-approver tries to reject", async () => {
      // Arrange
      const team = await createTeam();
      const user = await createUser("requester", team);
      const correctApprover = await createUser("correct-approver", team);
      const wrongApprover = await createUser("wrong-approver", team);
      const template = await createPtoTemplate(team);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
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
      const team = await createTeam();
      const user = await createUser("requester", team);
      const approver = await createUser("approver", team);
      const template = await createPtoTemplate(team);

      const ptoRequest = await ptoService.createPtoRequest(
        user,
        template,
        new Date("2025-04-01"),
        new Date("2025-04-05"),
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
});