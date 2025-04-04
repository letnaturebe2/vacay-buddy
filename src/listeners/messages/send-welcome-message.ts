import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../app';
import { buildInstallMessage } from '../events/slack-ui/build-install-message';

const sendWelcomeMessage = async ({
  context,
  say,
}: AllMiddlewareArgs<AppContext> & SlackEventMiddlewareArgs<'message'>) => {
  await say({
    text: `Hello <@${context.user.userId}>!`,
    blocks: buildInstallMessage(context.locale, context.organization.organizationId, context.organization.appId),
  });
};

export default sendWelcomeMessage;
