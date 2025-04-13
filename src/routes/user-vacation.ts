import { Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ptoService, userService } from '../service';
import { getRequestStatus } from '../utils';
import { commonStyles, expiredTokenStyles } from './css';

export default (app: Application) => {
  app.get('/user-vacation-html', async (req: Request, res: Response) => {
    const { token } = req.query;

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
        const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>만료된 접근</title>
      <style>${expiredTokenStyles}</style>
    </head>
    <body>
      <div class="container">
        <h1>접근 시간이 만료되었습니다</h1>
        <div class="message">
          <p>보안상의 이유로 접근 링크가 1시간 후에 만료됩니다.</p>
          <p>슬랙에서 다시 접근해 주세요.</p>
        </div>
      </div>
    </body>
    </html>
    `;
        res.set('Content-Type', 'text/html');
        res.status(401).send(html);
        return;
      }

      // 그 외 다른 토큰 에러의 경우
      res.status(401).send('유효하지 않은 토큰입니다');
      return;
    }

    const { organizationId, userId } = decoded;

    if (!organizationId || !userId) {
      res.status(400).send('Invalid token');
      return;
    }

    // 사용자의 모든 휴가 요청을 가져오기
    const user = await userService.getUser(userId);
    const userRequests = await ptoService.getMyPtoRequests(user);

    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>내 연차 요약</title>
      <style>${commonStyles}</style>
    </head>
    <body>
      <h1>내 연차 요약</h1>

      <div class="summary">
        <h2>휴가 정보</h2>
        <p>사용한 연차: ${user.usedPtoDays}/${user.annualPtoDays} 일</p>
        <p>남은 일수: ${user.annualPtoDays - user.usedPtoDays} 일</p>
      </div>

      <h2>내 연차 요청 목록</h2>
      ${
        userRequests.length === 0
          ? '<p>등록된 연차 요청이 없습니다.</p>'
          : `
          <table>
            <thead>
              <tr>
                <th>제목</th>
                <th>시작일</th>
                <th>종료일</th>
                <th>소모 일수</th>
                <th>유형</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              ${userRequests
                .map((request) => {
                  const [statusClass, statusText] = getRequestStatus(request);
                  return `
                  <tr class="request-row">
                    <td>${request.title}</td>
                    <td>${request.startDate.toLocaleDateString('ko-KR')}</td>
                    <td>${request.endDate.toLocaleDateString('ko-KR')}</td>
                    <td>${request.consumedDays}</td>
                    <td>${request.template.title}</td>
                    <td class="${statusClass}">${statusText}</td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>
        `
      }
    </body>
    </html>
    `;

    res.set('Content-Type', 'text/html');
    res.send(html);
  });
};
