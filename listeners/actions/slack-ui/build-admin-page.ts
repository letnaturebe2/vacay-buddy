import type {AnyBlock} from '@slack/types';
import {RichTextInput} from '@slack/types/dist/block-kit/block-elements';
import type {RichTextBlock} from '@slack/types/dist/block-kit/blocks';
import {ActionId} from '../../../config/constants';
import {PtoTemplate} from "../../../entity/pto-template.model";

export const buildAdminPage = async (
  ptoTemplates: PtoTemplate[],
): Promise<AnyBlock[]> => {
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
      block_id: `template_${template.title}`,
      text: {
        type: 'mrkdwn',
        text: `*${template.title}*\n>Status: ${template.enabled ? 'Enabled' : 'Disabled'}\n>Description:\n>${template.description || 'No description provided.'}`,
      },
      accessory: {
        type: 'overflow',
        action_id: `template_${template.title}_overflow`,
        options: [
          {
            text: {
              type: 'plain_text',
              text: ':pencil2: Edit',
              emoji: true,
            },
            value: `edit_${template.title}`,
          },
          {
            text: {
              type: 'plain_text',
              text: ':x: Delete',
              emoji: true,
            },
            value: `delete_${template.title}`,
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
        action_id: ActionId.OPEN_PTO_MODAL,
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
