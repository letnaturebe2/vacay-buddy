import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import { AppContext } from '../../app';
import { ActionId } from '../../constants';
import { t } from '../../i18n';
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
  const blocks = await buildAdminModal(context, currentAdmins);

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: ActionId.SUBMIT_ADMIN_MANAGE,
      title: { type: 'plain_text', text: t(context.locale, 'manage_admins_title') },
      blocks: blocks,
      submit: {
        type: 'plain_text',
        text: t(context.locale, 'submit'),
      },
      close: {
        type: 'plain_text',
        text: t(context.locale, 'cancel'),
      },
    },
  });
};
