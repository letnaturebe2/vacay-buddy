import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../app';
import { ActionId } from '../../config/constants';
import { assert } from '../../config/utils';
import { ptoService } from '../../service';
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

  assert(!!body.view, 'body.view.id is undefined');
  const templates = await ptoService.getTemplates(context.team);

  if (templates.length === 0) {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        title: { type: 'plain_text', text: 'Request PTO' },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text:
                '*No PTO templates found* :warning:\n\n' +
                'You need to create a PTO template before you can submit a request.\n\n' +
                '*Please contact an administrator to create PTO templates.*',
            },
          },
        ],
        close: { type: 'plain_text', text: 'Cancel' },
      },
    });

    return;
  }

  // TODO : set user's default template
  const blocks = await buildPtoRequestModal(templates, templates[0], context.user);

  const private_metadata = JSON.stringify({
    viewId: body.view.id,
    viewHash: body.view.hash,
  });

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      private_metadata: private_metadata,
      callback_id: ActionId.SUBMIT_PTO_REQUEST,
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
