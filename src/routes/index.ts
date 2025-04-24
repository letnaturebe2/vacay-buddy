import { type Application } from 'express';
import excelTemplate from './excel-template';
// import googleCalendar from './google-calendar';
import home from './home';
import teamVacation from './team-vacation';
import userVacation from './user-vacation';

const registerRoutes = (app: Application) => {
  userVacation(app);
  teamVacation(app);
  excelTemplate(app);
  home(app);
  // googleCalendar(app);
};

export default { register: registerRoutes };