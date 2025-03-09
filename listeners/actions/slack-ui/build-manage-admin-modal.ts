import type {AnyBlock} from '@slack/types';

export const buildManageAdminModal = async (
): Promise<AnyBlock[]> => {
  return [
    {
      "type": "input",
      "block_id": "select_admins_block",
      "label": {"type": "plain_text", "text": "Assign Admins"},
      "element": {
        "type": "multi_users_select",
        "action_id": "select_admins",
        "placeholder": {"type": "plain_text", "text": "Search and select users"},
        "initial_users": [],
      }
    }
  ];
};