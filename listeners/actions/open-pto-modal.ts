import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../app';
import { ActionId } from '../../config/constants';
import { buildPtoModal } from './slack-ui/build-pto-modal';

export const openPtoModal = async ({
  ack,
  client,
  body,
  context,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  const blocks = await buildPtoModal();

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: ActionId.SUBMIT_ADMIN_MANAGE,
      title: { type: 'plain_text', text: 'Manage Admins' },
      blocks: blocks,
      submit: {
        type: 'plain_text',
        text: 'Save Changes',
      },
      close: { type: 'plain_text', text: 'Cancel' },
    },
  });
};
