import type { AnyBlock } from '@slack/types';
import { AppContext } from '../../../app';
import { ActionId } from '../../../constants';
import type { PtoTemplate } from '../../../entity/pto-template.model';
import type { User } from '../../../entity/user.model';
import { t } from '../../../i18n';
import { assert } from '../../../utils';

export const buildPtoRequestModal = async (
  context: AppContext,
  templates: PtoTemplate[],
  selected: PtoTemplate,
  user: User,
): Promise<AnyBlock[]> => {
  assert(templates.length > 0, 'No PTO templates found');

  const today = new Date().toISOString().split('T')[0];
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
        text: `*:calendar: ${t(context.locale, 'select_pto_template')}* \n${t(context.locale, 'template_consumes_days', { days: selected.daysConsumed.toString() })}`,
      },
      accessory: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: t(context.locale, 'select_template'),
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
          text: t(context.locale, 'enter_title'),
        },
      },
      label: {
        type: 'plain_text',
        text: t(context.locale, 'title'),
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
        text: t(context.locale, 'template_content'),
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
          text: t(context.locale, 'select_start_date'),
        },
      },
      label: {
        type: 'plain_text',
        text: t(context.locale, 'start_date'),
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
          text: t(context.locale, 'select_end_date'),
        },
      },
      label: {
        type: 'plain_text',
        text: t(context.locale, 'end_date'),
      },
    },
    {
      type: 'input',
      block_id: 'block_id_approvers',
      label: {
        type: 'plain_text',
        text: t(context.locale, 'assign_approvers'),
      },
      element: {
        type: 'multi_users_select',
        action_id: 'action_id_approvers',
        placeholder: {
          type: 'plain_text',
          text: t(context.locale, 'search_approvers'),
        },
        // initial_users: admins.map((admin) => admin.userId),  // TODO: get default user's template approvers
      },
    },
  ];
};
