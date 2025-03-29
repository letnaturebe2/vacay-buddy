import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import type { AnyBlock } from '@slack/types';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import { organizationService } from '../../service';
import { showAdminSection } from '../../utils';
import { buildAppHome } from './slack-ui/build-app-home';

const appHomeOpenedCallback = async ({
  client,
  event,
  logger,
  context,
}: AllMiddlewareArgs<AppContext> & SlackEventMiddlewareArgs<'app_home_opened'>) => {
  if (event.tab !== 'messages') {
    return;
  }

  const admins = await organizationService.getAdmins(context.organization);
  const blocks: AnyBlock[] = await buildAppHome(context, showAdminSection(context.user, admins));

  const view: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await client.views.publish({
    user_id: event.user,
    view,
  });
};

export default appHomeOpenedCallback;
