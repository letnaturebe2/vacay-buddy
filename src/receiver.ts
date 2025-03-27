import { ExpressReceiver } from '@slack/bolt';
import { Request, Response } from 'express';

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
});

// Simple HTML endpoint example
receiver.app.get('/', (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head><title>Hello Slack App!!!</title></head>
      <body><h1>Hello from Slack App@@@</h1></body>
    </html>
  `;

  res.set('Content-Type', 'text/html');
  res.send(html);
});

export default receiver;
