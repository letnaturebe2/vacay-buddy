import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { AppContext } from '../../app';
import {ptoService, teamService, userService} from '../../service';
import {assert} from "../../config/utils";
import {PtoTemplate} from "../../entity/pto-template.model";

const submitPtoTemplateManage = async ({
  ack,
  body,
  view,
  client,
  context,
}: AllMiddlewareArgs<AppContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  const title = view.state.values.block_id_title.action_id_title.value;
  const content = view.state.values.block_id_content.action_id_content.value;
  const enabled = view.state.values.block_id_status.action_id_status.selected_option!.value === 'enabled';
  const description = view.state.values.block_id_description.action_id_description.value;

  assert(!!title, 'Title is required');
  assert(!!content, 'Content is required');
  assert(!!description, 'Description is required');

  const templateData: Partial<PtoTemplate> = {
    title,
    description,
    content,
    enabled,
  };

  const template = await ptoService.upsertTemplate(templateData, context.team);

  await ack({
    response_action: 'update',
    view: {
      type: 'modal',
      callback_id: body.view.callback_id,
      title: {
        type: 'plain_text',
        text: view.title.text,
      },
      close: {
        type: 'plain_text',
        text: 'Close',
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:white_check_mark: *${template.title}* Template created successfully!`,
          },
        },
      ],
    },
  });
};

export default submitPtoTemplateManage;
