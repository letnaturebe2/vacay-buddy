import {OrganizationService} from "../../src/service/organization.service";
import {Organization} from "../../src/entity/organization.model";
import {User} from "../../src/entity/user.model";
import {In, Repository} from "typeorm";
import {testDataSource} from "../config/test-db";
import {UserService} from "../../src/service/user.service";
import {TEST_INSTALLATION} from "../config/constants";
import {WebClient} from "@slack/web-api";
import {PtoTemplate} from "../../src/entity/pto-template.model";

jest.mock("@slack/web-api");

describe("OrganizationService Tests", () => {
  let organizationService: OrganizationService;
  let userService: UserService;
  let organizationRepository: Repository<Organization>;
  let userRepository: Repository<User>;
  let ptoTemplateRepository: Repository<PtoTemplate>;

  const mockWebClient = {
    users: {
      list: jest.fn()
    }
  };

  beforeAll(async () => {
    ptoTemplateRepository = testDataSource.getRepository(PtoTemplate);
    organizationRepository = testDataSource.getRepository(Organization);
    userRepository = testDataSource.getRepository(User);
    userService = new UserService(testDataSource);
    organizationService = new OrganizationService(testDataSource, userService);

    (WebClient as unknown as jest.Mock).mockImplementation(() => mockWebClient);
  });

  beforeEach(async () => {
    await userRepository.clear();
    await organizationRepository.clear();
    await ptoTemplateRepository.clear();

    jest.clearAllMocks();
  });

  describe("getAdmins", () => {
    test("should return admin users for a organization", async () => {
      // Arrange
      const organization = await organizationService.createOrganization(
        "test-organization", false, JSON.stringify(TEST_INSTALLATION));

      const adminUser = new User();
      adminUser.userId = "admin";
      adminUser.isAdmin = true;
      adminUser.organization = organization;
      await userRepository.save(adminUser);

      const regularUser = new User();
      regularUser.userId = "regular";
      regularUser.isAdmin = false;
      regularUser.organization = organization;
      await userRepository.save(regularUser);

      // Act
      const admins = await organizationService.getAdmins(organization);

      // Assert
      expect(admins).toHaveLength(1);
      expect(admins[0].userId).toBe("admin");
    });
  });

  describe("updateAdmins", () => {
    test("should update admin status for organization members", async () => {
      // Arrange
      const organization = await organizationService.createOrganization(
        "test-organization", false, JSON.stringify(TEST_INSTALLATION));

      const user1 = new User();
      user1.userId = "user1";
      user1.organization = organization;
      await userRepository.save(user1);

      const user2 = new User();
      user2.userId = "user2";
      user2.organization = organization;
      user2.isAdmin = true;
      await userRepository.save(user2);

      // Act
      await organizationService.updateAdmins(["user1"], organization);

      // Assert
      const updatedUser1 = await userRepository.findOneBy({userId: "user1"});
      const updatedUser2 = await userRepository.findOneBy({userId: "user2"});

      expect(updatedUser1?.isAdmin).toBe(true);
      expect(updatedUser2?.isAdmin).toBe(false);
    });
  });

  describe("importTeamMembers", () => {
    test("should import valid team members from Slack", async () => {
      // Arrange
      const organization = await organizationService.createOrganization(
        "test-org-id", false, JSON.stringify(TEST_INSTALLATION));

      const mockSlackUsers = {
        ok: true,
        members: [
          {id: "slack-user-1", is_bot: false, deleted: false},
          {id: "slack-user-2", is_bot: false, deleted: false},
          {id: "bot-user", is_bot: true, deleted: false},
          {id: "deleted-user", is_bot: false, deleted: true}
        ]
      };

      mockWebClient.users.list.mockResolvedValue(mockSlackUsers);

      // Act
      await organizationService.importTeamMembers("fake-token", organization);

      // Assert
      expect(WebClient).toHaveBeenCalledWith("fake-token");
      expect(mockWebClient.users.list).toHaveBeenCalledWith({
        team_id: "test-org-id",
        limit: 500
      });


      // Verify users are saved in DB
      const savedUsers = await userRepository.find({
        where: {userId: In(["slack-user-1", "slack-user-2"])},
        relations: {organization: true}
      });

      expect(savedUsers.length).toBe(2);
      savedUsers.forEach(user => {
        expect(user.organization.id).toBe(organization.id);
      });
    });

    test("should handle empty members list", async () => {
      // Arrange
      const organization = await organizationService.createOrganization(
        "test-org-id", false, JSON.stringify(TEST_INSTALLATION));

      mockWebClient.users.list.mockResolvedValue({
        ok: true,
        members: []
      });

      const createBulkUsersSpy = jest.spyOn(userService, "createBulkUsers");

      // Act
      await organizationService.importTeamMembers("fake-token", organization);

      // Assert
      expect(createBulkUsersSpy).toHaveBeenCalledWith([], organization);
    });

    test("should handle API error", async () => {
      // Arrange
      const organization = await organizationService.createOrganization(
        "test-org-id", false, JSON.stringify(TEST_INSTALLATION));

      mockWebClient.users.list.mockResolvedValue({
        ok: false,
        error: "some_error"
      });

      const createBulkUsersSpy = jest.spyOn(userService, "createBulkUsers");

      // Act
      await organizationService.importTeamMembers("fake-token", organization);

      // Assert
      expect(createBulkUsersSpy).not.toHaveBeenCalled();
    });
  });

  describe("deleteOrganization (soft delete)", () => {
    test("should soft delete organization", async () => {
      // Arrange
      const organization = await organizationService.createOrganization(
        "test-organization", false, JSON.stringify(TEST_INSTALLATION));

      // Act
      await organizationService.deleteOrganization(organization.organizationId);

      // Assert
      // 일반 조회에서는 찾을 수 없어야 함
      const foundOrganization = await organizationService.getOrganization(organization.organizationId);
      expect(foundOrganization).toBeNull();

      // withDeleted: true로 조회하면 찾을 수 있어야 함
      const deletedOrganization = await organizationRepository.findOne({
        where: {organizationId: organization.organizationId},
        withDeleted: true
      });
      expect(deletedOrganization).not.toBeNull();
      expect(deletedOrganization?.deletedAt).not.toBeNull();
      expect(deletedOrganization?.deletedAt).toBeInstanceOf(Date);
    });

    test("should not affect other organizations when soft deleting", async () => {
      // Arrange
      const org1 = await organizationService.createOrganization(
        "test-org-1", false, JSON.stringify(TEST_INSTALLATION));
      const org2 = await organizationService.createOrganization(
        "test-org-2", false, JSON.stringify(TEST_INSTALLATION));

      // Act
      await organizationService.deleteOrganization(org1.organizationId);

      // Assert
      const foundOrg1 = await organizationService.getOrganization(org1.organizationId);
      const foundOrg2 = await organizationService.getOrganization(org2.organizationId);

      expect(foundOrg1).toBeNull();
      expect(foundOrg2).not.toBeNull();
      expect(foundOrg2?.organizationId).toBe("test-org-2");
    });

    test("should soft delete organization with related users", async () => {
      // Arrange
      const organization = await organizationService.createOrganization(
        "test-organization", false, JSON.stringify(TEST_INSTALLATION));

      const user = new User();
      user.userId = "test-user";
      user.organization = organization;
      await userRepository.save(user);

      // Act
      await organizationService.deleteOrganization(organization.organizationId);

      // Assert
      // Organization은 소프트 삭제됨
      const foundOrganization = await organizationService.getOrganization(organization.organizationId);
      expect(foundOrganization).toBeNull();

      // User는 여전히 존재해야 함 (CASCADE 삭제가 아닌 소프트 삭제이므로)
      const foundUser = await userRepository.findOne({
        where: {userId: "test-user"},
        relations: {organization: true},
        relationLoadStrategy: "query" // 소프트 삭제된 organization도 로드
      });
      expect(foundUser).not.toBeNull();
    });

    test("should find soft deleted organization with getOrganizationWithDeleted", async () => {
      // Arrange
      const organization = await organizationService.createOrganization(
        "test-organization", false, JSON.stringify(TEST_INSTALLATION));

      // Act
      await organizationService.deleteOrganization(organization.organizationId);

      // Assert
      // 일반 조회에서는 찾을 수 없음
      const foundOrganization = await organizationService.getOrganization(organization.organizationId);
      expect(foundOrganization).toBeNull();

      // getOrganizationWithDeleted로는 찾을 수 있음
      const deletedOrganization = await organizationService.getOrganizationWithDeleted(organization.organizationId);
      expect(deletedOrganization).not.toBeNull();
      expect(deletedOrganization?.organizationId).toBe("test-organization");
      expect(deletedOrganization?.deletedAt).toBeInstanceOf(Date);
    });

    test("should restore soft deleted organization", async () => {
      // Arrange
      const organization = await organizationService.createOrganization(
        "test-organization", false, JSON.stringify(TEST_INSTALLATION));

      // Soft delete
      await organizationService.deleteOrganization(organization.organizationId);

      // Verify it's deleted
      let foundOrganization = await organizationService.getOrganization(organization.organizationId);
      expect(foundOrganization).toBeNull();

      // Act - restore
      await organizationService.restoreOrganization(organization.organizationId, false, JSON.stringify(TEST_INSTALLATION));

      // Assert - should be accessible again
      foundOrganization = await organizationService.getOrganization(organization.organizationId);
      expect(foundOrganization).not.toBeNull();
      expect(foundOrganization?.organizationId).toBe("test-organization");
    });

    test("should restore organization and verify related entities still work", async () => {
      // Arrange
      const organization = await organizationService.createOrganization(
        "test-organization", false, JSON.stringify(TEST_INSTALLATION));

      const user = new User();
      user.userId = "test-user";
      user.organization = organization;
      await userRepository.save(user);

      const template = new PtoTemplate();
      template.title = "Test Template";
      template.organization = organization;
      template.content = "Test content";
      await ptoTemplateRepository.save(template);

      // Soft delete organization
      await organizationService.deleteOrganization(organization.organizationId);

      // Act - restore organization
      await organizationService.restoreOrganization(organization.organizationId, false, JSON.stringify(TEST_INSTALLATION));

      // Assert - organization should be accessible
      const restoredOrganization = await organizationService.getOrganization(organization.organizationId);
      expect(restoredOrganization).not.toBeNull();

      // Assert - related entities should still exist and be accessible
      const usersAfterRestore = await userRepository.find({
        where: { organization: { organizationId: organization.organizationId } },
        relations: { organization: true }
      });
      const templatesAfterRestore = await ptoTemplateRepository.find({
        where: { organization: { organizationId: organization.organizationId } },
        relations: { organization: true }
      });

      expect(usersAfterRestore).toHaveLength(1);
      expect(templatesAfterRestore).toHaveLength(1);
      expect(usersAfterRestore[0].userId).toBe("test-user");
      expect(templatesAfterRestore[0].title).toBe("Test Template");
    });
  });
})