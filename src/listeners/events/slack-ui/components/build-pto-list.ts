import type { AnyBlock } from '@slack/types';
import { ActionId } from '../../../../constants';
import type { PtoRequest } from '../../../../entity/pto-request.model';
import { formatToYYYYMMDD } from '../../../../utils';

export const buildPtoList = (request: PtoRequest, blockId: string): AnyBlock[] => {
  const blocks: AnyBlock[] = [];
  const startDate = formatToYYYYMMDD(request.startDate);
  const endDate = formatToYYYYMMDD(request.endDate);

  blocks.push({
    type: 'section',
    block_id: `${blockId}_${request.id}`,
    text: {
      type: 'mrkdwn',
      text: `*${request.title}* (${startDate} - ${endDate})`,
    },
    accessory: {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'View',
      },
      value: `${request.id}`,
      action_id: ActionId.OPEN_DECISION_MODAL,
    },
  });

  blocks.push({
    type: 'divider',
  });

  return blocks;
};
