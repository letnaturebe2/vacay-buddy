import { DataSource, In, Repository } from 'typeorm';
import { assert } from '../config/utils';
import { Team } from '../entity/team.model';
import { User } from '../entity/user.model';

export class UserService {
  private userRepository: Repository<User>;
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.userRepository = dataSource.getRepository(User);
  }

  public async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { userId: userId } });
    assert(!!user, `user not found: ${userId}`);

    Object.assign(user, userData);
    return await this.userRepository.save(user);
  }

  public async getOrCreateUser(userId: string, team: Team): Promise<User> {
    let user = await this.userRepository.findOne({ where: { userId: userId } });
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
        team: { id: team.id },
      },
    });
  }

  public async updateAdmins(userIds: string[], team: Team) {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.update(User, { team: team }, { isAdmin: false });
      await transactionalEntityManager.update(User, { team: team, userId: In(userIds) }, { isAdmin: true });
    });
  }
}
