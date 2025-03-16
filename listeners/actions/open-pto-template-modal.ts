import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../app';
import { ActionId } from '../../config/constants';
import { assert } from '../../config/utils';
import { buildPtoTemplateModal } from './slack-ui/build-pto-template-modal';

export const openPtoTemplateModal = async ({
  ack,
  client,
  body,
  context,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  const blocks = await buildPtoTemplateModal();

  assert(!!body.view, 'body.view.id is undefined in openPtoTemplateModal');

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      private_metadata: JSON.stringify({ viewId: body.view.id, viewHash: body.view.hash }),
      callback_id: ActionId.SUBMIT_PTO_TEMPLATE_MANAGE,
      title: { type: 'plain_text', text: 'Manage PTO Template' },
      blocks: blocks,
      submit: {
        type: 'plain_text',
        text: 'Save Changes',
      },
      close: { type: 'plain_text', text: 'Cancel' },
    },
  });
};
