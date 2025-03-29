import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import { AppContext } from '../../app';
import { ActionId } from '../../constants';
import { organizationService } from '../../service';
import { buildAdminModal } from './slack-ui/build-admin-modal';

export const openAdminModal = async ({
  ack,
  client,
  body,
  context,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  const currentAdmins = await organizationService.getAdmins(context.organization);
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
        text: 'Submit',
      },
      close: { type: 'plain_text', text: 'Cancel' },
    },
  });
};
