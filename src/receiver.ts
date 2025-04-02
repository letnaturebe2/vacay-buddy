import { ExpressReceiver, LogLevel } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import * as XLSX from 'xlsx';
import { buildInstallMessage } from './listeners/events/slack-ui/build-install-message';
import { organizationService, ptoService, userService } from './service';
import { assert } from './utils';

const receiver = new ExpressReceiver({
  logLevel: LogLevel.INFO,
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: process.env.SLACK_SCOPES?.split(',') || [],
  installationStore: {
    storeInstallation: async (installation) => {
      const organizationId = installation.enterprise?.id || installation.team?.id;

      assert(organizationId !== undefined, 'Organization ID is undefined');
      assert(installation.bot !== undefined, 'Bot installation is undefined');
      assert(installation.appId !== undefined, 'App ID is undefined');

      const client = new WebClient(installation.bot.token);
      const result = await client.users.info({
        user: installation.user.id,
        include_locale: true,
      });

      const locale = result.user?.locale || 'en-US';

      const organization = await organizationService.getOrganization(organizationId);
      if (organization) {
        await organizationService.deleteOrganization(organizationId);
      }

      // create organization, user, and default pto templates
      const newOrganization = await organizationService.createOrganization(
        organizationId,
        installation.isEnterpriseInstall !== undefined,
        JSON.stringify(installation),
      );
      await ptoService.createDefaultPtoTemplates(locale, newOrganization);
      const installer = await userService.getOrCreateUser(installation.user.id, newOrganization, true);

      // Create users for all team members
      await organizationService.importTeamMembers(installation.bot.token, newOrganization);

      // send welcome message to the installer
      await client.chat.postMessage({
        channel: installer.userId,
        text: `Hello <@${installer.userId}>! Thanks for installing the app!`,
        blocks: buildInstallMessage(locale, newOrganization.organizationId, installation.appId),
      });
    },

    fetchInstallation: async (installQuery) => {
      const organizationId = installQuery.enterpriseId || installQuery.teamId;
      assert(organizationId !== undefined, 'Organization ID is undefined');

      const organization = await organizationService.getOrganization(organizationId);
      assert(organization !== null, 'Organization not found');

      return JSON.parse(organization.installation);
    },
    deleteInstallation: async (installQuery) => {
      const organizationId = installQuery.enterpriseId || installQuery.teamId;
      assert(organizationId !== undefined, 'Organization ID is undefined');
      await organizationService.deleteOrganization(organizationId);
    },
  },
  installerOptions: {
    directInstall: true,
    redirectUriPath: '/slack/oauth_redirect',
  },
});

receiver.app.get('/download-excel-template', async (req: Request, res: Response) => {
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

  // 데이터로 시트 생성
  const ws = XLSX.utils.json_to_sheet(data, {
    header: ['slack_id', 'name', 'annual_pto_days', 'remaining_pto_days'],
  });

  // 워크시트 스타일 조정
  ws['!cols'] = [
    { wch: 20 }, // slack_id
    { wch: 20 }, // name
    { wch: 20 }, // annual_pto_days
    { wch: 20 }, // remaining_pto_days
  ];

  // 워크시트 추가
  XLSX.utils.book_append_sheet(wb, ws, 'User Information');

  // 버퍼로 변환
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  // 응답 헤더 설정
  res.setHeader('Content-Disposition', 'attachment; filename=user_template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  // 파일 전송
  res.send(Buffer.from(buf));
});

// Simple HTML endpoint example
receiver.app.get('/', async (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Hello Slack App!!!</title></head>
      <body>
        <h1>Hello from Slack App</h1>
        <button onclick="window.location.href='/slack/install'">Install</button>
      </body>
    </html>
  `;
  res.set('Content-Type', 'text/html');
  res.send(html);
});

export default receiver;
