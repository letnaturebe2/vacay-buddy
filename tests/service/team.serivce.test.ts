import { TeamService } from "../../service/team.service";
import { Team } from "../../entity/team.model";
import { User } from "../../entity/user.model";
import { Repository } from "typeorm";
import { testDataSource } from "../config/test-db";
import {UserService} from "../../service/user.service";

describe("TeamService Tests", () => {
  let teamService: TeamService;
  let userService: UserService;
  let teamRepository: Repository<Team>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    teamRepository = testDataSource.getRepository(Team);
    userRepository = testDataSource.getRepository(User);
  });

  beforeEach(async () => {
    userService = new UserService(testDataSource);
    teamService = new TeamService(testDataSource, userService);
    jest.clearAllMocks();

    await userRepository.clear();
    await teamRepository.clear();
  });

  describe("getOrCreateTeam", () => {
    test("should get existing team", async () => {
      // Arrange
      const team = new Team();
      team.teamId = "existing-team";
      await teamRepository.save(team);

      // Act
      const result = await teamService.getOrCreateTeam("existing-team");

      // Assert
      expect(result).toBeDefined();
      expect(result.teamId).toBe("existing-team");
      expect(result.id).toBe(team.id);
    });

    test("should create new team when not found", async () => {
      // Act
      const result = await teamService.getOrCreateTeam("new-team");

      // Assert
      expect(result).toBeDefined();
      expect(result.teamId).toBe("new-team");

      // Verify in DB
      const savedTeam = await teamRepository.findOne({
        where: { teamId: "new-team" }
      });
      expect(savedTeam).toBeDefined();
    });
  });

  describe("getAdmins", () => {
    test("should return admin users for a team", async () => {
      // Arrange
      const team = new Team();
      team.teamId = "test-team";
      await teamRepository.save(team);

      const adminUser = new User();
      adminUser.userId = "admin";
      adminUser.isAdmin = true;
      adminUser.team = team;
      await userRepository.save(adminUser);

      const regularUser = new User();
      regularUser.userId = "regular";
      regularUser.isAdmin = false;
      regularUser.team = team;
      await userRepository.save(regularUser);

      // Act
      const admins = await teamService.getAdmins(team);

      // Assert
      expect(admins).toHaveLength(1);
      expect(admins[0].userId).toBe("admin");
    });
  });

  describe("updateAdmins", () => {
    test("should update admin status for team members", async () => {
      // Arrange
      const team = new Team();
      team.teamId = "test-team";
      await teamRepository.save(team);

      const user1 = new User();
      user1.userId = "user1";
      user1.team = team;
      await userRepository.save(user1);

      const user2 = new User();
      user2.userId = "user2";
      user2.team = team;
      user2.isAdmin = true;
      await userRepository.save(user2);

      // Act
      await teamService.updateAdmins(["user1"], team);

      // Assert
      const updatedUser1 = await userRepository.findOneBy({ userId: "user1" });
      const updatedUser2 = await userRepository.findOneBy({ userId: "user2" });

      expect(updatedUser1?.isAdmin).toBe(true);
      expect(updatedUser2?.isAdmin).toBe(false);
    });
  });
});