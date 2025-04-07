import type { AnyBlock } from '@slack/types';
import jwt from 'jsonwebtoken';
import type { AppContext } from '../../../app';
import { ActionId } from '../../../constants';
import { t } from '../../../i18n';
import { ptoService } from '../../../service';
import { assert } from '../../../utils';
import { buildPtoList } from './components/build-pto-list';

export const buildAppHome = async (context: AppContext, showAdminSection: boolean): Promise<AnyBlock[]> => {
  const token = jwt.sign(
    {
      organizationId: context.organization.organizationId,
      userId: context.user.userId,
    },
    process.env.JWT_SECRET || 'default-secret-key',
    { expiresIn: '1h' },
  );

  const blocks: AnyBlock[] = [];

  // pto status summary
  blocks.push(
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `:chart_with_upwards_trend: ${t(context.locale, 'my_pto_summary')}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${t(context.locale, 'used_pto', {
          used: context.user.usedPtoDays.toString(),
          total: context.user.annualPtoDays.toString(),
        })}\n${t(context.locale, 'remaining_pto', {
          remaining: (context.user.annualPtoDays - context.user.usedPtoDays).toFixed(1),
        })}`,
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: t(context.locale, 'view'),
        },
        value: `${context.user.userId}`,
        action_id: ActionId.ACKNOWLEDGE,
        url: `${process.env.APP_URL || 'http://localhost:3000'}/user-vacation-html?token=${token}`,
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
          text: `:gear: ${t(context.locale, 'admin_settings')}`,
          emoji: true,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: t(context.locale, 'admin_section_notice'),
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
              text: `:gear:${t(context.locale, 'settings')}`,
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
        text: `:memo: ${t(context.locale, 'create_pto_request')}`,
        emoji: true,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: t(context.locale, 'create_request_description'),
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
            text: `:memo: ${t(context.locale, 'start_request')}`,
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
        text: `:clipboard: ${t(context.locale, 'assigned_to_me')}`,
        emoji: true,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: context.user.isAdmin
            ? `${t(context.locale, 'approve_reject_description')} \n ${t(context.locale, 'admin_approve_description')}`
            : t(context.locale, 'approve_reject_description'),
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
        text: t(context.locale, 'no_pending_assigned'),
      },
    });
  } else {
    for (const approval of ptoApprovals) {
      const ptoListBlocks = buildPtoList(context, approval.ptoRequest, approval.id);
      blocks.push(...ptoListBlocks);
    }
  }

  // My pending PTO requests
  blocks.push(
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `:calendar: ${t(context.locale, 'my_pending_pto')}`,
        emoji: true,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: t(context.locale, 'my_requests_description'),
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
        text: t(context.locale, 'no_pending_personal'),
      },
    });
  } else {
    for (const ptoRequest of pendingRequests) {
      assert(ptoRequest.currentApprovalId !== null, 'Pending PTO request must have a current approval ID');
      const ptoListBlocks = buildPtoList(context, ptoRequest, ptoRequest.currentApprovalId);
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
        text: t(context.locale, 'help_contact'),
      },
    ],
  });

  return blocks;
};
