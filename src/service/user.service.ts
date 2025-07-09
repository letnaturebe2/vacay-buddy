import { DataSource, EntityManager, In, Repository } from 'typeorm';
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

  public async getUsersByOrganizationId(organizationId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        organization: { organizationId },
      },
    });
  }

  public async updateUser(userId: string, userData: Partial<User>, manager?: EntityManager): Promise<User> {
    const repository = manager ? manager.getRepository(User) : this.userRepository;

    const user = await repository.findOne({ where: { userId: userId } });
    assert(!!user, `user not found: ${userId}`);

    Object.assign(user, userData);
    return await repository.save(user);
  }

  public async getOrCreateUser(userId: string, organization: Organization, isAdmin = false, name = ''): Promise<User> {
    let user = await this.userRepository.findOne({ where: { userId: userId } });
    if (user === null) {
      user = await this.createUser(userId, name, organization, isAdmin);
    }
    return user;
  }

  public async getUser(userId: string): Promise<User> {
    return await this.userRepository.findOneOrFail({ where: { userId }, relations: ['organization'] });
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

  public async bulkUpsertUsers(userIds: string[], usersData: Partial<User>[], organization: Organization) {
    assert(userIds.length === usersData.length, 'Number of userIds and usersData must match');

    await this.dataSource.transaction(async (manager) => {
      const users = await manager.find(User, {
        where: {
          userId: In(userIds),
          organization: { id: organization.id },
        },
      });

      const usersToInsert: Partial<User>[] = usersData.filter(
        (data) => !users.some((user) => user.userId === data.userId),
      );

      const usersToUpdate: Partial<User>[] = usersData.filter((data) =>
        users.some((user) => user.userId === data.userId),
      );

      if (usersToInsert.length > 0) {
        await manager.insert(User, usersToInsert);
      }

      for (const userData of usersToUpdate) {
        const { userId, ...updateData } = userData;
        if (userId) {
          await manager.update(User, { userId, organization: { id: organization.id } }, updateData);
        }
      }
    });
  }

  public async upsertUser(userId: string, userData: Partial<User>): Promise<User> {
    let user = await this.userRepository.findOne({ where: { userId } });

    if (user === null) {
      user = new User();
      user.userId = userId;
    }

    Object.assign(user, userData);
    return await this.userRepository.save(user);
  }

  private async createUser(userId: string, name: string, organization: Organization, isAdmin = false): Promise<User> {
    const user = new User();
    user.userId = userId;
    user.organization = organization;
    user.isAdmin = isAdmin;
    user.name = name;
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

  public async getUsers(userIds: string[]): Promise<User[]> {
    return await this.userRepository.find({
      where: {
        userId: In(userIds),
      },
    });
  }
}
