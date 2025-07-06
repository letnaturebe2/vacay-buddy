import { type Application, type NextFunction, Request, Response } from 'express';
import { GaxiosError } from 'gaxios';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { PtoRequest } from '../../entity/pto-request.model';
import { User } from '../../entity/user.model';
import { userService } from '../../service';
import { GoogleOAuthError, formatToYYYYMMDD } from '../../utils';

function createOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new GoogleOAuthError(
      'config_missing',
      'Google OAuth 환경 변수가 설정되지 않았습니다. GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI를 확인해주세요.',
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * 구글 캘린더에 PTO 이벤트를 생성하는 함수
 */
export async function createCalendarEvent(user: User, ptoRequest: PtoRequest): Promise<boolean> {
  try {
    if (!user.googleRefreshToken) {
      console.log(`User ${user.userId} has no Google refresh token. Skipping calendar event creation.`);
      return false;
    }

    const oauth2Client = createOAuthClient();
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 날짜 포맷팅 (종일 이벤트로 생성)
    const startDate = formatToYYYYMMDD(ptoRequest.startDate);
    // 종일 이벤트의 경우 endDate는 다음 날짜여야 함 (Google Calendar API 규칙)
    const nextDay = new Date(ptoRequest.endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const endDate = formatToYYYYMMDD(nextDay);

    const event = {
      summary: `🏖️ ${ptoRequest.title}`,
      description: `연차 유형: ${ptoRequest.template.title}\n사유: ${ptoRequest.reason}\n소모 일수: ${ptoRequest.consumedDays}일`,
      start: {
        date: startDate,
        timeZone: user.tz
      },
      end: {
        date: endDate,
        timeZone: user.tz
      },
      transparency: 'transparent', // 바쁜 시간으로 표시하지 않음
      // visibility: 'private',
      colorId: '10', // 초록색으로 설정 (휴가 느낌)
    };

    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    console.log(`✅ Calendar event created for user ${user.userId}: ${ptoRequest.title}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create calendar event for user ${user.userId}:`, error);

    // 구글 API 에러 유형별 처리
    if (error instanceof GaxiosError) {
      switch (error.response?.status) {
        case 401:
          // 토큰 만료 - 리프레시 토큰 삭제하여 재인증 유도
          try {
            await userService.updateUser(user.userId, {
              googleRefreshToken: null,
            });
            console.log(`🔄 Expired Google token removed for user ${user.userId}`);
          } catch (updateError) {
            console.error(`Failed to remove expired token for user ${user.userId}:`, updateError);
          }
          break;
        case 403:
          console.error(
            `❌ Google Calendar API access denied for user ${user.userId}. Check API quotas and permissions.`,
          );
          break;
        case 404:
          console.error(`❌ Google Calendar not found for user ${user.userId}.`);
          break;
        default:
          console.error(`❌ Google API error ${error.response?.status} for user ${user.userId}:`, error.response?.data);
      }
    } else {
      console.error(`❌ Unexpected error creating calendar event for user ${user.userId}:`, error);
    }

    return false;
  }
}

export default (app: Application) => {
  // 구글 인증 시작
  app.get('/googleauth', (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new GoogleOAuthError('token_invalid', '유효하지 않은 토큰입니다.');
    }

    try {
      // JWT 토큰 검증
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
        organizationId: string;
        userId: string;
      };

      const oauth2Client = createOAuthClient();
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.events'],
        prompt: 'consent',
        state: decoded.userId,
      });

      res.redirect(authUrl);
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new GoogleOAuthError('token_invalid', '토큰이 유효하지 않습니다.', token);
      }
      throw new GoogleOAuthError('auth_failed', '인증 과정에서 오류가 발생했습니다.', token);
    }
  });

  // 구글 인증 콜백
  app.get('/googlecallback', async (req: Request, res: Response, next: NextFunction) => {
    const code = req.query.code as string;
    const userId = req.query.state as string;

    if (!code || !userId) {
      throw new GoogleOAuthError('callback_failed', '인증 코드 또는 사용자 ID가 누락되었습니다.');
    }

    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    await userService.updateUser(userId, {
      googleRefreshToken: tokens.refresh_token,
    });
    const user = await userService.getUser(userId);
    const token = jwt.sign(
      { organizationId: user.organization.organizationId, userId },
      process.env.JWT_SECRET || 'default-secret-key',
      {
        expiresIn: '1h',
      },
    );

    res.render('pages/google-oauth-success', {
      token: token,
    });
  });

  // 캘린더 연동 상태 확인
  app.get('/calendar-status', async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new GoogleOAuthError('token_invalid', '유효하지 않은 토큰입니다.');
    }

    let decoded : {
      organizationId: string
      userId: string
    };

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
        organizationId: string;
        userId: string;
      }
    } catch (error) {
      throw new GoogleOAuthError('token_invalid', '토큰이 유효하지 않습니다.', token);
    }

    const user = await userService.getUser(decoded.userId);
    res.render('pages/google-calendar-status', {
      connected: !!user.googleRefreshToken,
      token: token,
    });
  });

  // 캘린더 연동 해제
  app.post('/disconnect-calendar', async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        res.status(400).json({ error: '유효하지 않은 토큰입니다.' });
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
        organizationId: string;
        userId: string;
      };

      await userService.updateUser(decoded.userId, {
        googleRefreshToken: null,
      });

      res.json({
        success: true,
        message: '구글 캘린더 연동이 해제되었습니다.',
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(400).json({ error: '토큰이 유효하지 않습니다.' });
        return;
      }
      res.status(500).json({ error: '연동 해제 중 오류가 발생했습니다.' });
    }
  });
};
