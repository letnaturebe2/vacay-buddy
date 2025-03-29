import type { AllMiddlewareArgs, App } from '@slack/bolt';
import type { AppContext } from './app';
import type { Organization } from './entity/organization.model';
import { organizationService, ptoService, userService } from './service';

const loadAppContext = async ({ context, client, next }: AllMiddlewareArgs<AppContext>) => {
  const organizationId = context.teamId || context.enterpriseId;
  if (!organizationId || !context.userId) {
    return await next();
  }

  const result = await client.users.info({
    user: context.userId,
    include_locale: true,
  });

  context.locale = result.user?.locale ?? 'en-US';

  const organization: Organization | null = await organizationService.getOrganization(organizationId);
  if (organization === null) {
    // first attempt to access the app
    context.organization = await organizationService.createOrganization(
      organizationId,
      context.enterpriseId !== undefined,
    );
    await ptoService.createDefaultPtoTemplates(context.organization);
  } else {
    context.organization = organization;
  }

  context.user = await userService.getOrCreateUser(context.userId, context.organization);

  if (context.user.name !== result.user?.real_name) {
    context.user.name = result.user?.real_name ?? '';
    await userService.updateUser(context.userId, {
      ...context.user,
      name: context.user.name,
    });
  }

  await next();
};

const registerMiddleware = (app: App) => {
  app.use(loadAppContext);
};

export default registerMiddleware;
