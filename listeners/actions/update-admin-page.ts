import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { HomeView } from '@slack/types/dist/views';
import { assert } from '../../config/utils';
import { buildAdminPage } from './slack-ui/build-admin-page';
import {ptoService} from "../../service";
import {AppContext} from "../../app";

export const updateAdminPage = async ({
  ack,
  client,
  body,
  context,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  assert(body.view !== undefined, 'body.view is undefined in callbackBackToHome function');

  const templates = await ptoService.getTemplates(context.team);

  const blocks = await buildAdminPage(templates);

  const view: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view: view,
  });
};
