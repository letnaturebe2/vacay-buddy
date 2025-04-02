import {UserService} from "../../src/service/user.service";
import {User} from "../../src/entity/user.model";
import {Organization} from "../../src/entity/organization.model";
import {In, Repository} from "typeorm";
import {testDataSource} from "../config/test-db";
import {OrganizationService} from "../../src/service/organization.service";
import {TEST_INSTALLATION} from "../config/constants";

describe("UserService Tests", () => {
  let organizationService: OrganizationService;
  let userService: UserService;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let testOrganization: Organization;

  beforeAll(async () => {
    userRepository = testDataSource.getRepository(User);
    organizationRepository = testDataSource.getRepository(Organization);
    userService = new UserService(testDataSource);
    organizationService = new OrganizationService(testDataSource, userService);
  });

  beforeEach(async () => {
    await userRepository.clear();
    await organizationRepository.clear();

    testOrganization = await organizationService.createOrganization(
      "test-organization", false, JSON.stringify(TEST_INSTALLATION));
  });

  describe("getOrCreateUser", () => {
    test("should get existing user", async () => {
      // Arrange
      const user = new User();
      user.userId = "existing";
      user.organization = testOrganization;
      await userRepository.save(user);

      // Act
      const result = await userService.getOrCreateUser("existing", testOrganization);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe("existing");
      expect(result.id).toBe(user.id);
      expect(result.annualPtoDays).toBe(15);
      expect(result.usedPtoDays).toBe(0);
    });

    test("should create new user when not found", async () => {
      // Act
      const result = await userService.getOrCreateUser("new-user", testOrganization);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe("new-user");
      expect(result.organization.id).toBe(testOrganization.id);

      // Verify in DB
      const savedUser = await userRepository.findOne({
        where: {userId: "new-user"},
        relations: {organization: true}
      });

      expect(savedUser).toBeDefined();
    });
  });

  describe("createBulkUsers", () => {
    test("should create multiple users in bulk", async () => {
      // Arrange
      const usersData = [
        {id: "bulk-user-1", name: "Bulk User 1"},
        {id: "bulk-user-2", name: "Bulk User 2"},
        {id: "bulk-user-3", name: "Bulk User 3"}
      ]
      const userIds = usersData.map(user => user.id);

      // Act
      const result = await userService.createBulkUsers(usersData, testOrganization);

      // Assert
      expect(result).toBeDefined();
      expect(result.identifiers.length).toBe(3);

      // Verify in DB
      const savedUsers = await userRepository.find({
        where: {userId: In(userIds)},
        relations: {organization: true}
      });

      expect(savedUsers.length).toBe(3);
      expect(savedUsers.map(user => user.userId).sort()).toEqual(userIds.sort());
      savedUsers.forEach(user => {
        expect(user.organization.id).toBe(testOrganization.id);
        expect(user.isAdmin).toBe(false);
      });
    });

    test("should create users with correct organization relationship", async () => {
      // Arrange
      const usersData = [
        {id: "org-user-1", name: "Org User 1"},
        {id: "org-user-2", name: "Org User 2"}
      ];
      const userIds = usersData.map(user => user.id);

      // Act
      await userService.createBulkUsers(usersData, testOrganization);

      // Assert - Check if organization relationship is maintained
      const organization = await organizationRepository.findOne({
        where: {id: testOrganization.id},
        relations: {users: true}
      });

      expect(organization).toBeDefined();
      expect(organization!.users.some(user => user.userId === "org-user-1")).toBe(true);
      expect(organization!.users.some(user => user.userId === "org-user-2")).toBe(true);
    });
  });

  describe("upsertUser", () => {
    test("should update existing user when found", async () => {
      // Arrange
      const user = new User();
      user.userId = "existing-user";
      user.name = "Original Name";
      user.organization = testOrganization;
      user.annualPtoDays = 15;
      user.usedPtoDays = 0;
      await userRepository.save(user);

      const updateData = {
        name: "Updated Name",
        annualPtoDays: 20,
        usedPtoDays: 5,
        organization: testOrganization
      };

      // Act
      const result = await userService.upsertUser("existing-user", updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe("existing-user");
      expect(result.name).toBe("Updated Name");
      expect(result.annualPtoDays).toBe(20);
      expect(result.usedPtoDays).toBe(5);
      expect(result.organization).toBe(testOrganization);

      // Verify in DB
      const updatedUser = await userRepository.findOne({
        where: { userId: "existing-user" },
        relations: { organization: true }
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser!.name).toBe("Updated Name");
      expect(updatedUser!.annualPtoDays).toBe(20);
      expect(updatedUser!.usedPtoDays).toBe(5);
      expect(updatedUser!.organization.id).toBe(testOrganization.id);
    });

    test("should create new user when not found", async () => {
      // Arrange
      const userData = {
        name: "New User",
        annualPtoDays: 25,
        usedPtoDays: 3,
        organization: testOrganization
      };

      // Act
      const result = await userService.upsertUser("new-upserted-user", userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe("new-upserted-user");
      expect(result.name).toBe("New User");
      expect(result.annualPtoDays).toBe(25);
      expect(result.usedPtoDays).toBe(3);
      expect(result.organization.id).toBe(testOrganization.id);

      // Verify in DB
      const savedUser = await userRepository.findOne({
        where: { userId: "new-upserted-user" },
        relations: { organization: true }
      });

      expect(savedUser).toBeDefined();
      expect(savedUser!.name).toBe("New User");
      expect(savedUser!.annualPtoDays).toBe(25);
      expect(savedUser!.usedPtoDays).toBe(3);
      expect(savedUser!.organization.id).toBe(testOrganization.id);
    });

    test("should maintain other fields when partially updating user", async () => {
      // Arrange
      const user = new User();
      user.userId = "partial-update-user";
      user.name = "Original User";
      user.organization = testOrganization;
      user.annualPtoDays = 15;
      user.usedPtoDays = 2;
      user.isAdmin = true;
      await userRepository.save(user);

      const partialUpdateData = {
        name: "Partially Updated User",
        usedPtoDays: 5
      };

      // Act
      const result = await userService.upsertUser("partial-update-user", partialUpdateData);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe("Partially Updated User");
      expect(result.usedPtoDays).toBe(5);
      expect(result.annualPtoDays).toBe(15); // unchanged
      expect(result.isAdmin).toBe(true); // unchanged
    });
  });

});