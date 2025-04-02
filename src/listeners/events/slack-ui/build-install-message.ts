import type { AnyBlock } from '@slack/types';
import jwt from 'jsonwebtoken';
import { t } from '../../../i18n';

export const buildInstallMessage = (locale: string, organizationId: string, appId: string): AnyBlock[] => {
  const token = jwt.sign({ organizationId }, process.env.JWT_SECRET || 'default-secret-key');

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
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: t(locale, 'download_user_template'),
            emoji: true,
          },
          url: `${process.env.APP_URL || 'http://localhost:3000'}/download-excel-template?token=${token}`,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: t(locale, 'view_team_vacation'),
            emoji: true,
          },
          url: `${process.env.APP_URL || 'http://localhost:3000'}/team-vacation-html?token=${token}`,
        },
      ],
    },
  ];
};
