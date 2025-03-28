import type { AnyBlock } from '@slack/types';
import { ActionId } from '../../../constants';
import type { PtoRequest } from '../../../entity/pto-request.model';
import { assert } from '../../../utils';
import { buildDecisionSection } from '../../actions/slack-ui/components/build-decision-section';

export const buildRequestDecisionBlocks = async (request: PtoRequest, isApprover: boolean): Promise<AnyBlock[]> => {
  assert(request.currentApprovalId !== null, 'Pending PTO request must have a current approval ID');
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
            value: request.currentApprovalId.toString(),
            action_id: ActionId.OPEN_DECISION_MODAL,
          },
        ],
      },
    );
  }

  return blocks;
};
