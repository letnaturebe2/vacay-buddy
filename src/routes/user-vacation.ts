import { Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PtoRequestStatus } from '../constants';
import { ptoService, userService } from '../service';

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
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
          text-align: center;
        }
        .container {
          max-width: 600px;
          margin: 50px auto;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #e74c3c;
        }
        p {
          font-size: 18px;
          line-height: 1.6;
        }
        .message {
          margin: 20px 0;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 4px;
        }
      </style>
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
        .request-row:hover {
          background-color: #e1f5fe;
        }
        .status-approved {
          color: #43a047;
          font-weight: bold;
        }
        .status-rejected {
          color: #e53935;
          font-weight: bold;
        }
        .status-pending {
          color: #fb8c00;
          font-weight: bold;
        }
        .status-ongoing {
          color: #2196f3;
          font-weight: bold;
        }
        .status-completed {
          color: #757575;
        }
        .status-scheduled {
          color: #9c27b0;
        }
      </style>
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
                  const today = new Date();
                  let statusClass = '';
                  let statusText = '';

                  if (request.status === PtoRequestStatus.Approved) {
                    if (request.endDate < today) {
                      statusClass = 'status-completed';
                      statusText = '완료';
                    } else if (request.startDate <= today && request.endDate >= today) {
                      statusClass = 'status-ongoing';
                      statusText = '진행 중';
                    } else {
                      statusClass = 'status-scheduled';
                      statusText = '예정';
                    }
                  } else if (request.status === PtoRequestStatus.Rejected) {
                    statusClass = 'status-rejected';
                    statusText = '거부됨';
                  } else {
                    statusClass = 'status-pending';
                    statusText = '대기 중';
                  }

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
