import type { AllMiddlewareArgs, BlockAction, SlackActionMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../app';
import { t } from '../../i18n';

export const openExcelInfoModal = async ({
  ack,
  client,
  body,
  context,
}: AllMiddlewareArgs<AppContext> & SlackActionMiddlewareArgs<BlockAction>) => {
  await ack();

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: t(context.locale, 'excel_info_content'),
      },
    },
  ];

  await client.views.open({
    trigger_id: body.trigger_id,
    view: {
      type: 'modal',
      callback_id: 'excel_info_modal',
      title: {
        type: 'plain_text',
        text: t(context.locale, 'excel_info_title'),
      },
      blocks: blocks,
      close: {
        type: 'plain_text',
        text: t(context.locale, 'close'),
      },
    },
  });
};
