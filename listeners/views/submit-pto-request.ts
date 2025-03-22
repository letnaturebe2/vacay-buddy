import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { AnyBlock } from '@slack/types';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import { assert, isSameDay, showAdminSection } from '../../config/utils';
import type { User } from '../../entity/user.model';
import { ptoService, teamService, userService } from '../../service';
import { buildAppHome } from '../events/slack-ui/build-app-home';
import {buildPtoApproveBlocks} from "../actions/slack-ui/build-pto-approve-blocks";

const submitPtoRequest = async ({
  ack,
  body,
  view,
  client,
  context,
}: AllMiddlewareArgs<AppContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  // Get private metadata
  const privateMetadata = JSON.parse(view.private_metadata);

  const values = view.state.values;
  // Extract template ID from the template selection
  const templateBlock = values.block_id_select_template;
  const selectedOption = templateBlock['select-pto-template'].selected_option;
  assert(!!selectedOption, 'Template is required');
  const templateId = Number(selectedOption.value);

  // Extract dates
  const startDate = values.block_id_start_date.action_id_start_date.selected_date;
  const endDate = values.block_id_end_date.action_id_end_date.selected_date;
  const titleBlock = values.block_id_title;
  const title = titleBlock[Object.keys(titleBlock)[0]].value; // because of Date timestamp
  const contentBlock = values.block_id_content;
  const content = contentBlock[Object.keys(contentBlock)[0]].value; // because of Date timestamp
  const approverIds = values.block_id_approvers.action_id_approvers.selected_users ?? [];

  assert(!!startDate && !!endDate && !!title && !!content, 'Start and end dates are required');

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    await ack({
      response_action: 'errors',
      errors: {
        block_id_start_date: 'Start date must be before end date',
        block_id_end_date: 'End date must be after start date',
      },
    });
    return;
  }

  const selectedTemplate = await ptoService.getTemplate(templateId);

  if (selectedTemplate.daysConsumed < 1 && selectedTemplate.daysConsumed > 0 && !isSameDay(start, end)) {
    await ack({
      response_action: 'errors',
      errors: {
        block_id_end_date: 'This template type requires same start and end dates',
      },
    });
    return;
  }

  const approvers: User[] = await Promise.all(
    approverIds.map((userId) => userService.getOrCreateUser(userId, context.team)),
  );

  const request = await ptoService.createPtoRequest(
    context.user,
    selectedTemplate,
    start,
    end,
    title,
    content,
    approvers,
  );

  // Notify current approver
  const approver = approvers[0];
  await client.chat.postMessage({
    channel: approver.userId,
    blocks: await buildPtoApproveBlocks(request, true),
  });

  // Notify requester
  await client.chat.postMessage({
    channel: context.user.userId,
    blocks: await buildPtoApproveBlocks(request, false),
  });

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

export default submitPtoRequest;
