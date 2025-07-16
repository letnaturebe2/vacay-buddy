import { Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { logBusinessEvent } from '../logger';
import { organizationService, ptoService } from '../service';
import { commonStyles } from './css';

export default (app: Application) => {
  app.get('/team-vacation-html', async (req: Request, res: Response) => {
    const { token, from } = req.query;
    if (!token || typeof token !== 'string') {
      res.status(400).send('Invalid token');
      return;
    }

    let decoded: { organizationId: string; userId?: string; adminUserId?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
        organizationId: string;
        userId?: string;
        adminUserId?: string;
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).render('pages/expired-token', {
          redirectMessage: '슬랙 "팀 연차 현황 보기 버튼"을 통해 다시 접근해 주세요.',
        });
        return;
      }

      // For other token errors
      res.status(401).send('Invalid token');
      return;
    }

    const { organizationId } = decoded;

    if (!organizationId) {
      res.status(400).send('Invalid token');
      return;
    }

    const users = await organizationService.getUsers(organizationId);
    const monthlyRequests = await ptoService.getOrganizationPtoRequestsMonthly(organizationId);
    const onGoingRequests = monthlyRequests.filter((monthlyRequest) => monthlyRequest.onGoing);
    const pendingRequests = monthlyRequests.filter((monthlyRequest) => monthlyRequest.status === 'pending');
    const onVacationUsers: Set<string> = new Set(onGoingRequests.map((request) => request.user.userId));
    const pendingUsers: Set<string> = new Set(pendingRequests.map((request) => request.user.userId));

    logBusinessEvent('Team vacation page accessed', {
      organizationId,
      isFromInstallation: from === 'installation',
    });

    // Generate tokens for each user
    const usersWithTokens = users.map((user) => ({
      ...user,
      userToken: jwt.sign(
        {
          organizationId: organizationId,
          userId: user.userId,
          adminUserId: decoded.userId,
        },
        process.env.JWT_SECRET || 'default-secret-key',
        { expiresIn: '1h' },
      ),
    }));

    res.render('pages/team-vacation', {
      users: usersWithTokens,
      onVacationUsers,
      pendingUsers,
      onVacationCount: onVacationUsers.size,
      pendingCount: pendingUsers.size,
      commonStyles,
      token: token,
      isFromInstallation: from === 'installation',
    });
  });
};
