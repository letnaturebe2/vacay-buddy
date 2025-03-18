import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../app';
import { assert } from '../../config/utils';
import { buildPtoRequestModal } from './slack-ui/build-pto-request-modal';

export const openPtoRequestModal = async ({
  ack,
  client,
  body,
  context,
  payload,
  action,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  assert(!!body.view, 'body.view.id is undefined in openPtoTemplateModal');

  const blocks = await buildPtoRequestModal();

  const private_metadata = JSON.stringify({
    viewId: body.view.id,
    viewHash: body.view.hash,
  });

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      private_metadata: private_metadata,
      callback_id: "aa", // TODO : add callback_id
      title: { type: 'plain_text', text: 'Request PTO' },
      blocks: blocks,
      submit: {
        type: 'plain_text',
        text: 'Save Changes',
      },
      close: { type: 'plain_text', text: 'Cancel' },
    },
  });
};
