import type {AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs} from '@slack/bolt';
import {ActionId} from "../../config/constants";
import {buildManageAdminModal} from "./slack-ui/build-manage-admin-modal";

export const openManageAdminModal = async (
  {
    ack,
    client,
    body,
  }: AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  const blocks = await buildManageAdminModal();

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: ActionId.SUBMIT_ADMIN_MANAGE,
      title: {"type": "plain_text", "text": "Manage Admins"},
      blocks: blocks,
      submit: {
        type: 'plain_text',
        text: 'Save Changes',
      },
      close: {"type": "plain_text", "text": "Cancel"}
    },
  });
};

