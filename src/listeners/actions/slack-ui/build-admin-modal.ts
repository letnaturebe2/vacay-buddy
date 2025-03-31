import type { AnyBlock } from '@slack/types';
import { AppContext } from '../../../app';
import type { User } from '../../../entity/user.model';
import { t } from '../../../i18n';

export const buildAdminModal = async (context: AppContext, admins: User[]): Promise<AnyBlock[]> => {
  return [
    {
      type: 'input',
      block_id: 'select_admins_block',
      label: {
        type: 'plain_text',
        text: t(context.locale, 'assign_admins'),
      },
      element: {
        type: 'multi_users_select',
        action_id: 'select_admins',
        placeholder: {
          type: 'plain_text',
          text: t(context.locale, 'select_admins'),
        },
        initial_users: admins.map((admin) => admin.userId),
      },
    },
  ];
};
