import type {AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction} from '@slack/bolt';
import type {AppContext} from '../../app';
import {teamService} from '../../service/team.service';

const submitAdminManage = async (
  {
    ack,
    body,
    view,
    client,
  }: AllMiddlewareArgs<AppContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  const selectedUsers = view.state.values.select_admins_block.select_admins.selected_users || [];

  if (selectedUsers.length < 1) {
    await ack({
      response_action: "errors",
      errors: {
        select_admins_block: "You must select at least one admin.",
      },
    });
    return;
  }

  await ack({
    response_action: "update",
    view: {
      type: "modal",
      callback_id: body.view.callback_id,
      title: {
        type: "plain_text",
        text: "Manage Admins",
      },
      close: {
        type: "plain_text",
        text: "Close",
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:white_check_mark: Admins updated successfully!\nNew Admins: ${selectedUsers.map(user => `<@${user}>`).join(", ")}`,
          },
        },
      ],
    },
  })

  await client.chat.postMessage({
    channel: body.user.id,
    text: `✅ Admins updated successfully!\nNew Admins: ${selectedUsers.map(user => `<@${user}>`).join(", ")}`,
  });
};

export default submitAdminManage;