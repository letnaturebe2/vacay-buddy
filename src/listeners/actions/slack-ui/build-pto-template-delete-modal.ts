import type { AnyBlock } from '@slack/types';
import { AppContext } from '../../../app';
import type { PtoTemplate } from '../../../entity/pto-template.model';
import { t } from '../../../i18n';
import { assert } from '../../../utils';

export const buildPtoTemplateDeleteModal = async (
  context: AppContext,
  ptoTemplate: PtoTemplate,
): Promise<AnyBlock[]> => {
  assert(!!ptoTemplate.id, 'Template information is required for deletion');

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${t(context.locale, 'delete_template_confirmation')}*`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: t(context.locale, 'delete_template_warning', { title: ptoTemplate.title }),
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `:exclamation: ${t(context.locale, 'delete_template_irreversible')}`,
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${t(context.locale, 'template_content_label')}:*\n\n${ptoTemplate.content}`,
      },
    },
  ];
};
