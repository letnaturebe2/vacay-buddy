import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import { assert } from '../../config/utils';
import type { PtoTemplate } from '../../entity/pto-template.model';
import { ptoService, teamService, userService } from '../../service';
import { buildAdminPage } from '../actions/slack-ui/build-admin-page';

const submitPtoTemplateManage = async ({
  ack,
  body,
  view,
  client,
  context,
}: AllMiddlewareArgs<AppContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  const title = view.state.values.block_id_title.action_id_title.value;
  const content = view.state.values.block_id_content.action_id_content.value;
  assert(!!view.state.values.block_id_status.action_id_status.selected_option, 'Status is required');
  const enabled = view.state.values.block_id_status.action_id_status.selected_option.value === 'enabled';
  const description = view.state.values.block_id_description.action_id_description.value;
  // get private_metadata
  const privateMetadata = JSON.parse(view.private_metadata);
  const updateTargetViewId = privateMetadata.viewId;
  const updateTargetViewHash = privateMetadata.viewHash;

  assert(!!title, 'Title is required');
  assert(!!content, 'Content is required');

  const templateData: Partial<PtoTemplate> = {
    title,
    content,
    enabled,
    description,
  };

  await ptoService.upsertTemplate(templateData, context.team);
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
    view_id: updateTargetViewId,
    hash: updateTargetViewHash,
    view: homeView,
  });
};

export default submitPtoTemplateManage;
