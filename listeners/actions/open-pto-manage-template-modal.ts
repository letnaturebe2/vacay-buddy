import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import { assertNever } from '@slack/bolt/dist/helpers';
import type { OverflowAction } from '@slack/bolt/dist/types/actions/block-action';
import type { AnyBlock } from '@slack/types';
import type { AppContext } from '../../src/app';
import { ActionId, PtoTemplateManageType } from '../../src/config/constants';
import { assert } from '../../src/config/utils';
import { ptoService } from '../../src/service';
import { buildPtoTemplateDeleteModal } from './slack-ui/build-pto-template-delete-modal';
import { buildPtoTemplateModal } from './slack-ui/build-pto-template-modal';

export const openPtoManageTemplateModal = async ({
  ack,
  client,
  body,
  context,
  payload,
  action,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  assert(!!body.view, 'body.view.id is undefined in openPtoTemplateModal');

  // extract action type and template id from action
  // only edit and delete actions have template id
  let actionType = PtoTemplateManageType.CREATE;
  let templateId = -1;
  if (action.type === 'overflow') {
    const value = (action as OverflowAction).selected_option.value;
    const [type, id] = value.split('/');

    assert(type === PtoTemplateManageType.EDIT || type === PtoTemplateManageType.DELETE, 'type must be edit or delete');

    actionType = type;
    templateId = Number(id);
  }

  // build modal blocks based on action type
  let blocks: AnyBlock[];
  if (actionType === PtoTemplateManageType.CREATE) {
    assert(templateId === -1, 'create action should not have template id');
    blocks = await buildPtoTemplateModal();
  } else if (actionType === PtoTemplateManageType.EDIT) {
    assert(templateId > 0, 'templateId must be greater than 0');
    const template = await ptoService.getTemplate(templateId);
    blocks = await buildPtoTemplateModal(template);
  } else if (actionType === PtoTemplateManageType.DELETE) {
    assert(templateId > 0, 'templateId must be greater than 0');
    const template = await ptoService.getTemplate(templateId);
    blocks = await buildPtoTemplateDeleteModal(template);
  } else {
    assertNever(actionType);
  }

  const private_metadata = JSON.stringify({
    viewId: body.view.id,
    viewHash: body.view.hash,
    templateId: templateId,
    actionType: actionType,
  });

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      private_metadata: private_metadata,
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
