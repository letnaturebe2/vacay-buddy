import type { AnyBlock } from '@slack/types';
import type { AppContext } from '../../../app';
import { ActionId } from '../../../config/constants';

export const buildAppHome = async (context: AppContext): Promise<AnyBlock[]> => {
  const blocks: AnyBlock[] = [];

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
          action_id: 'submit_pto_request',
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
  blocks.push(
    {
      type: 'section',
      block_id: 'request_1',
      text: {
        type: 'mrkdwn',
        text: '<@U07FTGE8HE3> requested PTO from *Feb 20 - Feb 22* \nReason: 🏝️ Vacation',
      },
    },
    {
      type: 'actions',
      block_id: 'request_1_actions',
      elements: [
        {
          type: 'button',
          action_id: 'approve_pto',
          text: {
            type: 'plain_text',
            text: 'Approve',
          },
          style: 'primary',
          value: 'pto_request_12345',
        },
        {
          type: 'button',
          action_id: 'reject_pto',
          text: {
            type: 'plain_text',
            text: 'Reject',
          },
          style: 'danger',
          value: 'pto_request_12345',
        },
      ],
    },
  );

  blocks.push(
    {
      type: 'section',
      block_id: 'request_2',
      text: {
        type: 'mrkdwn',
        text: '<@U07FTRANDOM> requested PTO from *Feb 25 - Feb 28* \nReason: 🤒 Sick Leave (Awaiting approval from @ApproverUser)',
      },
    },
    {
      type: 'actions',
      block_id: 'request_2_actions',
      elements: [
        {
          type: 'button',
          action_id: 'approve_pto',
          text: {
            type: 'plain_text',
            text: 'Approve ✅',
            emoji: true,
          },
          style: 'primary',
          value: 'pto_request_67890',
        },
        {
          type: 'button',
          action_id: 'reject_pto',
          text: {
            type: 'plain_text',
            text: 'Reject ❌',
            emoji: true,
          },
          style: 'danger',
          value: 'pto_request_67890',
        },
      ],
    },
  );

  // info
  blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'context',
      block_id: 'help_info',
      elements: [
        {
          type: 'mrkdwn',
          text: 'Need help? Contact <mailto:hr@example.com|HR Team> for any PTO-related inquiries. :love_letter:',
        },
      ],
    },
  );

  return blocks;
};
