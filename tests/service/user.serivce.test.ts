import { UserService } from "../../service/user.service";
import { User } from "../../entity/user.model";
import { Team } from "../../entity/team.model";
import { Repository } from "typeorm";
import { testDataSource } from "../config/test-db";

describe("UserService Tests", () => {
  let userService: UserService;
  let userRepository: Repository<User>;
  let teamRepository: Repository<Team>;
  let testTeam: Team;

  beforeAll(async () => {
    userRepository = testDataSource.getRepository(User);
    teamRepository = testDataSource.getRepository(Team);
  });

  beforeEach(async () => {
    userService = new UserService(testDataSource);
    jest.clearAllMocks();

    await userRepository.clear();
    await teamRepository.clear();

    testTeam = new Team();
    testTeam.teamId = "test-team";
    testTeam = await teamRepository.save(testTeam);
  });

  describe("getOrCreateUser", () => {
    test("should get existing user", async () => {
      // Arrange
      const user = new User();
      user.userId = "existing";
      user.team = testTeam;
      await userRepository.save(user);

      // Act
      const result = await userService.getOrCreateUser("existing", testTeam);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe("existing");
      expect(result.id).toBe(user.id);
    });

    test("should create new user when not found", async () => {
      // Act
      const result = await userService.getOrCreateUser("new-user", testTeam);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe("new-user");
      expect(result.team.id).toBe(testTeam.id);

      // Verify in DB
      const savedUser = await userRepository.findOne({
        where: { userId: "new-user" },
        relations: { team: true }
      });
      expect(savedUser).toBeDefined();
    });
  });

  describe("getAdmins", () => {
    test("should return only admin users for a team", async () => {
      // Arrange
      const adminUser = new User();
      adminUser.userId = "admin";
      adminUser.isAdmin = true;
      adminUser.team = testTeam;
      await userRepository.save(adminUser);

      const regularUser = new User();
      regularUser.userId = "regular";
      regularUser.isAdmin = false;
      regularUser.team = testTeam;
      await userRepository.save(regularUser);

      // Act
      const admins = await userService.getAdmins(testTeam);

      // Assert
      expect(admins).toHaveLength(1);
      expect(admins[0].userId).toBe("admin");
    });
  });

  describe("updateAdmins", () => {
    test("should update admin status for team members", async () => {
      // Arrange
      const user1 = new User();
      user1.userId = "user1";
      user1.team = testTeam;
      await userRepository.save(user1);

      const user2 = new User();
      user2.userId = "user2";
      user2.team = testTeam;
      user2.isAdmin = true;  // user2 is already an admin
      await userRepository.save(user2);

      const user3 = new User();
      user3.userId = "user3";
      user3.team = testTeam;
      await userRepository.save(user3);

      // Act
      await userService.updateAdmins(["user1", "user3"], testTeam);

      // Assert
      const updatedUser1 = await userRepository.findOneBy({ userId: "user1" });
      const updatedUser2 = await userRepository.findOneBy({ userId: "user2" });
      const updatedUser3 = await userRepository.findOneBy({ userId: "user3" });

      expect(updatedUser1?.isAdmin).toBe(true);
      expect(updatedUser2?.isAdmin).toBe(false);
      expect(updatedUser3?.isAdmin).toBe(true);
    });
  });
});