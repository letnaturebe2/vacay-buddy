import type {AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction} from '@slack/bolt';
import type {AnyBlock} from '@slack/types';
import type {HomeView} from '@slack/types/dist/views';
import type {AppContext} from '../../app';
import {ptoService, teamService} from '../../service';
import {assert, showAdminSection} from '../../utils';
import {buildAppHome} from '../events/slack-ui/build-app-home';
import {PtoApproval} from "../../entity/pto-approval.model";
import {buildDecisionSection} from "../actions/slack-ui/components/build-decision-section";

const submitDecisionRequest = async (
  {
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

  // Use the extracted values to approve or reject
  let updatedApproval: PtoApproval;
  if (action === 'approve') {
    updatedApproval = await ptoService.approve(context.user, Number(approvalId), comment);
    // // Notify next approver
    // const approver = approvers[0];
    // await client.chat.postMessage({
    //   channel: approver.userId,
    //   blocks: await buildPtoApproveBlocks(request, true),
    // });

  } else if (action === 'reject') {
    updatedApproval = await ptoService.reject(context.user, Number(approvalId), comment);
    await client.chat.postMessage({
      channel: updatedApproval.ptoRequest.user.userId,
      blocks: buildDecisionSection(updatedApproval.ptoRequest),
    })
  }

  const admins = await teamService.getAdmins(context.team);
  const blocks: AnyBlock[] = await buildAppHome(context, showAdminSection(context.user, admins));
  const homeView: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await ack({
    response_action: 'clear',
  });

  if (privateMetadata.viewId) {  // if the request is from home tab, else it's from message
    await client.views.update({
      view_id: privateMetadata.viewId,
      hash: privateMetadata.viewHash,
      view: homeView,
    });
  }
};

export default submitDecisionRequest;
