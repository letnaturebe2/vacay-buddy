import type { AnyBlock } from '@slack/types';
import { AppContext } from '../../../app';
import type { PtoTemplate } from '../../../entity/pto-template.model';
import { t } from '../../../i18n';

export const buildPtoTemplateModal = async (context: AppContext, ptoTemplate?: PtoTemplate): Promise<AnyBlock[]> => {
  const initialTitle = ptoTemplate?.title || t(context.locale, 'default_pto_template_title');
  const initialContent = ptoTemplate?.content || t(context.locale, 'default_pto_template_content');
  const initialStatus =
    ptoTemplate?.enabled === false ? t(context.locale, 'template_disabled') : t(context.locale, 'template_enabled');
  const initialDescription = ptoTemplate?.description || '';
  const initialDaysConsumed = ptoTemplate?.daysConsumed || 1;

  return [
    {
      type: 'input',
      block_id: 'block_id_title',
      element: {
        type: 'plain_text_input',
        action_id: 'action_id_title',
        initial_value: initialTitle,
      },
      label: {
        type: 'plain_text',
        text: t(context.locale, 'template_title'),
      },
    },
    {
      type: 'input',
      block_id: 'block_id_content',
      element: {
        action_id: 'action_id_content',
        type: 'plain_text_input',
        multiline: true,
        initial_value: initialContent,
      },
      label: {
        type: 'plain_text',
        text: t(context.locale, 'template_content'),
      },
    },
    {
      type: 'input',
      block_id: 'block_id_status',
      element: {
        type: 'static_select',
        action_id: 'action_id_status',
        initial_option: {
          text: { type: 'plain_text', text: initialStatus },
          value: ptoTemplate?.enabled === false ? 'disabled' : 'enabled',
        },
        options: [
          {
            text: { type: 'plain_text', text: t(context.locale, 'template_enabled') },
            value: 'enabled',
          },
          {
            text: { type: 'plain_text', text: t(context.locale, 'template_disabled') },
            value: 'disabled',
          },
        ],
      },
      label: {
        type: 'plain_text',
        text: t(context.locale, 'template_status'),
      },
    },
    {
      type: 'input',
      block_id: 'block_id_days_consumed',
      element: {
        type: 'number_input',
        action_id: 'action_id_days_consumed',
        is_decimal_allowed: true,
        initial_value: initialDaysConsumed.toString(),
        min_value: '0',
        max_value: '30',
      },
      label: {
        type: 'plain_text',
        text: t(context.locale, 'template_days_consumed'),
      },
    },
    {
      type: 'input',
      optional: true,
      block_id: 'block_id_description',
      element: {
        type: 'plain_text_input',
        action_id: 'action_id_description',
        multiline: true,
        initial_value: initialDescription,
      },
      label: {
        type: 'plain_text',
        text: t(context.locale, 'template_description'),
      },
    },
  ];
};
