import { dataSource } from '../db';
import { PtoService } from './pto.service';
import { OrganizationService } from './organization.service';
import { UserService } from './user.service';

export const userService = new UserService(dataSource);
export const organizationService = new OrganizationService(dataSource, userService);
export const ptoService = new PtoService(dataSource, userService);
