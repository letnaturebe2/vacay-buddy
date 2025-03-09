import type {AllMiddlewareArgs, App} from '@slack/bolt';
import {teamService} from "./service/team.service";
import {AppContext} from "./app";
import {Team} from "./entity/team";

const setLocale = async ({context, client, next}: AllMiddlewareArgs<AppContext>) => {
  const userId = context.userId;

  if (userId) {
    const result = await client.users.info({
      user: userId,
      include_locale: true,
    });

    context.locale = result.user?.locale ?? 'en-US';
  }

  await next();
};

const setTeam = async ({context, next}: AllMiddlewareArgs<AppContext>) => {
  if (!context.teamId) {
    return await next();
  }

  const team: Team | null = await teamService.getTeam(context.teamId);
  if (team) {
    context.team = team;
  } else {
    context.team = await teamService.upsertTeam(context.teamId);
  }

  await next();
};

const registerMiddleware = (app: App) => {
  app.use(setLocale);
  app.use(setTeam);
};

export default registerMiddleware;
