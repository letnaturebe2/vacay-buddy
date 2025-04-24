import { ExpressReceiver, LogLevel } from '@slack/bolt';
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

receiver.app.use(express.json());

routes.register(receiver.app);

export default receiver;
