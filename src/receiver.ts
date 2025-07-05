import { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import { ExpressReceiver, Installation, LogLevel } from '@slack/bolt';
import type { CodedError } from '@slack/oauth/dist/errors';
import type { InstallURLOptions } from '@slack/oauth/dist/install-url-options';
import { WebClient } from '@slack/web-api';
import ejs from 'ejs';
import express, { ErrorRequestHandler } from 'express';
import { buildInstallMessage } from './listeners/events/slack-ui/build-install-message';
import routes from './routes';
import { organizationService, ptoService, userService } from './service';
import { assert, HttpError } from './utils';

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
      success: async (
        installation: Installation,
        installOptions: InstallURLOptions,
        req: IncomingMessage,
        res: ServerResponse,
      ) => {
        try {
          const html = await ejs.renderFile(path.join(process.cwd(), 'src/views/pages/oauth-success.ejs'), {
            teamId: installation.team?.id || installation.enterprise?.id,
          });
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        } catch (error) {
          console.error('Error rendering OAuth success template:', error);
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Internal Server Error');
        }
      },
      failure: async (
        error: CodedError,
        installOptions: InstallURLOptions,
        req: IncomingMessage,
        res: ServerResponse,
      ) => {
        try {
          const html = await ejs.renderFile(path.join(process.cwd(), 'src/views/pages/oauth-failure.ejs'), {
            error: error,
          });
          res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        } catch (renderError) {
          console.error('Error rendering OAuth failure template:', renderError);
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Internal Server Error');
        }
      },
    },
  },
});

// Configure EJS template engine
receiver.app.set('view engine', 'ejs');
receiver.app.set('views', path.join(process.cwd(), 'src/views'));

// Configure middleware to parse JSON requests
receiver.app.use(express.json());
receiver.app.use(express.urlencoded({ extended: true }));

// Serve static assets (CSS, JS, fonts) from the public directory
receiver.app.use('/assets', express.static(path.join(process.cwd(), 'public/assets')));

routes.register(receiver.app);

// Global error handler for Express routes
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Determine if it's an HttpError or unexpected error
  const isHttpError = err instanceof HttpError;
  const statusCode = isHttpError ? err.statusCode : 500;

  // Log only unexpected errors (500) with full stack trace
  if (!isHttpError) {
    console.error('Unexpected error:', err.stack || err);
  }

  // API routes: return JSON
  if (req.path.startsWith('/api')) {
    res.status(statusCode).json({
      error: getErrorTitle(statusCode),
      message: isHttpError ? err.message : 'Something went wrong',
    });
    return;
  }

  // Web routes: render error page
  res.status(statusCode).render('pages/error', {
    error: {
      message: err.message,
      statusCode: statusCode,
    },
  });
};

// Helper function to get error title by status code
function getErrorTitle(statusCode: number): string {
  const titles: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
  };

  return titles[statusCode] || 'Error';
}

receiver.app.use(errorHandler);

export default receiver;
