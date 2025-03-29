import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { AnyBlock } from '@slack/types';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import { PtoRequestStatus } from '../../constants';
import { PtoApproval } from '../../entity/pto-approval.model';
import { ptoService, organizationService } from '../../service';
import { assert, showAdminSection } from '../../utils';
import { buildDecisionSection } from '../actions/slack-ui/components/build-decision-section';
import { buildAppHome } from '../events/slack-ui/build-app-home';
import { buildRequestDecisionBlocks } from './slack-ui/build-request-decision-blocks';

const submitDecisionRequest = async ({
  ack,
  body,
  view,
  client,
  context,
}: AllMiddlewareArgs<AppContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  // Get private metadata
  const privateMetadata = JSON.parse(view.private_metadata);

  const values = view.state.values;
  const decisionBlock = values.block_id_decision.action_id_decision;
  assert(!!decisionBlock.selected_option, 'Decision is required');
  const selectedOption = decisionBlock.selected_option.value;
  const [action, approvalId] = selectedOption.split('_');

  // Extract comment
  const commentBlock = values.block_id_comment;
  const comment = commentBlock.action_id_comment.value || '';

  assert(action === 'approve' || action === 'reject', 'Invalid action');

  let approval: PtoApproval;
  if (action === 'approve') {
    approval = await ptoService.approve(context.user, Number(approvalId), comment);
    const request = approval.ptoRequest;
    if (request.status === PtoRequestStatus.Pending) {
      assert(request.currentApprovalId !== null, 'Pending PTO request must have a current approval ID');

      const nextApproval = await ptoService.getApproval(request.currentApprovalId);
      // Notify next approver
      await client.chat.postMessage({
        channel: nextApproval.approver.userId,
        blocks: await buildRequestDecisionBlocks(request, true),
      });
    }
  } else {
    approval = await ptoService.reject(context.user, Number(approvalId), comment);
  }

  // Notify requester of the decision
  await client.chat.postMessage({
    channel: approval.ptoRequest.user.userId,
    blocks: buildDecisionSection(approval.ptoRequest),
  });

  const admins = await organizationService.getAdmins(context.organization);
  const blocks: AnyBlock[] = await buildAppHome(context, showAdminSection(context.user, admins));
  const homeView: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await ack({
    response_action: 'clear',
  });

  // if the request is from home tab, else it's from message
  if (privateMetadata.viewId) {
    await client.views.update({
      view_id: privateMetadata.viewId,
      hash: privateMetadata.viewHash,
      view: homeView,
    });
  }
};

export default submitDecisionRequest;
