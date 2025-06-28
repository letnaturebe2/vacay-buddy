import { type Application, Request, Response } from 'express';
import { notificationService, ptoService } from '../service';

export default (app: Application) => {
  app.get('/pending-notification', async (req: Request, res: Response) => {
    try {
      const pendingRequestsByUser = await ptoService.getPendingRequests();

      const usersWithRequests = Array.from(pendingRequestsByUser.values());

      const notificationsSent = await notificationService.sendPendingNotifications(usersWithRequests);

      res.json({
        success: true,
        message: `${notificationsSent}명의 승인자에게 알림을 발송했습니다.`,
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
