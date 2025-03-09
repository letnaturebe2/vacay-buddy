import type {AnyBlock} from '@slack/types';
import {ActionId} from "../../../config/constants";

export const buildAppHome = async (): Promise<AnyBlock[]> => {
  return [
    {
      "type": "header",
      "block_id": "admin_header",
      "text": {
        "type": "plain_text",
        "text": "Admin Settings :gear:",
        "emoji": true
      }
    },
    {
      "type": "context",
      "block_id": "admin_info",
      "elements": [
        {
          "type": "plain_text",
          "text": "This section is only visible to you because you are an admin.",
          "emoji": true
        }
      ]
    },
    {
      "type": "actions",
      "block_id": "admin_actions",
      "elements": [
        {
          "type": "button",
          "action_id": ActionId.UPDATE_ADMIN_PAGE,
          "text": {
            "type": "plain_text",
            "text": ":gear: Admin Settings",
            "emoji": true
          },
          "style": "primary",
          "value": ActionId.UPDATE_ADMIN_PAGE
        }
      ]
    },
    {
      "type": "header",
      "block_id": "all_pending_requests_header",
      "text": {
        "type": "plain_text",
        "text": "All Pending PTO Requests :clipboard:",
        "emoji": true
      }
    },
    {
      "type": "context",
      "block_id": "admin_approval_info",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "As an admin, you can approve or reject any pending PTO request, even those assigned to other approvers."
        }
      ]
    },
    {
      "type": "section",
      "block_id": "request_1",
      "text": {
        "type": "mrkdwn",
        "text": "<@U07FTGE8HE3> requested PTO from *Feb 20 - Feb 22* \nReason: 🏝️ Vacation"
      }
    },
    {
      "type": "actions",
      "block_id": "request_1_actions",
      "elements": [
        {
          "type": "button",
          "action_id": "approve_pto",
          "text": {
            "type": "plain_text",
            "text": "Approve ✅",
            "emoji": true
          },
          "style": "primary",
          "value": "pto_request_12345"
        },
        {
          "type": "button",
          "action_id": "reject_pto",
          "text": {
            "type": "plain_text",
            "text": "Reject ❌",
            "emoji": true
          },
          "style": "danger",
          "value": "pto_request_12345"
        }
      ]
    },
    {
      "type": "section",
      "block_id": "request_2",
      "text": {
        "type": "mrkdwn",
        "text": "<@U07FTRANDOM> requested PTO from *Feb 25 - Feb 28* \nReason: 🤒 Sick Leave (Awaiting approval from @ApproverUser)"
      }
    },
    {
      "type": "actions",
      "block_id": "request_2_actions",
      "elements": [
        {
          "type": "button",
          "action_id": "approve_pto",
          "text": {
            "type": "plain_text",
            "text": "Approve ✅",
            "emoji": true
          },
          "style": "primary",
          "value": "pto_request_67890"
        },
        {
          "type": "button",
          "action_id": "reject_pto",
          "text": {
            "type": "plain_text",
            "text": "Reject ❌",
            "emoji": true
          },
          "style": "danger",
          "value": "pto_request_67890"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "header",
      "block_id": "my_pending_requests_header",
      "text": {
        "type": "plain_text",
        "text": "Pending PTO Requests (Assigned to You) :clipboard:",
        "emoji": true
      }
    },
    {
      "type": "section",
      "block_id": "request_3",
      "text": {
        "type": "mrkdwn",
        "text": "<@U12345678> requested PTO from *March 3 - March 5* \nReason: ✈️ Travel (Assigned to you for approval)"
      }
    },
    {
      "type": "actions",
      "block_id": "request_3_actions",
      "elements": [
        {
          "type": "button",
          "action_id": "approve_pto",
          "text": {
            "type": "plain_text",
            "text": "Approve ✅",
            "emoji": true
          },
          "style": "primary",
          "value": "pto_request_54321"
        },
        {
          "type": "button",
          "action_id": "reject_pto",
          "text": {
            "type": "plain_text",
            "text": "Reject ❌",
            "emoji": true
          },
          "style": "danger",
          "value": "pto_request_54321"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "actions",
      "block_id": "request_submission",
      "elements": [
        {
          "type": "button",
          "action_id": "submit_pto_request",
          "text": {
            "type": "plain_text",
            "text": ":writing_hand: Submit PTO Request",
            "emoji": true
          },
          "style": "primary",
          "value": "submit_request"
        }
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "context",
      "block_id": "help_info",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Need help? Contact <mailto:hr@example.com|HR Team> for any PTO-related inquiries. :love_letter:"
        }
      ]
    }
  ];
};
