import { ExpressReceiver, LogLevel } from '@slack/bolt';
import { Request, Response } from 'express';

const tempDB = new Map();

const receiver = new ExpressReceiver({
  logLevel: LogLevel.INFO,
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  clientId: process.env.SLACK_CLIENT_ID,
  clientSecret: process.env.SLACK_CLIENT_SECRET,
  stateSecret: process.env.SLACK_STATE_SECRET,
  scopes: process.env.SLACK_SCOPES?.split(',') || [],
  installationStore: {
    storeInstallation: async (installation) => {
      // Org-wide installation
      if (installation.isEnterpriseInstall && installation.enterprise !== undefined) {
        tempDB.set(installation.enterprise.id, installation);
        return;
      }
      // Single team installation
      if (installation.team !== undefined) {
        tempDB.set(installation.team.id, installation);
        return;
      }

      // installation.bot.token

      throw new Error('Failed saving installation data to installationStore');
    },
    fetchInstallation: async (installQuery) => {
      // Org-wide installation lookup
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        return tempDB.get(installQuery.enterpriseId);
      }
      // Single team installation lookup
      if (installQuery.teamId !== undefined) {
        return tempDB.get(installQuery.teamId);
      }
      throw new Error('Failed fetching installation');
    },
    deleteInstallation: async (installQuery) => {
      // Org-wide installation deletion
      if (installQuery.isEnterpriseInstall && installQuery.enterpriseId !== undefined) {
        tempDB.delete(installQuery.enterpriseId);
        return;
      }
      // Single team installation deletion
      if (installQuery.teamId !== undefined) {
        tempDB.delete(installQuery.teamId);
        return;
      }
      throw new Error('Failed to delete installation');
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
