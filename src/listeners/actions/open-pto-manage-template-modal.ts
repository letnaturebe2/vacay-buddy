import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import { assertNever } from '@slack/bolt/dist/helpers';
import type { OverflowAction } from '@slack/bolt/dist/types/actions/block-action';
import type { AnyBlock } from '@slack/types';
import type { AppContext } from '../../app';
import { ActionId, PtoTemplateManageType } from '../../constants';
import { t } from '../../i18n';
import { ptoService } from '../../service';
import { assert } from '../../utils';
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
    blocks = await buildPtoTemplateModal(context);
  } else if (actionType === PtoTemplateManageType.EDIT) {
    assert(templateId > 0, 'templateId must be greater than 0');
    const template = await ptoService.getTemplate(templateId);
    blocks = await buildPtoTemplateModal(context, template);
  } else if (actionType === PtoTemplateManageType.DELETE) {
    assert(templateId > 0, 'templateId must be greater than 0');
    const template = await ptoService.getTemplate(templateId);
    blocks = await buildPtoTemplateDeleteModal(context, template);
  } else {
    assertNever(actionType);
  }

  const private_metadata = JSON.stringify({
    viewId: body.view.id,
    viewHash: body.view.hash,
    templateId: templateId,
    actionType: actionType,
  });

  const modalTitle =
    actionType === PtoTemplateManageType.CREATE
      ? t(context.locale, 'create_pto_template')
      : actionType === PtoTemplateManageType.EDIT
        ? t(context.locale, 'edit_pto_template')
        : t(context.locale, 'delete_pto_template');

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      private_metadata: private_metadata,
      callback_id: ActionId.SUBMIT_PTO_TEMPLATE_MANAGE,
      title: { type: 'plain_text', text: modalTitle },
      blocks: blocks,
      submit: {
        type: 'plain_text',
        text: t(context.locale, 'submit'),
      },
      close: {
        type: 'plain_text',
        text: t(context.locale, 'cancel'),
      },
    },
  });
};
