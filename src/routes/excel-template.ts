import { type Application, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as XLSX from 'xlsx';
import { organizationService } from '../service';

export default (app: Application) => {
  app.get('/download-excel-template', async (req: Request, res: Response) => {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).send('Invalid token');
      return;
    }

    let decoded: { organizationId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as { organizationId: string };
    } catch (error) {
      res.status(401).send('Invalid token');
      return;
    }

    const { organizationId } = decoded;

    const users = await organizationService.getUsers(organizationId);

    if (users.length === 0) {
      res.status(404).send('No users found for this organization');
      return;
    }

    const data = users.map((user) => ({
      slack_id: user.userId,
      name: user.name,
      annual_pto_days: user.annualPtoDays,
      remaining_pto_days: user.annualPtoDays - user.usedPtoDays,
    }));

    const wb = XLSX.utils.book_new();

    // create worksheet
    const ws = XLSX.utils.json_to_sheet(data, {
      header: ['slack_id', 'name', 'annual_pto_days', 'remaining_pto_days'],
    });

    // worksheet styles
    ws['!cols'] = [
      { wch: 20 }, // slack_id
      { wch: 20 }, // name
      { wch: 20 }, // annual_pto_days
      { wch: 20 }, // remaining_pto_days
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'User Information');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // 응답 헤더 설정
    res.setHeader('Content-Disposition', 'attachment; filename=user_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // 파일 전송
    res.send(Buffer.from(buf));
  });
};
