import type { AnyBlock } from '@slack/types';
import type { AppContext } from '../../../app';
import { ActionId } from '../../../config/constants';
import { ptoService } from '../../../service';
import { buildPtoList } from './components/build-pto-list';

export const buildAppHome = async (context: AppContext): Promise<AnyBlock[]> => {
  const blocks: AnyBlock[] = [];

  // pto status summary
  blocks.push(
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':chart_with_upwards_trend: My PTO Summary',
        emoji: true,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Used PTO*: ${context.user.usedPtoDays}/${context.user.annualPtoDays} days\n*Remaining*: ${(context.user.annualPtoDays - context.user.usedPtoDays).toFixed(1)} days`,
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View',
        },
        value: `${context.user.userId}`,
        action_id: ActionId.OPEN_MY_REQUEST_STATUS_MODAL,
      },
    },
    {
      type: 'divider',
    },
  );

  // Only show admin settings to admins
  if (context.user.isAdmin) {
    blocks.push(
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ':gear: Admin Settings',
          emoji: true,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: 'This section is only visible to you because you are an admin.',
            emoji: true,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            action_id: ActionId.UPDATE_ADMIN_PAGE,
            text: {
              type: 'plain_text',
              text: ':gear:Settings',
              emoji: true,
            },
            style: 'primary',
            value: ActionId.UPDATE_ADMIN_PAGE,
          },
        ],
      },
      {
        type: 'divider',
      },
    );
  }

  // pto request button
  blocks.push(
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':calendar: Create PTO Request',
        emoji: true,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: 'Create a new time off request that will be sent to your manager for approval.',
          emoji: true,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          action_id: ActionId.OPEN_PTO_REQUEST_MODAL,
          text: {
            type: 'plain_text',
            text: ':calendar: Start Request',
            emoji: true,
          },
          style: 'primary',
          value: 'submit_request',
        },
      ],
    },
    {
      type: 'divider',
    },
  );

  // PTO requests header
  blocks.push(
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':clipboard: Assigned to Me',
        emoji: true,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: context.user.isAdmin
            ? 'Approve or reject PTO requests assigned to you. \n As an admin, you can approve or reject any pending PTO request, even those assigned to other approvers.'
            : 'Approve or reject PTO requests assigned to you.',
        },
      ],
    },
    {
      type: 'divider',
    },
  );

  // PTO request list assigned to me
  const ptoApprovals = await ptoService.getPendingApprovalsToReview(context.user);

  if (ptoApprovals.length === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'No pending PTO requests assigned to you.',
      },
    });
  } else {
    for (const approval of ptoApprovals) {
      const ptoListBlocks = buildPtoList(approval.ptoRequest, 'block_id_approval');
      blocks.push(...ptoListBlocks);
    }
  }

  // PTO request list created by me
  blocks.push(
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':calendar: My PTO Requests',
        emoji: true,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Your submitted PTO requests and their current status.',
        },
      ],
    },
    {
      type: 'divider',
    },
  );

  const ptoRequests = await ptoService.getOwnedPtoRequests(context.user);
  if (ptoRequests.length === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'You have not submitted any PTO requests yet.',
      },
    });
  } else {
    for (const ptoRequest of ptoRequests) {
      const ptoListBlocks = buildPtoList(ptoRequest, 'block_id_request');
      blocks.push(...ptoListBlocks);
    }
  }

  // bottom help info
  blocks.push({
    type: 'context',
    block_id: 'help_info',
    elements: [
      {
        type: 'mrkdwn',
        text: 'Need help? Contact <mailto:hr@example.com|HR Team> for any PTO-related inquiries. :love_letter:',
      },
    ],
  });

  return blocks;
};
