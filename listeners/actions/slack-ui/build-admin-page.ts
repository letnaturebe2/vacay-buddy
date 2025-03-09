import type {AnyBlock} from '@slack/types';
import {ActionId} from "../../../config/constants";

export const buildAdminPage = async (
  ptoTemplates: {
    name: string
    status: string
    description: string
  }[]
): Promise<AnyBlock[]> => {
  const blocks: AnyBlock[] = [
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "Back to Home",
            "emoji": true
          },
          "action_id": ActionId.UPDATE_BACK_TO_HOME
        },
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "header",
      "block_id": "manage_admins_header",
      "text": {
        "type": "plain_text",
        "text": ":busts_in_silhouette: Manage Admins",
        "emoji": true
      },
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "action_id": ActionId.OPEN_ADMIN_MANAGE,
          "text": {
            "type": "plain_text",
            "text": ":busts_in_silhouette: Manage Admins",
            "emoji": true
          },
          "style": "primary",
        },
      ]
    },
    {
      "type": "divider"
    },
    {
      "type": "header",
      "block_id": "pto_templates_header",
      "text": {
        "type": "plain_text",
        "text": "PTO Templates :spiral_calendar_pad:",
        "emoji": true
      }
    },
  ];


  for (const template of ptoTemplates) {
    blocks.push(
      {
        "type": "section",
        "block_id": `template_${template.name}`,
        "text": {
          "type": "mrkdwn",
          "text": `*${template.name}*\n>Status: ${template.status}\n>Description:\n>${template.description || 'No description provided.'}`,
        },
        "accessory": {
          "type": "overflow",
          "action_id": `template_${template.name}_overflow`,
          "options": [
            {
              "text": {
                "type": "plain_text",
                "text": ":pencil2: Edit",
                "emoji": true
              },
              "value": `edit_${template.name}`
            },
            {
              "text": {
                "type": "plain_text",
                "text": ":x: Delete",
                "emoji": true
              },
              "value": `delete_${template.name}`
            }
          ]
        }
      }
    );
  }

  blocks.push(
    {
      "type": "actions",
      "block_id": "create_pto_template",
      "elements": [
        {
          "type": "button",
          "action_id": "create_pto_template",
          "text": {
            "type": "plain_text",
            "text": ":spiral_calendar_pad: Manage PTO Templates",
            "emoji": true
          },
          "style": "primary",
          "value": "create_pto_template"
        }
      ]
    }
  );

  blocks.push(
    {
      "type": "divider"
    }
  );

  return blocks;
};