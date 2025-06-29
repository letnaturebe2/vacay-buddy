import { WebClient } from '@slack/web-api';
import { AppContext } from '../app';
import { PtoRequest } from '../entity/pto-request.model';
import { User } from '../entity/user.model';
import { buildPendingNotificationMessage } from '../listeners/events/slack-ui/build-pending-notification-message';
import { UserService } from './user.service';

export class NotificationService {
  private readonly userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * 단일 사용자에게 pending 알림 발송
   */
  async sendPendingNotification(user: User, pendingRequestsCount: number): Promise<void> {
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

    // 마지막 알림 전송 시간 업데이트
    await this.userService.updateUser(user.userId, {
      lastNotificationSentAt: new Date(),
    });
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

      await this.sendPendingNotification(user, requests.length);
      notificationsSent++;

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return notificationsSent;
  }
}
