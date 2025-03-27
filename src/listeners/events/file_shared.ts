import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import axios from 'axios';
import * as XLSX from 'xlsx';
import type { AppContext } from '../../app';

const file_shared = async ({
  client,
  event,
  logger,
  context,
}: AllMiddlewareArgs<AppContext> & SlackEventMiddlewareArgs<'file_shared'>) => {
  try {
    // // Fetch all users in the workspace
    // const userListResponse = await client.users.list({
    //   team_id: context.teamId,
    //   limit: 999
    // });
    //
    // // Create users for all team members
    // if (userListResponse.ok && userListResponse.members) {
    //   for (const member of userListResponse.members) {
    //     // Skip bots, deleted users, etc.
    //     if (!member.is_bot && !member.deleted && member.id) {
    //       await userService.getOrCreateUser(member.id, context.team);
    //     }
    //   }
    // }

    const fileId = event.file_id;
    const fileInfo = await client.files.info({ file: fileId });

    if (!fileInfo.file) {
      return;
    }

    const fileUrl = fileInfo.file.url_private_download;

    // download file
    const response = await axios({
      method: 'get',
      url: fileUrl,
      headers: {
        Authorization: `Bearer ${context.botToken}`,
      },
      responseType: 'arraybuffer',
    });

    if (response.status !== 200) {
      logger.error(`Failed to download file: ${response.statusText}`);
      return;
    }

    const buffer = response.data;

    // 3. parsing
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    // 4. 데이터 출력 or 처리
    logger.info('Parsed Excel Data:', jsonData);

    // 원하는 데이터 처리 로직 추가
  } catch (error) {
    logger.error('Error in file_shared handler:', error);
  }
};

export default file_shared;
