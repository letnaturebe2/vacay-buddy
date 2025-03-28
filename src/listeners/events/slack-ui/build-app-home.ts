import type { AnyBlock } from '@slack/types';
import type { AppContext } from '../../../app';
import { ActionId } from '../../../constants';
import { ptoService } from '../../../service';
import { assert } from '../../../utils';
import { buildPtoList } from './components/build-pto-list';

export const buildAppHome = async (context: AppContext, showAdminSection: boolean): Promise<AnyBlock[]> => {
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
  if (showAdminSection) {
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
        text: ':memo: Create PTO Request',
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
            text: ':memo: Start Request',
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
      const ptoListBlocks = buildPtoList(approval.ptoRequest, approval.id);
      blocks.push(...ptoListBlocks);
    }
  }

  // My pending PTO requests
  blocks.push(
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':calendar: My Pending PTO Request',
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

  const pendingRequests = await ptoService.getMyPendingPtoRequests(context.user);
  if (pendingRequests.length === 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'You have no pending PTO requests.',
      },
    });
  } else {
    for (const ptoRequest of pendingRequests) {
      assert(ptoRequest.currentApprovalId !== null, 'Pending PTO request must have a current approval ID');
      const ptoListBlocks = buildPtoList(ptoRequest, ptoRequest.currentApprovalId);
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
