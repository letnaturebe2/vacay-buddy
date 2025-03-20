import type { AnyBlock } from '@slack/types';
import type { User } from '../../../entity/user.model';

import type { View } from '@slack/types';
import { ActionId, DEFAULT_PTO_TEMPLATE_CONTENT, DEFAULT_PTO_TEMPLATE_TITLE } from '../../../config/constants';
import { assert } from '../../../config/utils';
import type { PtoTemplate } from '../../../entity/pto-template.model';

export const buildPtoRequestModal = async (
  templates: PtoTemplate[],
  selected: PtoTemplate,
  user: User,
): Promise<AnyBlock[]> => {
  assert(templates.length > 0, 'No PTO templates found');

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const templateOptions = templates.map((template) => {
    return {
      text: {
        type: 'plain_text',
        text: template.title,
      },
      value: template.id.toString(),
    } as const;
  });

  return [
    {
      block_id: 'block_id_select_template',
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*:calendar: Select PTO Template* \n_This template consumes: *${selected.daysConsumed}* day(s)_`,
      },
      accessory: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Select a template',
        },
        initial_option: {
          text: {
            type: 'plain_text',
            text: selected.title,
          },
          value: selected.id.toString(),
        },
        options: templateOptions,
        action_id: ActionId.SELECT_PTO_TEMPLATE,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'input',
      block_id: 'block_id_title',
      element: {
        action_id: `action_id_title_${new Date().toISOString()}`, // slack requires unique action_id to refresh same element
        type: 'plain_text_input',
        placeholder: {
          type: 'plain_text',
          text: 'Enter title',
        },
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
        action_id: `action_id_content_${new Date().toISOString()}`, // slack requires unique action_id to refresh same element
        type: 'plain_text_input',
        multiline: true,
        initial_value: selected.content,
      },
      label: {
        type: 'plain_text',
        text: 'Content',
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
        initial_date: tomorrow,
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
      block_id: 'block_id_approvers',
      label: { type: 'plain_text', text: 'Assign Approvers' },
      element: {
        type: 'multi_users_select',
        action_id: 'action_id_approvers',
        placeholder: { type: 'plain_text', text: 'Search and select approvers' },
        // initial_users: admins.map((admin) => admin.userId),  // TODO: get default user's template approvers
      },
    },
  ];
};
