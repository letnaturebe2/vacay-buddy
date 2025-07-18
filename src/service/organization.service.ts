import { WebClient } from '@slack/web-api';
import { DataSource, Repository } from 'typeorm';
import { INVALID_USER_IDS } from '../constants';
import { Organization } from '../entity/organization.model';
import { User } from '../entity/user.model';
import { assert } from '../utils';
import { UserService } from './user.service';

export class OrganizationService {
  private readonly organizationRepository: Repository<Organization>;
  private readonly userService: UserService;

  constructor(dataSource: DataSource, userService: UserService) {
    this.organizationRepository = dataSource.getRepository(Organization);
    this.userService = userService;
  }

  public async getOrganization(organizationId: string): Promise<Organization | null> {
    return await this.organizationRepository.findOne({ where: { organizationId } });
  }

  public async getUsers(organizationId: string): Promise<User[]> {
    return await this.userService.getUsersByOrganizationId(organizationId);
  }

  public async getOrCreateOrganization(
    organizationId: string,
    isEnterprise: boolean,
    installation = '{}',
  ): Promise<Organization> {
    const existingOrganization = await this.getOrganization(organizationId);
    if (existingOrganization) {
      return existingOrganization;
    }

    return await this.createOrganization(organizationId, isEnterprise, installation);
  }

  public async deleteOrganization(organizationId: string): Promise<void> {
    const organization = await this.getOrganization(organizationId);
    if (organization) {
      await this.organizationRepository.softDelete({ organizationId });
    }
  }

  public async getOrganizationWithDeleted(organizationId: string): Promise<Organization | null> {
    return await this.organizationRepository.findOne({
      where: { organizationId },
      withDeleted: true,
    });
  }

  public async restoreOrganization(
    organizationId: string,
    isEnterprise: boolean,
    installation: string,
  ): Promise<Organization> {
    await this.organizationRepository.update(
      { organizationId },
      {
        deletedAt: null,
        isEnterprise,
        installation,
      },
    );

    const organization = await this.getOrganization(organizationId);
    assert(organization !== null, 'Organization not found');
    return organization;
  }

  public async createOrganization(
    organizationId: string,
    isEnterprise: boolean,
    installation: string,
  ): Promise<Organization> {
    const organization = new Organization();
    organization.organizationId = organizationId;
    organization.isEnterprise = isEnterprise;
    organization.installation = installation;
    return await this.organizationRepository.save(organization);
  }

  public async getAdmins(organization: Organization): Promise<User[]> {
    return await this.userService.getAdmins(organization);
  }

  public async updateAdmins(userIds: string[], organization: Organization) {
    await this.userService.updateAdmins(userIds, organization);
  }

  public async importTeamMembers(botToken: string, organization: Organization): Promise<void> {
    const client = new WebClient(botToken);

    const userListResponse = await client.users.list({
      team_id: organization.organizationId,
      limit: 500, // TODO : Handle pagination if needed
    });

    if (userListResponse.ok && userListResponse.members) {
      const validMembers = userListResponse.members.filter((member) => {
        const userId = member.id ?? '';

        if (userId === '' || INVALID_USER_IDS.includes(userId)) {
          return false;
        }

        if (member.deleted) {
          return false;
        }

        return !member.is_bot;
      });

      const usersData = validMembers.map((member) => {
        return {
          id: member.id as string,
          name: member.real_name || member.name || '',
        };
      });

      await this.userService.createBulkUsers(usersData, organization);
    }
  }
}
