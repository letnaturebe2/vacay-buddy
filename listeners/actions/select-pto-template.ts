import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { StaticSelectAction } from '@slack/bolt/dist/types/actions/block-action';
import type { AppContext } from '../../app';
import { ActionId } from '../../config/constants';
import { assert } from '../../config/utils';
import { ptoService } from '../../service';
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
  const ptoTemplates = await ptoService.getTemplates(context.team);
  const selectedTemplate = ptoTemplates.find((template) => template.id === selectedTemplateId);

  assert(!!selectedTemplate, 'selected template not found');

  const blocks = await buildPtoRequestModal(ptoTemplates, selectedTemplate, context.user);

  await client.views.update({
    view_id: body.view.id,
    view: {
      type: 'modal',
      private_metadata: body.view.private_metadata,
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
