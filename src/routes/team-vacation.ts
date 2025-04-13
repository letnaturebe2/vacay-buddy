import { Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { organizationService, ptoService } from '../service';
import { getRequestStatus } from '../utils';
import { commonStyles, expiredTokenStyles } from './css';

export default (app: Application) => {
  app.get('/team-vacation-html', async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).send('Invalid token');
      return;
    }

    let decoded: { organizationId: string; userId?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
        organizationId: string;
        userId?: string;
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
          <p>슬랙 "팀 연차 현황 보기 버튼"을 통해 다시 접근해 주세요.</p>
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

    const { organizationId } = decoded;

    if (!organizationId) {
      res.status(400).send('Invalid token');
      return;
    }

    const users = await organizationService.getUsers(organizationId);
    const monthlyRequests = await ptoService.getOrganizationPtoRequestsMonthly(organizationId);
    const onGoingRequests = monthlyRequests.filter((monthlyRequest) => monthlyRequest.onGoing);
    const onVacationUsers: Set<string> = new Set(onGoingRequests.map((request) => request.user.userId));

    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>팀 연차 현황</title>
      <style>${commonStyles}</style>
    </head>
    <body>
      <h1>팀 연차 현황</h1>
      
      <div class="summary">
        <h2>요약 정보</h2>
        <p>총 팀원 수: ${users.length}명</p>
        <p>현재 연차 중인 팀원: ${onVacationUsers.size}명</p>
      </div>
      
      <h2>팀원 연차 현황</h2>
      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>연간 연차 일수</th>
            <th>사용한 연차 일수</th>
            <th>남은 연차 일수</th>
            <th>현재 상태</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map((user) => {
              const userRequests = monthlyRequests.filter((pto) => pto.user.id === user.id);
              const isOnVacation = userRequests.some((pto) => pto.onGoing);

              return `
              <tr class="member-row">
                <td>${user.name || `<@${user.userId}>`}</td>
                <td>${user.annualPtoDays}</td>
                <td>${user.usedPtoDays}</td>
                <td>${user.annualPtoDays - user.usedPtoDays}</td>
                <td>${isOnVacation ? '🏖️ 연차 중' : '🏢 근무 중'}</td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
      
    <h2>이달의 연차</h2>
    <table>
      <thead>
        <tr>
          <th>이름</th>
          <th>시작일</th>
          <th>종료일</th>
          <th>소모 일수</th>
          <th>유형</th>
          <th>상태</th>
        </tr>
      </thead>
      <tbody>
        ${(() => {
          return monthlyRequests
            .map((pto) => {
              const user = users.find((u) => u.id === pto.user.id);

              const [statusClass, statusText] = getRequestStatus(pto);

              return `
                <tr class="request-row">
                  <td>${user?.name || `<@${pto.user.userId}>`}</td>
                  <td>${pto.startDate.toLocaleDateString('ko-KR')}</td>
                  <td>${pto.endDate.toLocaleDateString('ko-KR')}</td>
                  <td>${pto.consumedDays}</td>
                  <td>${pto.template.title}</td>
                  <td class="${statusClass}">${statusText}</td>
                </tr>
              `;
            })
            .join('');
        })()}
      </tbody>
    </table>
      
    </body>
    </html>
  `;

    res.set('Content-Type', 'text/html');
    res.send(html);
  });
};
