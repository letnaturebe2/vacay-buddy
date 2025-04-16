import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../app';
import { ActionId } from '../../constants';
import { t } from '../../i18n';
import { ptoService } from '../../service';
import { assert } from '../../utils';
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
  const templates = await ptoService.getTemplates(context.organization);
  const activeTemplates = templates.filter((template) => template.enabled);

  if (activeTemplates.length === 0) {
    await client.views.open({
      trigger_id: body.trigger_id,
      view: {
        type: 'modal',
        title: { type: 'plain_text', text: t(context.locale, 'request_pto') },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text:
                `*${t(context.locale, 'no_templates_found')}* :warning:\n\n` +
                `${t(context.locale, 'no_templates_warning')}\n\n` +
                `*${t(context.locale, 'no_templates_contact_admin')}*`,
            },
          },
        ],
        close: { type: 'plain_text', text: t(context.locale, 'close') },
      },
    });

    return;
  }

  // TODO : set user's default template
  const blocks = await buildPtoRequestModal(context, activeTemplates, activeTemplates[0], context.user);

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
      title: { type: 'plain_text', text: t(context.locale, 'request_pto') },
      blocks: blocks,
      submit: {
        type: 'plain_text',
        text: t(context.locale, 'save_changes'),
      },
      close: { type: 'plain_text', text: t(context.locale, 'cancel') },
    },
  });
};
