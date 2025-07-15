import type { AnyBlock } from '@slack/types';
import { AppContext } from '../../../app';
import { t } from '../../../i18n';

export const buildDeletedRequestModal = async (context: AppContext): Promise<AnyBlock[]> => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*:warning: ${t(context.locale, 'request_deleted_title')}*`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: t(context.locale, 'request_deleted_message'),
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `:information_source: ${t(context.locale, 'request_deleted_info')}`,
        },
      ],
    },
  ];
};
