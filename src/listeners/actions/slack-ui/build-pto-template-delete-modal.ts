import type { AnyBlock } from '@slack/types';

import type { PtoTemplate } from '../../../entity/pto-template.model';
import { assert } from '../../../utils';

export const buildPtoTemplateDeleteModal = async (ptoTemplate: PtoTemplate): Promise<AnyBlock[]> => {
  assert(!!ptoTemplate.id, 'Template information is required for deletion');

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Delete Template Confirmation*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:warning: Are you sure you want to delete the template *${ptoTemplate.title}*?`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: ':exclamation: This action cannot be undone.',
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Content:*\n\n${ptoTemplate.content}`,
      },
    },
  ];
};
