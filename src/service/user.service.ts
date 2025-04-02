import { DataSource, In, Repository } from 'typeorm';
import { Organization } from '../entity/organization.model';
import { User } from '../entity/user.model';
import { assert } from '../utils';

export class UserService {
  private userRepository: Repository<User>;
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.userRepository = dataSource.getRepository(User);
  }

  public async getUsers(organizationId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        organization: { organizationId },
      },
    });
  }

  public async updateUser(userId: string, userData: Partial<User>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { userId: userId } });
    assert(!!user, `user not found: ${userId}`);

    Object.assign(user, userData);
    return await this.userRepository.save(user);
  }

  public async getOrCreateUser(userId: string, organization: Organization, isAdmin = false): Promise<User> {
    let user = await this.userRepository.findOne({ where: { userId: userId } });
    if (user === null) {
      user = await this.createUser(userId, organization, isAdmin);
    }
    return user;
  }

  public async createBulkUsers(usersData: { id: string; name: string }[], organization: Organization) {
    // exclude users that already exist
    const existingUsers = await this.userRepository.find({
      where: {
        organization: { id: organization.id },
      },
    });

    const uniqueUsersData = usersData.filter((user) => {
      return !existingUsers.some((existingUser) => existingUser.userId === user.id);
    });

    const users = uniqueUsersData.map((obj) => {
      const user = new User();
      user.userId = obj.id;
      user.name = obj.name;
      user.organization = organization;
      return user;
    });
    return await this.userRepository.insert(users);
  }

  public async createUser(userId: string, organization: Organization, isAdmin = false): Promise<User> {
    const user = new User();
    user.userId = userId;
    user.organization = organization;
    user.isAdmin = isAdmin;
    return await this.userRepository.save(user);
  }

  public async getAdmins(organization: Organization): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        isAdmin: true,
        organization: { id: organization.id },
      },
    });
  }

  public async updateAdmins(userIds: string[], organization: Organization) {
    await this.dataSource.transaction(async (transactionalEntityManager) => {
      await transactionalEntityManager.update(User, { organization }, { isAdmin: false });
      await transactionalEntityManager.update(User, { organization, userId: In(userIds) }, { isAdmin: true });
    });
  }
}
