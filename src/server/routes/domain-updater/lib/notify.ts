// server/api/trigger-updates/lib/notifyIfEnabled.ts

import { callPgExecutor } from './pgExecutor';
// import { Logger } from './logger';

// const log = new Logger('notify');

/**
 * Check if a notification should be sent for a changeType, and insert it if so.
 */
export async function notifyUser(
  pgExec: string,
  domainId: string,
  userId: string,
  changeType: string,
  message?: string
): Promise<void> {
  try {
    const prefs = await callPgExecutor<any>(
      pgExec,
      `SELECT notification_type FROM notification_preferences WHERE domain_id = $1 AND is_enabled = true`,
      [domainId]
    );

    if (!prefs || prefs.length === 0) return;

    const enabledTypes = prefs.map((p: any) => p.notification_type);

    const isEnabled = enabledTypes.some((prefix: string) =>
      changeType.startsWith(prefix)
    );

    if (!isEnabled) {
      return;
    }

    // Insert notification
    await callPgExecutor(
      pgExec,
      `
      INSERT INTO notifications (user_id, domain_id, change_type, message)
      VALUES ($1, $2, $3, $4)
      `,
      [userId, domainId, changeType, message || null]
    );

    // Placeholder: Webhook / external dispatch
    // log.info(`📤 Notification queued: domain=${domainId}, type=${changeType}`);

    console.log(`Notification queued: domain=${domainId}, type=${changeType}`);

    // TODO: Dispatch webhook or send notification to user
  } catch (err: any) {
    // log.error(`Failed to insert notification for ${changeType}: ${err.message}`);
  }
}
