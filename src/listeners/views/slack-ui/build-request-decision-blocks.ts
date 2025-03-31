import type { AnyBlock } from '@slack/types';
import type { AppContext } from '../../../app';
import { ActionId } from '../../../constants';
import type { PtoRequest } from '../../../entity/pto-request.model';
import { t } from '../../../i18n';
import { assert } from '../../../utils';
import { buildDecisionSection } from '../../actions/slack-ui/components/build-decision-section';

export const buildRequestDecisionBlocks = async (
  context: AppContext,
  request: PtoRequest,
  isApprover: boolean,
): Promise<AnyBlock[]> => {
  assert(request.currentApprovalId !== null, 'Pending PTO request must have a current approval ID');
  const blocks = buildDecisionSection(context, request);

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
              text: t(context.locale, 'open'),
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
