import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AnyBlock } from '@slack/types';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import { organizationService } from '../../service';
import { assert, showAdminSection } from '../../utils';
import { buildAppHome } from '../events/slack-ui/build-app-home';

export const updateBackToHome = async ({
  ack,
  client,
  body,
  context,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  assert(body.view !== undefined, 'No view found in body');

  const admins = await organizationService.getAdmins(context.organization);
  const blocks: AnyBlock[] = await buildAppHome(context, showAdminSection(context.user, admins));
  const view: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view,
  });
};
