// import { type Application, Request, Response } from 'express';
// import { GaxiosError } from 'gaxios';
// import { OAuth2Client } from 'google-auth-library';
// import { google } from 'googleapis';
// import { userService } from '../service';
//
// function createOAuthClient(): OAuth2Client {
//   return new google.auth.OAuth2(process.env.CLIENT_ID, process.env.CLIENT_SECRET, process.env.REDIRECT_URI);
// }
//
// export default (app: Application) => {
//   app.get('/googleauth', (req: Request, res: Response) => {
//     const userId = req.query.userId as string;
//     const oauth2Client = createOAuthClient();
//     const authUrl = oauth2Client.generateAuthUrl({
//       access_type: 'offline',
//       scope: ['https://www.googleapis.com/auth/calendar.events'],
//       prompt: 'consent',
//       state: userId,
//     });
//     res.redirect(authUrl);
//   });
//
//   app.get('/googlecallback', async (req: Request, res: Response) => {
//     const code = req.query.code as string;
//     const userId = req.query.state as string;
//     const oauth2Client = createOAuthClient();
//     const { tokens } = await oauth2Client.getToken(code);
//     await userService.updateUser(userId, {
//       googleRefreshToken: tokens.refresh_token,
//     });
//
//     // send a success message
//     res.send('✅ Successfully authenticated with Google! You can now create events on your Google Calendar.');
//   });
//
//   // create a new event on the user's google calendar
//   app.post('/create-event', async (req: Request, res: Response) => {
//     const { userId } = req.body;
//
//     if (!userId) {
//       res.status(400).send('Missing userId or event data');
//       return;
//     }
//
//     const user = await userService.getUser(userId);
//     if (user.googleRefreshToken === null) {
//       res.status(401).send('User not authenticated with Google');
//       return;
//     }
//
//     const oauth2Client = createOAuthClient();
//     oauth2Client.setCredentials({
//       refresh_token: user.googleRefreshToken,
//     });
//
//     const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
//
//     const event = {
//       summary: 'Test Event from VacayBuddy',
//       start: {
//         dateTime: '2025-04-21T10:00:00+09:00',
//       },
//       end: {
//         dateTime: '2025-04-21T11:00:00+09:00',
//       },
//     };
//
//     try {
//       await calendar.events.insert({
//         calendarId: 'primary',
//         requestBody: event,
//       });
//
//       res.send('✅ Event created on your Google Calendar!');
//     } catch (apiError: unknown) {
//       const error = apiError as GaxiosError;
//       // re-authenticate if the token is expired
//       res.status(401).send('Failed to create event.');
//     }
//   });
// };
