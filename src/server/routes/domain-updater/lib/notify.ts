import { callPgExecutor } from './pgExecutor';

const DEFAULT_USER_ID = 'a0000000-aaaa-42a0-a0a0-00a000000a69';

export async function notifyUser(
  pgExec: string,
  domainId: string,
  changeType: string,
  message: string
): Promise<void> {
  const prefs = await callPgExecutor<{ is_enabled: boolean }>(
    pgExec,
    `SELECT is_enabled FROM notification_preferences WHERE domain_id = $1 AND notification_type = $2`,
    [domainId, changeType]
  );

  if (!prefs.length || !prefs[0].is_enabled) return;

  await callPgExecutor(pgExec,
    `INSERT INTO notifications (user_id, domain_id, change_type, message, sent, read)
     VALUES ($1, $2, $3, $4, false, false)`,
    [DEFAULT_USER_ID, domainId, changeType, message]
  );
}
