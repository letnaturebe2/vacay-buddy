import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { AnyBlock } from '@slack/types';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import { INVALID_USER_IDS } from '../../constants';
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

  // Check if the start date is before the end date
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

  // Check if the PTO template is valid
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

  const approverMap = new Map<string, User>();
  const existingUsers: User[] = await userService.getUsers(approverIds);
  const missingApproverIds: string[] = [];
  for (const approverId of approverIds) {
    const user: User | undefined = existingUsers.find((user) => user.userId === approverId);
    if (user) {
      approverMap.set(approverId, user);
    } else {
      missingApproverIds.push(approverId);
    }
  }

  const userInfoPromises = missingApproverIds.map((missingId) =>
    client.users.info({
      user: missingId,
    }),
  );

  const userResults = await Promise.all(userInfoPromises);

  // Check if any of the users are bots
  for (const result of userResults) {
    if (result.user?.is_bot === true || (result.user?.id && INVALID_USER_IDS.includes(result.user.id))) {
      await ack({
        response_action: 'errors',
        errors: {
          block_id_approvers: t(context.locale, 'approver_is_bot'),
        },
      });
      return;
    }
  }

  // render home page first
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

  // Create new users for missing approvers
  const newUserPromises = userResults.map((result, index) => {
    const missingId = missingApproverIds[index];
    const userData = {
      name: result.user?.real_name ?? '',
      organization: context.organization,
    };

    return userService.upsertUser(missingId, userData);
  });

  const newUsers = await Promise.all(newUserPromises);
  for (const missingId of missingApproverIds) {
    const user = newUsers.find((user) => user.userId === missingId);
    if (user) {
      approverMap.set(missingId, user);
    }
  }

  const approvers = Array.from(approverMap.values());

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
};

export default submitPtoRequest;
