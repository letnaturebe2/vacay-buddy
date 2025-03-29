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

  public async createOrganization(organizationId: string, isEnterprise: boolean): Promise<Organization> {
    const organization = new Organization();
    organization.organizationId = organizationId;
    organization.isEnterprise = isEnterprise;
    return await this.organizationRepository.save(organization);
  }

  public async getAdmins(organizationId: Organization): Promise<User[]> {
    return await this.userService.getAdmins(organizationId);
  }

  public async updateAdmins(userIds: string[], organization: Organization) {
    await this.userService.updateAdmins(userIds, organization);
  }
}
