import { WebClient } from '@slack/web-api';
import { type Application, Request, Response } from 'express';
import { AppContext } from '../app';
import { buildRequestDecisionBlocks } from '../listeners/views/slack-ui/build-request-decision-blocks';
import { ptoService } from '../service';
import { assert } from '../utils';

export default (app: Application) => {
  app.get('/pending-notification', async (req: Request, res: Response) => {
    try {
      const ptoRequests = await ptoService.getPendingRequests();

      // 각 pending request에 대해 현재 승인자에게 알림 발송
      for (const request of ptoRequests) {
        const currentApproval = request.approvals.find((approval) => approval.id === request.currentApprovalId);

        assert(currentApproval !== undefined, 'Current approval must exist for pending request');

        const mockContext = {
          locale: 'ko-KR',
          organization: request.user.organization,
          user: currentApproval.approver,
        } as AppContext;

        const client = new WebClient(request.user.organization.botToken);
        await client.chat.postMessage({
          channel: currentApproval.approver.userId,
          blocks: await buildRequestDecisionBlocks(mockContext, request, true),
        });

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      res.json({
        success: true,
        message: `${ptoRequests.length}개의 pending 요청에 대한 알림을 발송했습니다.`,
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
