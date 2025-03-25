import { TeamService } from "../../src/service/team.service";
import { Team } from "../../src/entity/team.model";
import { User } from "../../src/entity/user.model";
import { Repository } from "typeorm";
import { testDataSource } from "../config/test-db";
import {UserService} from "../../src/service/user.service";

describe("TeamService Tests", () => {
  let teamService: TeamService;
  let userService: UserService;
  let teamRepository: Repository<Team>;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    teamRepository = testDataSource.getRepository(Team);
    userRepository = testDataSource.getRepository(User);
    userService = new UserService(testDataSource);
    teamService = new TeamService(testDataSource, userService);
  });

  beforeEach(async () => {
    await userRepository.clear();
    await teamRepository.clear();
  });

  describe("getTeam and createTeam", () => {
    test("should get existing team and create new team when not found", async () => {
      // Arrange
      const existingTeam = new Team();
      existingTeam.teamId = "existing-team";
      await teamRepository.save(existingTeam);

      // Act - Create new team
      const newTeam = await teamService.createTeam("new-team");

      // Assert - New team creation
      expect(newTeam).toBeDefined();
      expect(newTeam.teamId).toBe("new-team");

      // Verify new team in DB
      const savedTeam = await teamRepository.findOne({
        where: { teamId: "new-team" }
      });
      expect(savedTeam).toBeDefined();

      // Act - Get existing team
      const foundTeam = await teamService.getTeam("existing-team");

      // Assert - Get existing team
      expect(foundTeam).toBeDefined();
      expect(foundTeam!.teamId).toBe("existing-team");
      expect(foundTeam!.id).toBe(existingTeam.id);
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