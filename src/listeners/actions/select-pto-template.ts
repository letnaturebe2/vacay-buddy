import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { StaticSelectAction } from '@slack/bolt/dist/types/actions/block-action';
import type { AppContext } from '../../app';
import { ActionId } from '../../constants';
import { t } from '../../i18n';
import { ptoService } from '../../service';
import { assert } from '../../utils';
import { buildPtoRequestModal } from './slack-ui/build-pto-request-modal';

export const selectPtoTemplate = async ({
  ack,
  client,
  body,
  context,
  payload,
  action,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  assert(!!body.view, 'body.view.id is undefined');

  const selectedTemplateId = Number((action as StaticSelectAction).selected_option.value);
  const ptoTemplates = await ptoService.getTemplates(context.organization);
  const selectedTemplate = ptoTemplates.find((template) => template.id === selectedTemplateId);

  assert(!!selectedTemplate, 'selected template not found');

  const blocks = await buildPtoRequestModal(context, ptoTemplates, selectedTemplate, context.user);

  await client.views.update({
    view_id: body.view.id,
    view: {
      type: 'modal',
      private_metadata: body.view.private_metadata,
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
