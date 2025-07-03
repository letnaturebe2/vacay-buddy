import { type Application, Request, Response } from 'express';
import { assert } from '../utils';

export default (app: Application) => {
  app.get('/', async (req: Request, res: Response) => {
    assert(false, 'ddd');
    res.render('pages/home');
  });
};
