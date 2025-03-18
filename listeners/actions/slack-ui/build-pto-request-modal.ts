import type { AnyBlock } from '@slack/types';
import type { User } from '../../../entity/user.model';

import type { View } from '@slack/types';
import { DEFAULT_PTO_TEMPLATE_CONTENT, DEFAULT_PTO_TEMPLATE_TITLE } from '../../../config/constants';
import type { PtoTemplate } from '../../../entity/pto-template.model';

export const buildPtoRequestModal = async (): Promise<AnyBlock[]> => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  return [
    {
      type: 'input',
      block_id: 'block_id_template',
      element: {
        type: 'static_select',
        action_id: 'action_id_template',
        placeholder: {
          type: 'plain_text',
          text: 'Select a PTO type',
        },
        options: [
          {
            text: { type: 'plain_text', text: 'Vacation' },
            value: 'vacation',
          },
          {
            text: { type: 'plain_text', text: 'Sick Leave' },
            value: 'sick_leave',
          },
          {
            text: { type: 'plain_text', text: 'Personal Day' },
            value: 'personal_day',
          },
        ],
      },
      label: {
        type: 'plain_text',
        text: 'PTO Type',
      },
    },
    {
      type: 'input',
      block_id: 'block_id_start_date',
      element: {
        type: 'datepicker',
        action_id: 'action_id_start_date',
        initial_date: today,
        placeholder: {
          type: 'plain_text',
          text: 'Select start date',
        },
      },
      label: {
        type: 'plain_text',
        text: 'Start Date',
      },
    },
    {
      type: 'input',
      block_id: 'block_id_end_date',
      element: {
        type: 'datepicker',
        action_id: 'action_id_end_date',
        initial_date: today,
        placeholder: {
          type: 'plain_text',
          text: 'Select end date',
        },
      },
      label: {
        type: 'plain_text',
        text: 'End Date',
      },
    },
    {
      type: 'input',
      block_id: 'block_id_all_day',
      element: {
        type: 'radio_buttons',
        action_id: 'action_id_all_day',
        initial_option: {
          text: { type: 'plain_text', text: 'Full days' },
          value: 'full',
        },
        options: [
          {
            text: { type: 'plain_text', text: 'Full days' },
            value: 'full',
          },
          {
            text: { type: 'plain_text', text: 'Half days' },
            value: 'half',
          },
        ],
      },
      label: {
        type: 'plain_text',
        text: 'Duration',
      },
    },
  ];
};
