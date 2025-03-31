import type { AnyBlock } from '@slack/types';
import { AppContext } from '../../../app';
import { ActionId } from '../../../constants';
import type { PtoTemplate } from '../../../entity/pto-template.model';
import { t } from '../../../i18n';

export const buildAdminPage = async (context: AppContext, ptoTemplates: PtoTemplate[]): Promise<AnyBlock[]> => {
  const blocks: AnyBlock[] = [
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: t(context.locale, 'back_to_home'),
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
        text: `:busts_in_silhouette: ${t(context.locale, 'manage_admins')}`,
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
            text: `:busts_in_silhouette: ${t(context.locale, 'manage_admins')}`,
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
        text: `:spiral_calendar_pad: ${t(context.locale, 'pto_templates')}`,
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
        text: `*${template.title}*\n>${t(context.locale, 'template_status')}: ${template.enabled ? t(context.locale, 'template_enabled') : t(context.locale, 'template_disabled')}\n>${t(context.locale, 'template_days_consumed')}: ${template.daysConsumed}\n>`,
      },
      accessory: {
        type: 'overflow',
        action_id: ActionId.OPEN_PTO_MANAGE_MODAL,
        options: [
          {
            text: {
              type: 'plain_text',
              text: `:pencil2: ${t(context.locale, 'edit_pto_template')}`,
              emoji: true,
            },
            value: `edit/${template.id}`,
          },
          {
            text: {
              type: 'plain_text',
              text: `:x: ${t(context.locale, 'delete')}`,
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
          text: `:spiral_calendar_pad: ${t(context.locale, 'manage_pto_templates')}`,
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
