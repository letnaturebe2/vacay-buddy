import type { AnyBlock } from '@slack/types';
import { AppContext } from '../../../../app';
import { ActionId } from '../../../../constants';
import type { PtoRequest } from '../../../../entity/pto-request.model';
import { t } from '../../../../i18n';
import { formatToYYYYMMDD } from '../../../../utils';

export const buildPtoList = (context: AppContext, request: PtoRequest, approvalId: number): AnyBlock[] => {
  const blocks: AnyBlock[] = [];
  const startDate = formatToYYYYMMDD(request.startDate);
  const endDate = formatToYYYYMMDD(request.endDate);

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${request.title}* (${startDate} - ${endDate})`,
    },
    accessory: {
      type: 'button',
      text: {
        type: 'plain_text',
        text: t(context.locale, 'view'),
      },
      value: `${approvalId}`,
      action_id: ActionId.OPEN_DECISION_MODAL,
    },
  });

  blocks.push({
    type: 'divider',
  });

  return blocks;
};
