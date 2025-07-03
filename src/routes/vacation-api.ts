import { Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { userService } from '../service';

export default (app: Application) => {
  // 연차 정보 업데이트 (단일/일괄 통합)
  app.put('/api/vacation', async (req: Request, res: Response) => {
    const { token } = req.query;
    const { updates } = req.body; // [{ userId, annualPtoDays, usedPtoDays }]

    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      res.status(400).json({ error: 'Updates array is required' });
      return;
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
      const decoded = jwt.verify(token, jwtSecret) as {
        organizationId: string;
        userId?: string;
      };

      // 관리자 권한 확인
      if (!decoded.userId) {
        res.status(401).json({ error: 'Invalid token: missing userId' });
        return;
      }

      const requestUser = await userService.getUser(decoded.userId);
      if (!requestUser || !requestUser.isAdmin) {
        res.status(403).json({ error: 'Admin permission required' });
        return;
      }

      const results = [];

      for (const update of updates) {
        try {
          if (!update.userId || update.annualPtoDays === undefined || update.usedPtoDays === undefined) {
            results.push({
              userId: update.userId || 'unknown',
              success: false,
              error: 'Missing required fields: userId, annualPtoDays, usedPtoDays',
            });
            continue;
          }

          const targetUser = await userService.getUser(update.userId);
          if (!targetUser) {
            results.push({
              userId: update.userId,
              success: false,
              error: 'User not found',
            });
            continue;
          }

          if (targetUser.organization.organizationId !== decoded.organizationId) {
            results.push({
              userId: update.userId,
              success: false,
              error: 'User not in same organization',
            });
            continue;
          }

          await userService.updateUser(update.userId, {
            ...targetUser,
            annualPtoDays: Number(update.annualPtoDays),
            usedPtoDays: Number(update.usedPtoDays),
          });

          const updatedUser = await userService.getUser(update.userId);
          results.push({
            userId: updatedUser.userId,
            success: true,
            user: {
              userId: updatedUser.userId,
              name: updatedUser.name,
              annualPtoDays: updatedUser.annualPtoDays,
              usedPtoDays: updatedUser.usedPtoDays,
              remainingPtoDays: updatedUser.annualPtoDays - updatedUser.usedPtoDays,
            },
          });
        } catch (error) {
          results.push({
            userId: update.userId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.json({
        success: true,
        results,
      });
    } catch (error) {
      console.error('Vacation update error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  });
};
