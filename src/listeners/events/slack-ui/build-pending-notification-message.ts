import type { AnyBlock } from '@slack/types';
import { AppContext } from '../../../app';
import { t } from '../../../i18n';

export const buildPendingNotificationMessage = (context: AppContext, pendingCount: number): AnyBlock[] => {
  const { locale } = context;

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${t(locale, 'pending_notification_title')}\n\n${t(locale, 'pending_notification_message', { count: pendingCount.toString() })}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: t(locale, 'pending_notification_description'),
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: t(locale, 'home'),
          },
          url: `slack://app?team=${context.organization.organizationId}&id=${context.organization.appId}`,
        },
      ],
    },
  ];
};
