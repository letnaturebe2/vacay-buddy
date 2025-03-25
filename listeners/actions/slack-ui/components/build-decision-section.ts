import type { AnyBlock } from '@slack/types';
import { PtoRequestStatus } from '../../../../src/config/constants';
import { formatToYYYYMMDD } from '../../../../src/config/utils';
import type { PtoRequest } from '../../../../entity/pto-request.model';

export const buildDecisionSection = (request: PtoRequest): AnyBlock[] => {
  const startDate = request.startDate;
  const endDate = request.endDate;

  const formattedStartDate = formatToYYYYMMDD(startDate);
  const formattedEndDate = formatToYYYYMMDD(endDate);
  const approvers: string[][] = [[]];

  for (const approval of request.approvals) {
    let statusEmoji = '🔄';

    switch (approval.status) {
      case PtoRequestStatus.Approved:
        statusEmoji = '✅';
        break;
      case PtoRequestStatus.Rejected:
        statusEmoji = '❌';
        break;
    }

    if (approvers[approvers.length - 1].length === 3) {
      approvers.push([`<@${approval.approver.userId}>${statusEmoji}`]);
    } else {
      approvers[approvers.length - 1].push(`<@${approval.approver.userId}>${statusEmoji}`);
    }
  }

  const formattedApprovers = approvers.map((approver) => approver.join('  ')).join('\n');

  const approversSection = {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Approvers:* \n ${formattedApprovers}`,
    },
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

  return blocks;
};
