import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../app';
import { ActionId } from '../../constants';
import { ptoService } from '../../service';
import { assert } from '../../utils';
import { buildRequestDecisionModal } from './slack-ui/build-request-decision-modal';

export const openRequestApproveModal = async ({
  ack,
  client,
  body,
  context,
  payload,
  action,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  assert(action.type === 'button' && !!action.value, 'action type must be button and have value');

  const approvalId = Number(action.value);
  const ptoApproval = await ptoService.getApproval(approvalId);
  const isApprover = ptoApproval.approverId === context.user.id;
  const blocks = await buildRequestDecisionModal(ptoApproval.ptoRequest, isApprover);

  let privateMetadata = '{}';

  // if the request is from a modal, store the viewId and viewHash for render the updated view
  if (body.view) {
    privateMetadata = JSON.stringify({
      viewId: body.view.id,
      viewHash: body.view.hash,
    });
  }

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      private_metadata: privateMetadata,
      callback_id: ActionId.SUBMIT_DECISION_REQUEST,
      title: { type: 'plain_text', text: 'PTO Request Review' },
      blocks: blocks,
      ...(isApprover && {
        submit: {
          type: 'plain_text',
          text: 'Submit',
        },
      }),
    },
  });
};
