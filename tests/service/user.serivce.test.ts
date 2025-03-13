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
});