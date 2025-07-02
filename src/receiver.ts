import { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { ExpressReceiver, Installation, LogLevel } from '@slack/bolt';
import type { CodedError } from '@slack/oauth/dist/errors';
import type { InstallURLOptions } from '@slack/oauth/dist/install-url-options';
import { WebClient } from '@slack/web-api';
import express from 'express';
import { buildInstallMessage } from './listeners/events/slack-ui/build-install-message';
import routes from './routes';
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
      const isEnterprise = installation.isEnterpriseInstall !== undefined;
      const installationJson = JSON.stringify(installation);

      let organization = await organizationService.getOrganizationWithDeleted(organizationId);
      if (organization) {
        organization = await organizationService.restoreOrganization(organizationId, isEnterprise, installationJson);
      } else {
        // create organization, user, and default pto templates
        organization = await organizationService.createOrganization(organizationId, isEnterprise, installationJson);
        await ptoService.createDefaultPtoTemplates(locale, organization);
      }

      const installer = await userService.getOrCreateUser(installation.user.id, organization, true);

      // ensure installer is saved and admin, if organization is restored, it might not be admin
      if (!installer.isAdmin) {
        installer.isAdmin = true;
        await userService.updateUser(installer.userId, installer);
      }

      // Create users for all team members
      await organizationService.importTeamMembers(installation.bot.token, organization);

      // send welcome message to the installer
      await client.chat.postMessage({
        channel: installer.userId,
        text: `Hello <@${installer.userId}>! Thanks for installing the app!`,
        blocks: buildInstallMessage(locale, organization.organizationId, installation.appId),
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
    callbackOptions: {
      success: (
        installation: Installation,
        installOptions: InstallURLOptions,
        req: IncomingMessage,
        res: ServerResponse,
      ) => {
        const html = `
          <!DOCTYPE html>
          <html lang="ko">
          <head>
            <title>설치 완료</title>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f4f4f4;
              }
              .success-container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .success-icon {
                color: #2ea44f;
                font-size: 48px;
                margin-bottom: 20px;
              }
              a {
                color: #4A154B;
                text-decoration: none;
                font-weight: 600;
              }
              a:hover {
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <div class="success-container">
              <div class="success-icon">✓</div>
              <h1>설치가 완료되었습니다!</h1>
              <p>감사합니다! Slack 앱으로 리다이렉트 중입니다...</p>
              <p>
                <a href="slack://open">여기를 클릭하세요</a>. 
                브라우저 버전의 Slack을 사용하신다면, 
                <a href="https://app.slack.com/client/${installation.team?.id || installation.enterprise?.id}">이 링크를 대신 클릭하세요</a>.
              </p>
            </div>
            <script>
            </script>
          </body>
          </html>
        `;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      },
      failure: (error: CodedError, installOptions: InstallURLOptions, req: IncomingMessage, res: ServerResponse) => {
        const html = `
          <!DOCTYPE html>
          <html lang="ko">
          <head>
            <title>설치 실패</title>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                background-color: #f4f4f4;
              }
              .error-container {
                text-align: center;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .error-icon {
                color: #d73a49;
                font-size: 48px;
                margin-bottom: 20px;
              }
            </style>
          </head>
          <body>
            <div class="error-container">
              <div class="error-icon">✗</div>
              <h1>설치 중 오류가 발생했습니다</h1>
              <p>${error.message}</p>
              <p>다시 시도해주세요.</p>
            </div>
          </body>
          </html>
        `;
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      },
    },
  },
});

// Serve static assets (CSS, JS, fonts) from the public directory
receiver.app.use('/assets', express.static(path.join(process.cwd(), 'public/assets')));

routes.register(receiver.app);

export default receiver;
