import { type Application, Request, Response } from 'express';

export default (app: Application) => {
  app.get('/', async (req: Request, res: Response) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Hello VacayBuddy</title></head>
      <body>
        <h1>Hello VacayBuddy</h1>
        <button onclick="window.location.href='/slack/install'">Install</button>
      </body>
    </html>
  `;
    res.set('Content-Type', 'text/html');
    res.send(html);
  });
};
