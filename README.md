# PTO Management Made Easy with Slack!

*[한국어 문서](README.ko.md)*

#### VacayBuddy is a smart PTO management assistant that handles everything from requesting time off to approvals and status tracking directly within Slack.<a href="https://vacaybuddy-server-1080165942907.asia-northeast3.run.app//slack/install">

<div> 
<a href="https://vacaybuddy-server-1080165942907.asia-northeast3.run.app//slack/install">
Install 
<img src="assets/logo/slack_icon.png" alt="Slack logo" width="15">
</a>
</div>

## Simple PTO Requests

<img src="./assets/gifs/pto-request.gif" alt="PTO request screen">

- **Request Directly in Slack**: Request time off with just a few clicks in the Slack app home.
- **Check Remaining PTO**: View your remaining PTO balance at a glance from the home tab after installing the bot.
- **Previous PTO History**: Check detailed history of your submitted PTO requests.

## Convenient Approval and Review

<img src="./assets/gifs/pto-approve.gif" alt="PTO review screen">

- **Notifications and Approvals**: Receive message notifications for PTO requests and approve or reject through a modal window.
- **Easy Approval Process**: Open a modal window directly from Slack messages or the home tab to approve or reject requests.

## Admin Features

<img src="./assets/gifs/admin.gif" alt="Admin page">

- **Custom PTO Template Management**: Freely configure and manage various types of leave such as annual leave, half-day leave, and reward leave.
- **Team PTO Management Dashboard**: View and manage all team members' PTO requests and remaining balances at a glance.

## Smart PTO Data Management

<img src="./assets/gifs/user-excel-upload.gif" alt="Excel data screen">

- **Excel Data Integration**: Upload and automatically synchronize PTO data for team members previously managed in Excel files.
- **Smooth PTO Transition**: Easily migrate from existing systems to VacayBuddy for seamless PTO management system transition.

## Installation Guide

### Creating a Slack App

1. Go to [https://api.slack.com/apps/new](https://api.slack.com/apps/new) and select "From an app manifest"
2. Choose the workspace where you want to install the app
3. Copy the `manifest.json` content into the text box and click "Next"
4. Review the configuration and click "Create"
5. Click "Install to Workspace" and select "Allow"

### Setting Environment Variables

1. Copy `env.sample` to `.env`
2. Configure the environment variables as follows:

```
# Socket Mode Configuration (Required for Socket Mode)
SLACK_BOT_TOKEN=xoxb-ababa
SLACK_APP_TOKEN=xapp-1abab

# HTTP Mode Configuration (Required for HTTP Mode)
SLACK_SIGNING_SECRET=...
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
SLACK_STATE_SECRET=...

# Slack OAuth Scopes
SLACK_SCOPES=files:read,im:history,im:write,users:read,users:read.email,chat:write,chat:write.public,channels:read

# Application Settings
APP_URL=...  # Required for HTTP Mode, enter ngrok address for local development
JWT_SECRET=JWT_SECRET

# Database Configuration (Default: SQLite)
# SQLite is used by default and can be run locally without additional configuration.
# To use MySQL, uncomment and fill in the following settings (optional)
#DB_TYPE=mysql
#DB_HOST=
#DB_PORT=3306
#DB_USERNAME=
#DB_PASSWORD=
#DB_DATABASE=
#DB_SYNC=true
#DB_LOGGING=false
```

3. Check the required tokens and secrets from your [app settings page](https://api.slack.com/apps) and enter them.
4. By default, a SQLite database is used, so you can run the app without additional database configuration.

### Local Execution Methods

VacayBuddy can be run in two modes:

#### 1. Socket Mode (For Development)
Communicate with Slack without tunneling in a local development environment. Recommended for initial development stages.
Required environment variables: `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`

```bash
npm install
npm run dev-socket
```

#### 2. HTTP Mode (For Production)
Communicate with Slack through HTTP endpoints, identical to the actual production environment.
Required environment variables: `SLACK_SIGNING_SECRET`, `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_STATE_SECRET`, `APP_URL`

To test HTTP Mode locally:
1. Install [ngrok](https://ngrok.com/) and create a tunnel with the command `ngrok http 3000`
2. Set the generated ngrok URL in the `APP_URL` field of your `.env` file
3. Update the Redirect URLs and Event Subscriptions URL in your Slack app settings to match the ngrok URL

```bash
npm install
npm run dev-http
```

#### Production Deployment
```bash
npm start
```

## Slack Community
Leave your questions or feedback in our Slack channel. We look forward to your input!
[Join the Channel](https://join.slack.com/t/vacay-buddy/shared_invite/zt-328y00o5z-HoneR_Gl4iNlg9sNMMgrNg)

## LICENSE
Distributed under the MIT License. See [LICENSE](LICENSE) file for more information.

## Contact
For PTO related inquiries, please contact letnaturebe2@gmail.com. 