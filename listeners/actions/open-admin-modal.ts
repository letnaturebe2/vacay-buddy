import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import { ActionId } from '../../config/constants';
import { teamService } from '../../service';
import { buildAdminModal } from './slack-ui/build-admin-modal';

export const openAdminModal = async ({
  ack,
  client,
  body,
  context,
}: AllMiddlewareArgs & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  const currentAdmins = await teamService.getAdmins(context.team);
  const blocks = await buildAdminModal(currentAdmins);

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: ActionId.SUBMIT_ADMIN_MANAGE,
      title: { type: 'plain_text', text: 'Manage Admins' },
      blocks: blocks,
      submit: {
        type: 'plain_text',
        text: 'Save Changes',
      },
      close: { type: 'plain_text', text: 'Cancel' },
    },
  });
};
