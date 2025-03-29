import { UserService } from "../../src/service/user.service";
import { User } from "../../src/entity/user.model";
import { Organization } from "../../src/entity/organization.model";
import { Repository } from "typeorm";
import { testDataSource } from "../config/test-db";

describe("UserService Tests", () => {
  let userService: UserService;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let testOrganization: Organization;

  beforeAll(async () => {
    userRepository = testDataSource.getRepository(User);
    organizationRepository = testDataSource.getRepository(Organization);
    userService = new UserService(testDataSource);
  });

  beforeEach(async () => {
    await userRepository.clear();
    await organizationRepository.clear();

    testOrganization = new Organization();
    testOrganization.organizationId = "test-organizationId";
    testOrganization = await organizationRepository.save(testOrganization);
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
        where: { userId: "new-user" },
        relations: { organization: true }
      });

      expect(savedUser).toBeDefined();
    });
  });
});