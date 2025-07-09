import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import type { AppContext } from '../../app';
import { organizationService } from '../../service';
import { assert } from '../../utils';

const appUninstalledCallback = async ({
  event,
  logger,
  context,
}: AllMiddlewareArgs<AppContext> & SlackEventMiddlewareArgs<'app_uninstalled'>) => {
  const organizationId = context.teamId || context.enterpriseId;

  assert(organizationId !== undefined, 'Organization ID is undefined');

  await organizationService.deleteOrganization(organizationId);
  logger.info(`Organization ${organizationId} deleted successfully`);
};

export default appUninstalledCallback;
