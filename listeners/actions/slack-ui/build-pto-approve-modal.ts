import type { AnyBlock } from '@slack/types';
import { ActionId } from '../../../config/constants';
import { formatToYYYYMMDD } from '../../../config/utils';
import type { PtoRequest } from '../../../entity/pto-request.model';
import type { User } from '../../../entity/user.model';

export const buildPtoApproveModal = async (request: PtoRequest, user: User): Promise<AnyBlock[]> => {
  // Calculate date range and days
  const startDate = request.startDate;
  const endDate = request.endDate;
  const daysRequested = 1;

  const formattedStartDate = formatToYYYYMMDD(startDate);
  const formattedEndDate = formatToYYYYMMDD(endDate);

  const blocks: AnyBlock[] = [
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Title:*\n${request.title}`,
        },
        {
          type: 'mrkdwn',
          text: `*Requester:*\n${request.user.name}`,
        },
        {
          type: 'mrkdwn',
          text: `*When:*\n${formattedStartDate} - ${formattedEndDate}`,
        },
        {
          type: 'mrkdwn',
          text: `*Days:*\n${daysRequested} ${daysRequested > 1 ? 'days' : 'day'}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Reason:*\n${request.reason}`,
      },
    },
  ];

  if (user.id !== request.user.id) {
    blocks.push(
      {
        type: 'divider',
      },
      {
        type: 'actions',
        block_id: 'approve_deny_actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Approve',
              emoji: true,
            },
            style: 'primary',
            value: request.id.toString(),
            action_id: ActionId.CLOSE_APPROVE_PTO_REQUEST,
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Deny',
              emoji: true,
            },
            style: 'danger',
            value: request.id.toString(),
            action_id: ActionId.CLOSE_DENY_PTO_REQUEST,
          },
        ],
      },
    );
  }

  return blocks;
};
