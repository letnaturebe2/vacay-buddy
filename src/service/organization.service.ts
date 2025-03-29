import { DataSource, Repository } from 'typeorm';
import { Organization } from '../entity/organization.model';
import { User } from '../entity/user.model';
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

  public async getOrCreateOrganization(organizationId: string, isEnterprise: boolean): Promise<Organization> {
    const existingOrganization = await this.getOrganization(organizationId);
    if (existingOrganization) {
      return existingOrganization;
    }

    return await this.createOrganization(organizationId, isEnterprise, '{}');
  }

  public async deleteOrganization(organizationId: string): Promise<void> {
    const organization = await this.getOrganization(organizationId);
    if (organization) {
      await this.organizationRepository.remove(organization);
    }
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
}
