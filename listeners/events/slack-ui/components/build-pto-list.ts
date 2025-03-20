import type { AnyBlock } from '@slack/types';
import type { AppContext } from '../../../../app';
import { ActionId } from '../../../../config/constants';
import type { PtoRequest } from '../../../../entity/pto-request.model';
import { ptoService } from '../../../../service';

export const buildPtoList = (request: PtoRequest, blockId: string): AnyBlock[] => {
  const blocks: AnyBlock[] = [];
  const startDate = formatToYYYYMMDD(request.startDate);
  const endDate = formatToYYYYMMDD(request.endDate);

  blocks.push({
    type: 'section',
    block_id: `${blockId}_${request.id}`,
    text: {
      type: 'mrkdwn',
      text: `*${request.title}* (${startDate} - ${endDate}) \nStatus: *${request.status}*`,
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
