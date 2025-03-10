import type { AnyBlock } from '@slack/types';
import type { User } from '../../../entity/user.model';

import type { View } from '@slack/types';

export const buildPtoModal = async (): Promise<AnyBlock[]> => {
  return [
    {
      type: 'input',
      block_id: 'title',
      element: {
        type: 'plain_text_input',
        action_id: 'name_input',
      },
      label: {
        type: 'plain_text',
        text: 'Title',
      },
    },
    {
      type: 'input',
      block_id: 'content',
      element: {
        type: 'plain_text_input',
        multiline: true,
        initial_value:
          '📅 Date Range: MM/DD/YYYY - MM/DD/YYYY\n📝 Reason: \n\nPlease provide the date range and reason for your PTO request.',
      },
      label: {
        type: 'plain_text',
        text: 'Content',
      },
    },
    {
      type: 'input',
      block_id: 'status',
      element: {
        type: 'static_select',
        action_id: 'status_select',
        initial_option: {
          text: { type: 'plain_text', text: 'Enabled' },
          value: 'enabled',
        },
        options: [
          {
            text: { type: 'plain_text', text: 'Enabled' },
            value: 'enabled',
          },
          {
            text: { type: 'plain_text', text: 'Disabled' },
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
      block_id: 'description',
      element: {
        type: 'plain_text_input',
        action_id: 'description_input',
        multiline: true,
      },
      label: {
        type: 'plain_text',
        text: 'Description',
      },
    },
  ];
};
