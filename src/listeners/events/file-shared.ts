import type { AllMiddlewareArgs, SlackEventMiddlewareArgs } from '@slack/bolt';
import axios from 'axios';
import * as XLSX from 'xlsx';
import type { AppContext } from '../../app';
import { User } from '../../entity/user.model';
import { t } from '../../i18n';
import { userService } from '../../service';
import { assert } from '../../utils';

const fileShared = async ({
  client,
  event,
  logger,
  context,
}: AllMiddlewareArgs<AppContext> & SlackEventMiddlewareArgs<'file_shared'>) => {
  try {
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

    // parsing
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const users = XLSX.utils.sheet_to_json(sheet) as {
      slack_id: string;
      name: string;
      annual_pto_days: number;
      remaining_pto_days: number;
    }[];

    logger.info('Parsed Excel Data:', users);

    let updatedCount = 0;
    for (const user of users) {
      const { slack_id, name, annual_pto_days, remaining_pto_days } = user;

      if (annual_pto_days < remaining_pto_days) {
        assert(
          false,
          t('ko-KR', 'annual_pto_days_error', {
            // TODO: hardcode ko-KR
            annual: annual_pto_days.toString(),
            remaining: remaining_pto_days.toString(),
            name: name,
          }),
        );
      }

      const userData = {
        userId: slack_id,
        name,
        organization: context.organization,
        annualPtoDays: annual_pto_days,
        usedPtoDays: annual_pto_days - remaining_pto_days,
      } as Partial<User>;

      await userService.upsertUser(slack_id, userData);
      updatedCount++;
    }

    await client.chat.postMessage({
      channel: event.channel_id,
      text: `✅ ${t(context.locale, 'users_updated_success', { count: updatedCount.toString() })}`,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    await client.chat.postMessage({
      channel: event.channel_id,
      text: t(context.locale, 'file_shared_error', { message: errorMessage }),
    });

    logger.error(errorMessage);
  }
};

export default fileShared;
