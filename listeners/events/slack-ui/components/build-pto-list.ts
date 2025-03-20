import type { AnyBlock } from '@slack/types';
import { ActionId } from '../../../../config/constants';
import type { PtoRequest } from '../../../../entity/pto-request.model';

export const buildPtoList = (request: PtoRequest, blockId: string): AnyBlock[] => {
  const blocks: AnyBlock[] = [];
  const startDate = formatToYYYYMMDD(request.startDate);
  const endDate = formatToYYYYMMDD(request.endDate);

  blocks.push({
    type: 'section',
    block_id: `${blockId}_${request.id}`,
    text: {
      type: 'mrkdwn',
      text: `*${request.title}* (${startDate} - ${endDate}) \n Type: ${request.template.title}`,
    },
    accessory: {
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'View',
      },
      value: `${request.id}`,
      action_id: ActionId.OPEN_MY_REQUEST_MODAL,
    },
  });

  blocks.push({
    type: 'divider',
  });

  return blocks;
};

function formatToYYYYMMDD(date: Date): string {
  return new Date(date).toISOString().split('T')[0];
}
