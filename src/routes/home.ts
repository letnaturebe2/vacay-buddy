import { type Application, Request, Response } from 'express';

export default (app: Application) => {
  app.get('/', async (req: Request, res: Response) => {
    res.render('pages/home');
  });
};
