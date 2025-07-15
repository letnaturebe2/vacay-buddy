import { Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ptoService, userService } from '../service';
import { getRequestStatus } from '../utils';
import { commonStyles } from './css';

export default (app: Application) => {
  app.get('/user-vacation-html', async (req: Request, res: Response) => {
    const { token, year } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).send('Invalid token');
      return;
    }

    let decoded: { organizationId: string; userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
        organizationId: string;
        userId: string;
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).render('pages/expired-token', {
          redirectMessage: '슬랙에서 다시 접근해 주세요.',
        });
        return;
      }

      // For other token errors
      res.status(401).send('Invalid token');
      return;
    }

    const { organizationId, userId } = decoded;

    if (!organizationId || !userId) {
      res.status(400).send('Invalid token');
      return;
    }

    // Get all vacation requests for the user
    const user = await userService.getUser(userId);
    const userRequests = await ptoService.getMyPtoRequests(user);

    // Check if the current user is an admin
    const currentUser = await userService.getUser(decoded.userId);
    const isAdmin = currentUser.isAdmin;

    // Prepare for year filtering
    const currentYear = new Date().getFullYear();
    const yearNum = year ? Number(year) : Number.NaN;
    const selectedYear = !Number.isNaN(yearNum) ? yearNum : currentYear;

    // Create list of available years (current year and 3 previous years)
    const availableYears = [];
    for (let i = 0; i < 4; i++) {
      availableYears.push(currentYear - i);
    }

    // Filter requests for the selected year
    const filteredRequests = userRequests.filter((request) => {
      const requestYear = request.startDate.getFullYear();
      return selectedYear === requestYear;
    });

    res.render('pages/user-vacation', {
      user,
      availableYears,
      selectedYear,
      filteredRequests,
      commonStyles,
      getRequestStatus,
      isAdmin,
    });
  });
};
