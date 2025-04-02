import {OrganizationService} from "../../src/service/organization.service";
import {Organization} from "../../src/entity/organization.model";
import {User} from "../../src/entity/user.model";
import {In, Repository} from "typeorm";
import {testDataSource} from "../config/test-db";
import {UserService} from "../../src/service/user.service";
import {TEST_INSTALLATION} from "../config/constants";
import {WebClient} from "@slack/web-api";

jest.mock("@slack/web-api");

describe("OrganizationService Tests", () => {
  let organizationService: OrganizationService;
  let userService: UserService;
  let organizationRepository: Repository<Organization>;
  let userRepository: Repository<User>;

  const mockWebClient = {
    users: {
      list: jest.fn()
    }
  };

  beforeAll(async () => {
    organizationRepository = testDataSource.getRepository(Organization);
    userRepository = testDataSource.getRepository(User);
    userService = new UserService(testDataSource);
    organizationService = new OrganizationService(testDataSource, userService);

    (WebClient as unknown as jest.Mock).mockImplementation(() => mockWebClient);
  });

  beforeEach(async () => {
    await userRepository.clear();
    await organizationRepository.clear();

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
});