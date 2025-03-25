import type { AnyBlock } from '@slack/types';
import { ActionId } from '../../../src/config/constants';
import type { PtoRequest } from '../../../entity/pto-request.model';
import { buildDecisionSection } from '../../actions/slack-ui/components/build-decision-section';

export const buildRequestDecisionBlocks = async (request: PtoRequest, isApprover: boolean): Promise<AnyBlock[]> => {
  const blocks = buildDecisionSection(request);

  if (isApprover) {
    blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Open',
            },
            style: 'primary',
            value: request.id.toString(),
            action_id: ActionId.OPEN_DECISION_MODAL,
          },
        ],
      },
    );
  }

  return blocks;
};
