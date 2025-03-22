import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../app';
import { ActionId } from '../../config/constants';
import { assert } from '../../config/utils';
import type { PtoApproval } from '../../entity/pto-approval.model';
import { ptoService } from '../../service';
import { buildPtoApproveModal } from './slack-ui/build-pto-approve-modal';
import { buildPtoRequestModal } from './slack-ui/build-pto-request-modal';

export const openRequestApproveModal = async ({
  ack,
  client,
  body,
  context,
  payload,
  action,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  assert(!!body.view, 'body.view.id is undefined');
  assert(action.type === 'button' && !!action.value, 'action type must be button and have value');

  const requestId = Number(action.value);
  const request = await ptoService.getPtoRequest(requestId);
  const currentPtoApproval: PtoApproval | undefined = request.approvals.find(
    (approve) => approve.id === request.currentApproverId,
  );
  const isApprover = currentPtoApproval?.approverId === context.user.id;
  const blocks = await buildPtoApproveModal(request, isApprover);

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
    },
  });
};
