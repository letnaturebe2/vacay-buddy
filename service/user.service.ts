import {Team} from '../entity/team.model';
import {dataSource} from "../config/db";
import {In, Repository} from "typeorm";
import {User} from "../entity/user.model";

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = dataSource.getRepository(User);
  }

  public async getOrCreateUser(userId: string, team: Team): Promise<User> {
    let user = await this.userRepository.findOne({where: {userId: userId}});
    if (user === null) {
      user = await this.createUser(userId, team);
    }
    return user;
  }

  public async createUser(userId: string, team: Team): Promise<User> {
    const user = new User();
    user.userId = userId;
    user.team = team;
    return await this.userRepository.save(user);
  }

  public async getAdmins(team: Team): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        isAdmin: true,
        team: { id: team.id }
      }
    });
  }

  public async updateAdmins(userIds: string[], team: Team) {
    await dataSource.transaction(async transactionalEntityManager => {
      const currentTeamAdmins = await transactionalEntityManager.find(User, {
        where: {
          isAdmin: true,
          team: { id: team.id }
        }
      });

      currentTeamAdmins.forEach(admin => admin.isAdmin = false);
      await transactionalEntityManager.save(User, currentTeamAdmins);

      const users = await transactionalEntityManager.find(User, {
        where: {
          userId: In(userIds),
        }
      });
      users.forEach(user => user.isAdmin = true);
      await transactionalEntityManager.save(User, users);
    });
  }

}

export const userService = new UserService();