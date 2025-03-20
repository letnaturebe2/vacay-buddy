import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { AppContext } from '../../app';
import { ActionId } from '../../config/constants';
import { assert } from '../../config/utils';
import type { User } from '../../entity/user.model';
import { ptoService, userService } from '../../service';

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

  const approvers: User[] = await Promise.all(
    approverIds.map((userId) => userService.getOrCreateUser(userId, context.team)),
  );

  const selectedTemplate = await ptoService.getTemplate(templateId);
  const request = await ptoService.createPtoRequest(
    context.user,
    selectedTemplate,
    start,
    end,
    title,
    content,
    approvers,
  );

  await ack({
    response_action: 'clear',
  });
};

export default submitPtoRequest;
