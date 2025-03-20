import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewOutput, ViewSubmitAction } from '@slack/bolt';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import { PtoTemplateManageType } from '../../config/constants';
import { assert } from '../../config/utils';
import type { PtoTemplate } from '../../entity/pto-template.model';
import { ptoService } from '../../service';
import { buildAdminPage } from '../actions/slack-ui/build-admin-page';

const submitPtoTemplateManage = async ({
  ack,
  body,
  view,
  client,
  context,
}: AllMiddlewareArgs<AppContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  // get private_metadata
  const privateMetadata = JSON.parse(view.private_metadata);
  const templateId: number = privateMetadata.templateId;
  const actionType: PtoTemplateManageType = privateMetadata.actionType;

  if (actionType === PtoTemplateManageType.DELETE) {
    await ptoService.deleteTemplate(templateId);
  } else {
    const title = view.state.values.block_id_title.action_id_title.value;
    const content = view.state.values.block_id_content.action_id_content.value;
    assert(!!view.state.values.block_id_status.action_id_status.selected_option, 'Status is required');
    const enabled = view.state.values.block_id_status.action_id_status.selected_option.value === 'enabled';
    const description = view.state.values.block_id_description.action_id_description.value;
    const daysConsumed = view.state.values.block_id_days_consumed.action_id_days_consumed.value;

    assert(!!title && !!content && !!daysConsumed, 'Title and content are required');

    const templateData: Partial<PtoTemplate> = {
      title,
      content,
      enabled,
      description,
      daysConsumed: Number(daysConsumed),
    };

    if (templateId > 0) {
      templateData.id = templateId;
    }

    await ptoService.upsertTemplate(templateData, context.team);
  }

  const templates = await ptoService.getTemplates(context.team);
  const blocks = await buildAdminPage(templates);
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

export default submitPtoTemplateManage;
