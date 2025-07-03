import { type Application } from 'express';
import excelTemplate from './excel-template';
import home from './home';
import pendingNotification from './pending-notification';
import teamVacation from './team-vacation';
import userVacation from './user-vacation';
import vacationApi from './vacation-api';

const registerRoutes = (app: Application) => {
  userVacation(app);
  teamVacation(app);
  excelTemplate(app);
  home(app);
  pendingNotification(app);
  vacationApi(app);
};

export default { register: registerRoutes };
