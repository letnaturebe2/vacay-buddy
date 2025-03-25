import type { AnyBlock } from '@slack/types';
import type { PtoRequest } from '../../../entity/pto-request.model';
import { buildDecisionSection } from './components/build-decision-section';

export const buildRequestDecisionModal = async (request: PtoRequest, isApprover: boolean): Promise<AnyBlock[]> => {
  const blocks = buildDecisionSection(request);

  if (isApprover) {
    blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'input',
        block_id: 'block_id_decision',
        element: {
          type: 'radio_buttons',
          action_id: 'action_id_decision',
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Approve',
                emoji: true,
              },
              value: `approve_${request.id}`,
            },
            {
              text: {
                type: 'plain_text',
                text: 'Reject',
                emoji: true,
              },
              value: `reject_${request.id}`,
            },
          ],
          initial_option: {
            text: {
              type: 'plain_text',
              text: 'Approve',
              emoji: true,
            },
            value: `approve_${request.id}`,
          },
        },
        label: {
          type: 'plain_text',
          text: 'Decision',
          emoji: true,
        },
      },
      {
        type: 'input',
        block_id: 'block_id_comment',
        optional: true,
        element: {
          type: 'plain_text_input',
          action_id: 'action_id_comment',
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: 'Add a comment...',
          },
        },
        label: {
          type: 'plain_text',
          text: 'Comment',
        },
      },
    );
  }

  return blocks;
};
