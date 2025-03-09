import type {AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs} from '@slack/bolt';
import type {AnyBlock} from "@slack/types";
import {buildAppHome} from "../events/slack-ui/build-app-home";
import type {HomeView} from "@slack/types/dist/views";

export const updateBackToHome = async (
  {
    ack,
    client,
    body,
    logger,
  }: AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  if (!body.view) throw new Error('No view found in body');

  const blocks: AnyBlock[] = await buildAppHome();
  const view: HomeView = {
    type: 'home',
    blocks: blocks,
  };

  await client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view
  });
};

