import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../src/app';
import { ActionId } from '../../src/config/constants';
import { assert } from '../../src/config/utils';
import type { PtoApproval } from '../../entity/pto-approval.model';
import { ptoService } from '../../src/service';
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

  const requestId = Number(action.value);
  const request = await ptoService.getPtoRequest(requestId);
  const currentPtoApproval: PtoApproval | undefined = request.approvals.find(
    (approve) => approve.id === request.currentApprovalId,
  );
  const isApprover = currentPtoApproval?.approverId === context.user.id;
  const blocks = await buildRequestDecisionModal(request, isApprover);

  let privateMetadata: string | undefined;

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
      submit: {
        type: 'plain_text',
        text: 'Submit',
      },
    },
  });
};
