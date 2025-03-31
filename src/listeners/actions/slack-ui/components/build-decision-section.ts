import type { AnyBlock } from '@slack/types';
import type { AppContext } from '../../../../app';
import { PtoRequestStatus } from '../../../../constants';
import type { PtoRequest } from '../../../../entity/pto-request.model';
import { t } from '../../../../i18n';
import { formatToYYYYMMDD } from '../../../../utils';

export const buildDecisionSection = (context: AppContext, request: PtoRequest): AnyBlock[] => {
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
      text: `*${t(context.locale, 'approvers')}* \n ${formattedApprovers}`,
    },
  };

  return [
    approversSection,
    {
      type: 'divider',
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*${t(context.locale, 'title')}*\n${request.title}`,
        },
        {
          type: 'mrkdwn',
          text: `*${t(context.locale, 'requester')}*\n${request.user.name}`,
        },
        {
          type: 'mrkdwn',
          text: `*${t(context.locale, 'when')}*\n${formattedStartDate} - ${formattedEndDate}`,
        },
        {
          type: 'mrkdwn',
          text: `*${t(context.locale, 'days_requested')}*\n${request.consumedDays} ${
            request.consumedDays > 1 ? t(context.locale, 'days_multiple') : t(context.locale, 'days_single')
          }`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${t(context.locale, 'reason')}*\n${request.reason}`,
      },
    },
  ];
};
