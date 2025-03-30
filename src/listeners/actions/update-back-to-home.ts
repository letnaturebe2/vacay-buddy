import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AnyBlock } from '@slack/types';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import { organizationService } from '../../service';
import { showAdminSection } from '../../utils';
import { buildAppHome } from '../events/slack-ui/build-app-home';

export const updateBackToHome = async ({
  ack,
  client,
  body,
  context,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  const admins = await organizationService.getAdmins(context.organization);
  const blocks: AnyBlock[] = await buildAppHome(context, showAdminSection(context.user, admins));
  const view: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await client.views.publish({
    user_id: body.user.id,
    view,
  });
};
