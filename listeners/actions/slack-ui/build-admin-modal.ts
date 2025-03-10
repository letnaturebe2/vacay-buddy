import type { AnyBlock } from '@slack/types';
import type { User } from '../../../entity/user.model';

export const buildAdminModal = async (admins: User[]): Promise<AnyBlock[]> => {
  return [
    {
      type: 'input',
      block_id: 'select_admins_block',
      label: { type: 'plain_text', text: 'Assign Admins' },
      element: {
        type: 'multi_users_select',
        action_id: 'select_admins',
        placeholder: { type: 'plain_text', text: 'Search and select users' },
        initial_users: admins.map((admin) => admin.userId),
      },
    },
  ];
};
