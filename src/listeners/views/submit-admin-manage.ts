import type { AllMiddlewareArgs, SlackViewMiddlewareArgs, ViewSubmitAction } from '@slack/bolt';
import type { AppContext } from '../../app';
import { t } from '../../i18n';
import { organizationService, userService } from '../../service';

const submitAdminManage = async ({
  ack,
  body,
  view,
  client,
  context,
}: AllMiddlewareArgs<AppContext> & SlackViewMiddlewareArgs<ViewSubmitAction>) => {
  const selectedUsers = view.state.values.select_admins_block.select_admins.selected_users || [];

  if (selectedUsers.length < 1) {
    await ack({
      response_action: 'errors',
      errors: {
        select_admins_block: t(context.locale, 'admin_selection_required'),
      },
    });
    return;
  }

  // ensure all selected users are in the team
  for (const userId of selectedUsers) {
    await userService.getOrCreateUser(userId, context.organization);
  }

  await organizationService.updateAdmins(selectedUsers, context.organization);

  const adminList = selectedUsers.map((user) => `<@${user}>`).join(', ');

  await ack({
    response_action: 'update',
    view: {
      type: 'modal',
      callback_id: body.view.callback_id,
      title: {
        type: 'plain_text',
        text: t(context.locale, 'manage_admins_title'),
      },
      close: {
        type: 'plain_text',
        text: t(context.locale, 'close'),
      },
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:white_check_mark: ${t(context.locale, 'admins_updated_success')}\n${t(context.locale, 'admins_updated_message', { adminList })}`,
          },
        },
      ],
    },
  });

  await client.chat.postMessage({
    channel: body.user.id,
    text: `✅ ${t(context.locale, 'admins_updated_success')}`,
  });
};

export default submitAdminManage;
