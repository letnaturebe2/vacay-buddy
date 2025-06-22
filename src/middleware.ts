import type { AllMiddlewareArgs, App } from '@slack/bolt';
import type { AppContext } from './app';
import type { Organization } from './entity/organization.model';
import { organizationService, userService } from './service';
import { assert } from './utils';

const loadAppContext = async ({ context, client, next }: AllMiddlewareArgs<AppContext>) => {
  const organizationId = context.teamId || context.enterpriseId;
  assert(organizationId !== undefined, 'Organization ID is undefined');

  if (!organizationId || !context.userId) {
    return await next();
  }

  const organization: Organization = await organizationService.getOrCreateOrganization(
    organizationId,
    context.enterpriseId !== undefined,
  );

  const result = await client.users.info({
    user: context.userId,
    include_locale: true,
  });

  const slackUser = result.user;

  context.locale = slackUser?.locale ?? 'ko-KR';
  context.organization = organization;
  context.user = await userService.getOrCreateUser(context.userId, context.organization);

  if (context.user.name !== slackUser?.real_name) {
    context.user.name = slackUser?.real_name ?? '';
    await userService.updateUser(context.userId, {
      ...context.user,
      name: context.user.name,
      tz: slackUser?.tz ?? 'Asia/Seoul',
      tz_offset: slackUser?.tz_offset ?? 32400,
    });
  }

  await next();
};

const registerMiddleware = (app: App) => {
  app.use(loadAppContext);
};

export default registerMiddleware;
