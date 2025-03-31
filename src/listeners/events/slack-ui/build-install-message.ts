import type { AnyBlock } from '@slack/types';
import { t } from '../../../i18n';

export const buildInstallMessage = (locale: string, organizationId: string, appId: string): AnyBlock[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: t(locale, 'install_intro'),
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: t(locale, 'install_features'),
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: t(locale, 'install_connect'),
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
          url: `slack://app?team=${organizationId}&id=${appId}`,
        },
      ],
    },
  ];
};
