import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { HomeView } from '@slack/types/dist/views';
import { assert } from '../../config/utils';
import { buildAdminPage } from './slack-ui/build-admin-page';

export const updateAdminPage = async ({
  ack,
  client,
  body,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  assert(body.view !== undefined, 'body.view is undefined in callbackBackToHome function');

  const ptoTemplates = [
    { name: 'Full-day PTO', status: ':white_check_mark: Enabled', description: 'Take a full day off' },
    {
      name: 'Half-day Morning PTO',
      status: ':white_check_mark: Enabled',
      description: 'Take a half day off in the morning',
    },
    {
      name: 'Half-day Afternoon PTO',
      status: ':x: Disabled',
      description:
        'Take a half day off in the afternoon, starting after lunch and ending at the close of business hours',
    },
  ];

  const blocks = await buildAdminPage(ptoTemplates);

  const view: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view: view,
  });
};
