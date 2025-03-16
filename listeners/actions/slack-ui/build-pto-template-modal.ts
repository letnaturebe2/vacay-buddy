import type {AnyBlock} from '@slack/types';
import type {User} from '../../../entity/user.model';

import type {View} from '@slack/types';
import {PtoTemplate} from "../../../entity/pto-template.model";
import {DEFAULT_PTO_TEMPLATE_CONTENT} from "../../../config/constants";

export const buildPtoTemplateModal = async (ptoTemplate?: PtoTemplate): Promise<AnyBlock[]> => {
  const initialTitle = ptoTemplate?.title || '';
  const initialContent = ptoTemplate?.content || DEFAULT_PTO_TEMPLATE_CONTENT;
  const initialStatus = ptoTemplate?.enabled === false ? 'disabled' : 'enabled';
  const initialDescription = ptoTemplate?.description || '';

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
          text: {type: 'plain_text', text: initialStatus},
          value: initialStatus,
        },
        options: [
          {
            text: {type: 'plain_text', text: 'enabled'},
            value: 'enabled',
          },
          {
            text: {type: 'plain_text', text: 'disabled'},
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
