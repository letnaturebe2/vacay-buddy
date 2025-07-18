import { WebClient } from '@slack/web-api';
import { AppContext } from '../app';
import { PtoRequest } from '../entity/pto-request.model';
import { User } from '../entity/user.model';
import { buildPendingNotificationMessage } from '../listeners/events/slack-ui/build-pending-notification-message';
import { logError } from '../logger';
import { OrganizationService } from './organization.service';
import { UserService } from './user.service';

export class NotificationService {
  private readonly userService: UserService;
  private readonly organizationService: OrganizationService;

  constructor(userService: UserService, organizationService: OrganizationService) {
    this.userService = userService;
    this.organizationService = organizationService;
  }

  /**
   * 단일 사용자에게 pending 알림 발송
   */
  async sendPendingNotification(user: User, pendingRequestsCount: number): Promise<void> {
    try {
      const mockContext = {
        locale: 'ko-KR',
        organization: user.organization,
        user: user,
      } as AppContext;

      const client = new WebClient(user.organization.botToken);
      await client.chat.postMessage({
        channel: user.userId,
        blocks: buildPendingNotificationMessage(mockContext, pendingRequestsCount),
      });

      await this.userService.updateUser(user.userId, {
        lastNotificationSentAt: new Date(),
      });
    } catch (error) {
      logError(`Failed to send notification to user ${user.name}`, error);

      if (error instanceof Error && 'code' in error && error.code === 'account_inactive') {
        logError(`User ${user.userId} is inactive. Deleting user from organization ${user.organization.id}.`, error);
        await this.organizationService.deleteOrganization(user.organization.organizationId);
        return;
      }

      throw error;
    }
  }

  /**
   * 여러 사용자에게 pending 알림 발송 (조건에 맞는 사용자에게만)
   */
  async sendPendingNotifications(usersWithRequests: Array<{ user: User; requests: PtoRequest[] }>): Promise<number> {
    let notificationsSent = 0;

    for (const { user, requests } of usersWithRequests) {
      if (!user.shouldSendNotification) {
        continue;
      }

      try {
        await this.sendPendingNotification(user, requests.length);
        notificationsSent++;
      } catch (error) {
        logError(`Failed to send notification to user ${user.userId}`, error);
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return notificationsSent;
  }
}
