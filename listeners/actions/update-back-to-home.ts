import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AnyBlock } from '@slack/types';
import type { HomeView } from '@slack/types/dist/views';
import type { AppContext } from '../../app';
import { buildAppHome } from '../events/slack-ui/build-app-home';
import {assertIf} from "../../config/utils";

export const updateBackToHome = async ({
  ack,
  client,
  body,
  logger,
  context,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  assertIf(body.view !== undefined, 'No view found in body');

  const blocks: AnyBlock[] = await buildAppHome(context);
  const view: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view,
  });
};
