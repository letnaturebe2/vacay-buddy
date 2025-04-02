import { type Application } from 'express';
import excelTemplate from './excel-template';
import home from './home';
import teamVacation from './team-vacation';
const registerRoutes = (app: Application) => {
  teamVacation(app);
  excelTemplate(app);
  home(app);
};

export default { register: registerRoutes };
