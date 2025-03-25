import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { AnyBlock } from '@slack/types';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import { ptoService, teamService, userService } from '../../service';
import { assert, isSameDay, showAdminSection } from '../../utils';
import { buildAppHome } from '../events/slack-ui/build-app-home';

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
  const [action, requestId] = selectedOption.split('_');

  // Extract comment
  const commentBlock = values.block_id_comment;
  const comment = commentBlock.action_id_comment.value || '';

  assert(action === 'approve' || action === 'reject', 'Invalid action');

  // Use the extracted values to approve or reject
  if (action === 'approve') {
    await ptoService.approve(context.user, Number(requestId), comment);
  } else if (action === 'reject') {
    await ptoService.reject(context.user, Number(requestId), comment);
  }

  // // Notify current approver
  // const approver = approvers[0];
  // await client.chat.postMessage({
  //   channel: approver.userId,
  //   blocks: await buildPtoApproveBlocks(request, true),
  // });
  //
  // // Notify requester
  // await client.chat.postMessage({
  //   channel: context.user.userId,
  //   blocks: await buildPtoApproveBlocks(request, false),
  // });

  const admins = await teamService.getAdmins(context.team);
  const blocks: AnyBlock[] = await buildAppHome(context, showAdminSection(context.user, admins));
  const homeView: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await ack({
    response_action: 'clear',
  });

  await client.views.update({
    view_id: privateMetadata.viewId,
    hash: privateMetadata.viewHash,
    view: homeView,
  });
};

export default submitDecisionRequest;
