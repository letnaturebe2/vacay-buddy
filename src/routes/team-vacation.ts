import { Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { organizationService, ptoService } from '../service';
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
    const onVacationUsers: Set<string> = new Set(onGoingRequests.map((request) => request.user.userId));

    const html = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>팀 연차 현황</title>
      <link rel="stylesheet" href="/assets/css/jquery.dataTables.min.css">
      <link rel="stylesheet" href="/assets/css/responsive.dataTables.min.css">
      <link rel="stylesheet" href="/assets/css/fontawesome.min.css">
      <script src="/assets/js/jquery.min.js"></script>
      <script src="/assets/js/jquery.dataTables.min.js"></script>
      <script src="/assets/js/dataTables.responsive.min.js"></script>
      <style>
        ${commonStyles}
      .team-card {
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        padding: 20px;
        margin-bottom: 30px;
      }
      .team-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 20px;
      }
      .stat-item {
        text-align: center;
        padding: 15px;
        background-color: #f8f9fa;
        border-radius: 6px;
      }
      .stat-item h3 {
        margin-bottom: 10px;
        color: #1976d2;
        font-size: 14px;
      }
      .stat-item .value {
        font-size: 28px;
        font-weight: bold;
        color: #333;
      }
      .stat-item .icon {
        font-size: 24px;
        margin-bottom: 10px;
        color: #1976d2;
      }
      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
      .status-on-vacation {
        background-color: #e8f5e8;
        color: #2e7d32;
      }
      .status-working {
        background-color: #e3f2fd;
        color: #1976d2;
      }
      .user-link {
        cursor: pointer;
        transition: background-color 0.2s ease;
        text-decoration: none;
        color: inherit;
      }
      .user-link:hover {
        background-color: #f0f7ff !important;
      }
      
      /* Mobile responsiveness improvements */
      @media (max-width: 768px) {
        .team-stats {
          grid-template-columns: repeat(2, 1fr);
        }
        .stat-item .value {
          font-size: 24px;
        }
        .dtr-details {
          width: 100%;
        }
        .dtr-details li {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        .dtr-details li:last-child {
          border-bottom: none;
        }
        .dtr-title {
          font-weight: bold;
          flex: 1;
        }
        .dtr-data {
          flex: 2;
          text-align: right;
        }
      }
      </style>
    </head>
    <body>
      <h1><i class="fas fa-users"></i> 팀 연차 현황</h1>
      
      <div class="team-card">
        <h2><i class="fas fa-chart-bar"></i> 팀 요약 정보</h2>
        <div class="team-stats">
          <div class="stat-item">
            <div class="icon"><i class="fas fa-users"></i></div>
            <h3>총 팀원 수</h3>
            <div class="value">${users.length}명</div>
          </div>
          <div class="stat-item">
            <div class="icon"><i class="fas fa-umbrella-beach"></i></div>
            <h3>현재 연차 중</h3>
            <div class="value">${onVacationUsers.size}명</div>
          </div>
        </div>
      </div>
      
      <div class="team-card">
        <table id="teamTable" class="display responsive nowrap" style="width:100%">
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
                const isOnVacation = onVacationUsers.has(user.userId);

                const userToken = jwt.sign(
                  {
                    organizationId: organizationId,
                    userId: user.userId,
                  },
                  process.env.JWT_SECRET || 'default-secret-key',
                  { expiresIn: '1h' },
                );

                return `
                <tr class="member-row user-link" onclick="window.location.href='/user-vacation-html?token=${userToken}'">
                  <td><i class="fas fa-user"></i> ${user.name || `<@${user.userId}>`}</td>
                  <td>${user.annualPtoDays}일</td>
                  <td>${user.usedPtoDays}일</td>
                  <td>${user.annualPtoDays - user.usedPtoDays}일</td>
                  <td>
                    <span class="status-badge ${isOnVacation ? 'status-on-vacation' : 'status-working'}">
                      ${isOnVacation ? '🏖️ 연차 중' : '🏢 근무 중'}
                    </span>
                  </td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>

      <script>
        $(document).ready(function() {
          // Initialize DataTables with mobile-optimized settings
          $('#teamTable').DataTable({
            language: {
              url: '/assets/i18n/ko.json'
            },
            responsive: true,
            order: [[4, 'asc'], [0, 'asc']], // Sort by status first, then by name
            pageLength: 10,
            autoWidth: false,
            columnDefs: [
              { responsivePriority: 1, targets: [0, 4] }, // Name and status always visible
              { responsivePriority: 2, targets: [2, 3] }, // Used and remaining days second priority
              { responsivePriority: 3, targets: [1] }     // Annual days third priority
            ]
          });
        });
      </script>
    </body>
    </html>
  `;

    res.set('Content-Type', 'text/html');
    res.send(html);
  });
};
