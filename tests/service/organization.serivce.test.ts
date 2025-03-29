import { OrganizationService } from "../../src/service/organization.service";
import { Organization } from "../../src/entity/organization.model";
import { User } from "../../src/entity/user.model";
import { Repository } from "typeorm";
import { testDataSource } from "../config/test-db";
import {UserService} from "../../src/service/user.service";

describe("OrganizationService Tests", () => {
  let organizationService: OrganizationService;
  let userService: UserService;
  let organizationRepository: Repository<Organization>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    organizationRepository = testDataSource.getRepository(Organization);
    userRepository = testDataSource.getRepository(User);
    userService = new UserService(testDataSource);
    organizationService = new OrganizationService(testDataSource, userService);
  });

  beforeEach(async () => {
    await userRepository.clear();
    await organizationRepository.clear();
  });

  describe("getOrganization and createOrganization", () => {
    test("should get existing organization and create new organization when not found", async () => {
      // Arrange
      const existingOrganization = new Organization();
      existingOrganization.organizationId = "existing-organization";
      await organizationRepository.save(existingOrganization);

      // Act - Create new organization
      const newOrganization = await organizationService.createOrganization("new-organization", false);

      // Assert - New organization creation
      expect(newOrganization).toBeDefined();
      expect(newOrganization.organizationId).toBe("new-organization");

      // Verify new organization in DB
      const savedOrganization = await organizationRepository.findOne({
        where: { organizationId: "new-organization" }
      });
      expect(savedOrganization).toBeDefined();

      // Act - Get existing organization
      const foundOrganization = await organizationService.getOrganization("existing-organization");

      // Assert - Get existing organization
      expect(foundOrganization).toBeDefined();
      expect(foundOrganization!.organizationId).toBe("existing-organization");
      expect(foundOrganization!.id).toBe(existingOrganization.id);
    });
  });

  describe("getAdmins", () => {
    test("should return admin users for a organization", async () => {
      // Arrange
      const organization = new Organization();
      organization.organizationId = "test-organization";
      await organizationRepository.save(organization);

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
      const organization = new Organization();
      organization.organizationId = "test-organization";
      await organizationRepository.save(organization);

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
      const updatedUser1 = await userRepository.findOneBy({ userId: "user1" });
      const updatedUser2 = await userRepository.findOneBy({ userId: "user2" });

      expect(updatedUser1?.isAdmin).toBe(true);
      expect(updatedUser2?.isAdmin).toBe(false);
    });
  });
});