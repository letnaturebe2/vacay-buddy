import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { AnyBlock } from '@slack/types';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import type { User } from '../../entity/user.model';
import { t } from '../../i18n';
import { organizationService, ptoService, userService } from '../../service';
import { assert, isSameDay, showAdminSection } from '../../utils';
import { buildAppHome } from '../events/slack-ui/build-app-home';
import { buildRequestDecisionBlocks } from './slack-ui/build-request-decision-blocks';

const submitPtoRequest = async ({
  ack,
  body,
  view,
  client,
  context,
}: AllMiddlewareArgs<AppContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
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

  assert(!!startDate && !!endDate && !!title && !!content, 'All fields are required');

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    await ack({
      response_action: 'errors',
      errors: {
        block_id_start_date: t(context.locale, 'start_date_before_end_date'),
        block_id_end_date: t(context.locale, 'end_date_after_start_date'),
      },
    });
    return;
  }

  const selectedTemplate = await ptoService.getTemplate(templateId);

  if (selectedTemplate.daysConsumed < 1 && selectedTemplate.daysConsumed > 0 && !isSameDay(start, end)) {
    await ack({
      response_action: 'errors',
      errors: {
        block_id_end_date: t(context.locale, 'same_day_required'),
      },
    });
    return;
  }

  const approvers: User[] = await Promise.all(
    approverIds.map((userId) => userService.getOrCreateUser(userId, context.organization)),
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
    blocks: await buildRequestDecisionBlocks(context, request, true),
  });

  // Notify requester
  await client.chat.postMessage({
    channel: context.user.userId,
    blocks: await buildRequestDecisionBlocks(context, request, false),
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

  await client.views.update({
    view_id: privateMetadata.viewId,
    hash: privateMetadata.viewHash,
    view: homeView,
  });
};

export default submitPtoRequest;
