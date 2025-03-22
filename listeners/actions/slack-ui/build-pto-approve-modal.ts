import type {AnyBlock} from '@slack/types';
import {ActionId, PtoRequestStatus} from '../../../config/constants';
import {formatToYYYYMMDD} from '../../../config/utils';
import type {PtoRequest} from '../../../entity/pto-request.model';

export const buildPtoApproveModal = async (request: PtoRequest, isApprover: boolean): Promise<AnyBlock[]> => {
  // Calculate date range and days
  const startDate = request.startDate;
  const endDate = request.endDate;

  const formattedStartDate = formatToYYYYMMDD(startDate);
  const formattedEndDate = formatToYYYYMMDD(endDate);

  const approversSection = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*Approvers:* \n' + request.approvals.map((approval) => {
        let statusEmoji;

        switch (approval.status) {
          case PtoRequestStatus.Approved:
            statusEmoji = '✅';
            break;
          case PtoRequestStatus.Rejected:
            statusEmoji = '❌';
            break;
          default:
            statusEmoji = '🔄';
        }

        return `<@${approval.approver.userId}>${statusEmoji}`;
      }).join('  ')
    }
  };

  const blocks: AnyBlock[] = [
    approversSection,
    {
      type: 'divider',
    },
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
          text: `*Days Requested:*\n${request.consumedDays} ${request.consumedDays > 1 ? 'days' : 'day'}`,
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

  if (isApprover) {
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
