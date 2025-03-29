import { ExpressReceiver, LogLevel } from '@slack/bolt';
import { Request, Response } from 'express';
import { organizationService, ptoService } from './service';
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

      const newOrganization = await organizationService.createOrganization(
        organizationId,
        installation.isEnterpriseInstall !== undefined,
        JSON.stringify(installation),
      );

      await ptoService.createDefaultPtoTemplates(newOrganization);
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
  redirectUri: 'https://dolphin-living-cattle.ngrok-free.app/slack/oauth_redirect',
  installerOptions: {
    // If true, /slack/install redirects installers to the Slack Authorize URL
    // without rendering the web page with "Add to Slack" button
    directInstall: false,
    redirectUriPath: '/slack/oauth_redirect',
  },
});

// Simple HTML endpoint example
receiver.app.get('/', (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Hello Slack App!!!</title></head>
      <body><h1>Hello from Slack App@@@</h1></body>
    </html>
  `;

  res.set('Content-Type', 'text/html');
  res.send(html);
});

export default receiver;
