import type { AnyBlock } from '@slack/types';
import { DEFAULT_PTO_TEMPLATE_CONTENT, DEFAULT_PTO_TEMPLATE_TITLE } from '../../../constants';
import type { PtoTemplate } from '../../../entity/pto-template.model';

export const buildPtoTemplateModal = async (ptoTemplate?: PtoTemplate): Promise<AnyBlock[]> => {
  const initialTitle = ptoTemplate?.title || DEFAULT_PTO_TEMPLATE_TITLE;
  const initialContent = ptoTemplate?.content || DEFAULT_PTO_TEMPLATE_CONTENT;
  const initialStatus = ptoTemplate?.enabled === false ? 'disabled' : 'enabled';
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
        text: 'Title',
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
        text: 'Content',
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
          value: initialStatus,
        },
        options: [
          {
            text: { type: 'plain_text', text: 'enabled' },
            value: 'enabled',
          },
          {
            text: { type: 'plain_text', text: 'disabled' },
            value: 'disabled',
          },
        ],
      },
      label: {
        type: 'plain_text',
        text: 'Status',
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
        text: 'Days Consumed',
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
        text: 'Description',
      },
    },
  ];
};
