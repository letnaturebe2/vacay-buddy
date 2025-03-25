import type { AnyBlock } from '@slack/types';
import { RichTextInput } from '@slack/types/dist/block-kit/block-elements';
import type { RichTextBlock } from '@slack/types/dist/block-kit/blocks';
import { ActionId } from '../../../src/config/constants';
import type { PtoTemplate } from '../../../entity/pto-template.model';

export const buildAdminPage = async (ptoTemplates: PtoTemplate[]): Promise<AnyBlock[]> => {
  const blocks: AnyBlock[] = [
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Back to Home',
            emoji: true,
          },
          action_id: ActionId.UPDATE_BACK_TO_HOME,
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'header',
      block_id: 'manage_admins_header',
      text: {
        type: 'plain_text',
        text: ':busts_in_silhouette: Manage Admins',
        emoji: true,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: ActionId.OPEN_ADMIN_MODAL,
          text: {
            type: 'plain_text',
            text: ':busts_in_silhouette: Manage Admins',
            emoji: true,
          },
          style: 'primary',
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'header',
      block_id: 'pto_templates_header',
      text: {
        type: 'plain_text',
        text: ':spiral_calendar_pad: PTO Templates',
        emoji: true,
      },
    },
  ];

  for (const template of ptoTemplates) {
    blocks.push({
      type: 'section',
      block_id: `template_${template.id}`,
      text: {
        type: 'mrkdwn',
        text: `*${template.title}*\n>Status: ${template.enabled ? 'Enabled' : 'Disabled'}\n>Days Consumed: ${template.daysConsumed}\n>`,
      },
      accessory: {
        type: 'overflow',
        action_id: ActionId.OPEN_PTO_MANAGE_MODAL,
        options: [
          {
            text: {
              type: 'plain_text',
              text: ':pencil2: Edit',
              emoji: true,
            },
            value: `edit/${template.id}`,
          },
          {
            text: {
              type: 'plain_text',
              text: ':x: Delete',
              emoji: true,
            },
            value: `delete/${template.id}`,
          },
        ],
      },
    });
  }

  blocks.push({
    type: 'actions',
    block_id: 'create_pto_template',
    elements: [
      {
        type: 'button',
        action_id: ActionId.OPEN_PTO_MANAGE_MODAL,
        text: {
          type: 'plain_text',
          text: ':spiral_calendar_pad: Manage PTO Templates',
          emoji: true,
        },
        style: 'primary',
      },
    ],
  });

  blocks.push({
    type: 'divider',
  });

  return blocks;
};
