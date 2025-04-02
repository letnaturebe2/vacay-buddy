import { Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { organizationService, ptoService } from '../service';

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
      res.status(401).send('Invalid token');
      return;
    }

    const { organizationId, userId } = decoded;

    if (!organizationId) {
      res.status(400).send('Invalid token');
      return;
    }

    const users = await organizationService.getUsers(organizationId);
    const ptoRequests = await ptoService.getOrganizationPtoRequests(organizationId);

    // HTML 생성
    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>팀 휴가 현황</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #1976d2;
          border-bottom: 2px solid #1976d2;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f9f9f9;
        }
        .summary {
          margin-top: 30px;
          padding: 15px;
          background-color: #e3f2fd;
          border-radius: 4px;
        }
        .member-row:hover {
          background-color: #e1f5fe;
        }
      </style>
    </head>
    <body>
      <h1>팀 휴가 현황</h1>
      
      <div class="summary">
        <h2>요약 정보</h2>
        <p>총 팀원 수: ${users.length}명</p>
        <p>현재 휴가 중인 팀원: ${
          ptoRequests.filter((pto) => new Date(pto.startDate) <= new Date() && new Date(pto.endDate) >= new Date())
            .length
        }명</p>
      </div>
      
      <h2>팀원 휴가 현황</h2>
      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>연간 휴가 일수</th>
            <th>사용한 휴가 일수</th>
            <th>남은 휴가 일수</th>
            <th>현재 상태</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map((user) => {
              const userRequests = ptoRequests.filter((pto) => pto.user.id === user.id);
              const isOnVacation = userRequests.some((pto) => pto.onGoing);

              return `
              <tr class="member-row">
                <td>${user.name || `<@${user.userId}>`}</td>
                <td>${user.annualPtoDays}</td>
                <td>${user.usedPtoDays}</td>
                <td>${user.annualPtoDays - user.usedPtoDays}</td>
                <td>${isOnVacation ? '🏖️ 휴가 중' : '🏢 근무 중'}</td>
              </tr>
            `;
            })
            .join('')}
        </tbody>
      </table>
      
      <h2>예정된 휴가</h2>
      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>휴가 시작일</th>
            <th>휴가 종료일</th>
            <th>휴가 일수</th>
            <th>휴가 유형</th>
          </tr>
        </thead>
        <tbody>
          ${ptoRequests
            .filter((pto) => new Date(pto.startDate) >= new Date())
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .map((pto) => {
              const user = users.find((u) => u.id === pto.user.id);
              return `
                <tr>
                  <td>${user?.name || `<@${pto.user.userId}>`}</td>
                  <td>${new Date(pto.startDate).toLocaleDateString('ko-KR')}</td>
                  <td>${new Date(pto.endDate).toLocaleDateString('ko-KR')}</td>
                  <td>${pto.consumedDays}</td>
                  <td>${pto.template.title}</td>
                </tr>
              `;
            })
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

    res.set('Content-Type', 'text/html');
    res.send(html);
  });
};
