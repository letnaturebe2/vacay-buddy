import { Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../entity/user.model';
import { logBusinessEvent } from '../../logger';
import { organizationService, ptoService, userService } from '../../service';
import { assert400, assert401 } from '../../utils';

type RequestBody = {
  updates: {
    userId: string;
    annualPtoDays: number;
    usedPtoDays: number;
  }[];
};

export default (app: Application) => {
  app.put('/api/vacation', async (req: Request, res: Response) => {
    const { token } = req.query;
    const { updates } = req.body as RequestBody;

    assert400(!!token && typeof token === 'string', 'Invalid token');
    assert400(!!updates && Array.isArray(updates) && updates.length > 0, 'Updates array is required');

    // validate payload
    for (const update of updates) {
      if (update.annualPtoDays < update.usedPtoDays) {
        assert400(false, '연차를 초과하여 사용할 수 없습니다.');
      }
    }

    let decoded: { organizationId: string; userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
        organizationId: string;
        userId: string;
      };
    } catch (error) {
      assert401(false, `Invalid·token:·${String(error)}`);
    }

    const organization = await organizationService.getOrganization(decoded.organizationId);
    assert400(organization !== null, '조직을 찾을 수 없습니다.');

    const requestUser = await userService.getUser(decoded.userId);
    assert400(requestUser.isAdmin, '관리자 권한이 없습니다.');

    const results = [];
    const userIds = updates.map((update) => update.userId);
    const usersData: Partial<User>[] = updates.map((update) => ({
      userId: update.userId,
      annualPtoDays: update.annualPtoDays,
      usedPtoDays: update.usedPtoDays,
      organization,
    }));

    await userService.bulkUpsertUsers(userIds, usersData, organization);

    const updatedUsers = await userService.getUsers(userIds);
    // Add success results
    for (const updatedUser of updatedUsers) {
      results.push({
        userId: updatedUser.userId,
        user: {
          userId: updatedUser.userId,
          name: updatedUser.name,
          annualPtoDays: updatedUser.annualPtoDays,
          usedPtoDays: updatedUser.usedPtoDays,
          remainingPtoDays: updatedUser.remainingPtoDays,
        },
      });
    }

    logBusinessEvent('Vacation data updated via API', {
      organizationId: decoded.organizationId,
      adminUserId: decoded.userId,
      updateCount: updates.length,
      updatedUserIds: updates.map((u) => u.userId),
    });

    res.json({
      success: true,
      results,
    });
  });

  app.delete('/api/pto-request/:requestId', async (req: Request, res: Response) => {
    const { token } = req.query;
    const { requestId } = req.params;

    assert400(!!token && typeof token === 'string', 'Invalid token');
    assert400(!!requestId, 'Request ID is required');

    let decoded: { organizationId: string; userId: string; adminUserId?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
        organizationId: string;
        userId: string;
        adminUserId?: string;
      };
    } catch (error) {
      assert401(false, `Invalid token: ${String(error)}`);
    }

    // adminUserId가 있으면 해당 사용자로 권한 체크, 없으면 기존 로직 사용
    const adminOrRequestUserId = decoded.adminUserId || decoded.userId;
    const requestUser = await userService.getUser(adminOrRequestUserId);
    assert400(requestUser.isAdmin, '관리자 권한이 없습니다.');

    // Delete PTO request and update user's PTO days atomically
    const result = await ptoService.deletePtoRequestWithUserUpdate(Number(requestId));

    logBusinessEvent('PTO request deleted via API', {
      organizationId: decoded.organizationId,
      adminUserId: adminOrRequestUserId,
      requestId: Number(requestId),
    });

    res.json({
      success: true,
      message: '연차 요청이 삭제되었습니다.',
      decrementedDays: result.decrementedDays,
    });
  });
};
