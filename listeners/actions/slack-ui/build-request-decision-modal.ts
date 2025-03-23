import type {AnyBlock} from '@slack/types';
import {ActionId, PtoRequestStatus} from '../../../config/constants';
import {formatToYYYYMMDD} from '../../../config/utils';
import type {PtoRequest} from '../../../entity/pto-request.model';

export const buildRequestDecisionModal = async (
  request: PtoRequest, isApprover: boolean
): Promise<AnyBlock[]> => {
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
        type: 'input',
        block_id: 'block_id_decision',
        element: {
          type: 'radio_buttons',
          action_id: 'action_id_decision',
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Approve',
                emoji: true,
              },
              value: `approve_${request.id}`
            },
            {
              text: {
                type: 'plain_text',
                text: 'Reject',
                emoji: true,
              },
              value: `reject_${request.id}`
            }
          ],
          initial_option: {
            text: {
              type: 'plain_text',
              text: 'Approve',
              emoji: true,
            },
            value: `approve_${request.id}`
          }
        },
        label: {
          type: 'plain_text',
          text: 'Decision',
          emoji: true
        }
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
            text: 'Add a comment...',
          },
        },
        label: {
          type: 'plain_text',
          text: 'Comment',
        },
      },
    );
  }

  return blocks;
};
