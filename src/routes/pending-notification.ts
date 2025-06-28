import { WebClient } from '@slack/web-api';
import { type Application, Request, Response } from 'express';
import { AppContext } from '../app';
import { buildPendingNotificationMessage } from '../listeners/events/slack-ui/build-pending-notification-message';
import { ptoService } from '../service';

export default (app: Application) => {
  app.get('/pending-notification', async (req: Request, res: Response) => {
    try {
      const pendingRequestsByUser = await ptoService.getPendingRequests();

      // 각 pending request에 대해 현재 승인자에게 알림 발송
      for (const [approverId, userWithRequests] of pendingRequestsByUser.entries()) {
        const approver = userWithRequests.user;

        const requests = userWithRequests.requests;

        const mockContext = {
          locale: 'ko-KR',
          organization: approver.organization,
          user: approver,
        } as AppContext;

        const client = new WebClient(approver.organization.botToken);
        await client.chat.postMessage({
          channel: approver.userId,
          blocks: buildPendingNotificationMessage(mockContext, requests.length),
        });

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      res.json({
        success: true,
        message: `${pendingRequestsByUser.size}명의 승인자에게 알림을 발송했습니다.`,
      });
    } catch (error) {
      console.error('Pending notification 전송 중 오류:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send pending notifications',
      });
    }
  });
};
