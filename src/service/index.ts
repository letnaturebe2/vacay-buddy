import { dataSource } from '../db';
import { OrganizationService } from './organization.service';
import { PtoService } from './pto.service';
import { UserService } from './user.service';
import { NotificationService } from './notification.service';

export const userService = new UserService(dataSource);
export const organizationService = new OrganizationService(dataSource, userService);
export const ptoService = new PtoService(dataSource, userService);
export const notificationService = new NotificationService(userService);
