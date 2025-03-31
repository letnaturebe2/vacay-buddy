import type { AnyBlock } from '@slack/types';
import { AppContext } from '../../../app';
import type { PtoRequest } from '../../../entity/pto-request.model';
import { t } from '../../../i18n';
import { buildDecisionSection } from './components/build-decision-section';

export const buildRequestDecisionModal = async (
  context: AppContext,
  request: PtoRequest,
  isApprover: boolean,
): Promise<AnyBlock[]> => {
  const blocks = buildDecisionSection(context, request);

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
                text: t(context.locale, 'approve'),
                emoji: true,
              },
              value: `approve_${request.currentApprovalId}`,
            },
            {
              text: {
                type: 'plain_text',
                text: t(context.locale, 'reject'),
                emoji: true,
              },
              value: `reject_${request.currentApprovalId}`,
            },
          ],
          initial_option: {
            text: {
              type: 'plain_text',
              text: t(context.locale, 'approve'),
              emoji: true,
            },
            value: `approve_${request.currentApprovalId}`,
          },
        },
        label: {
          type: 'plain_text',
          text: t(context.locale, 'decision'),
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
            text: t(context.locale, 'add_comment'),
          },
        },
        label: {
          type: 'plain_text',
          text: t(context.locale, 'comment'),
        },
      },
    );
  }

  return blocks;
};
