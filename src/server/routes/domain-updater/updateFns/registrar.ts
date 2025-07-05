import { callPgExecutor } from '../lib/pgExecutor';
import { recordDomainUpdate } from '../lib/recordUpdate';
import { normalizeStr } from '../lib/utils';

async function upsertRegistrar(pgExec: string, name: string, url: string | null, userId: string): Promise<string> {
  const res = await callPgExecutor<{ id: string }>(pgExec, `
    INSERT INTO registrars (name, url, user_id)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, name) DO UPDATE SET url = EXCLUDED.url
    RETURNING id
  `, [name, url, userId]);

  if (!res.length) throw new Error(`Failed to upsert registrar: ${name}`);
  return res[0].id;
}


export async function updateRegistrar(
  pgExec: string,
  domainRow: any,
  freshInfo: any,
  changes: string[]
): Promise<void> {
  const oldName = normalizeStr(domainRow.registrar?.name);
  const newName = normalizeStr(freshInfo?.registrar?.name);

  const userId = domainRow.user_id || 'a0000000-aaaa-42a0-a0a0-00a000000a69';

  if (!newName || oldName === newName) return;

  const registrarId = await upsertRegistrar(pgExec, freshInfo.registrar.name, freshInfo.registrar.url ?? null, userId);

  await recordDomainUpdate(
    pgExec,
    domainRow.id,
    'Registrar changed',
    'registrar',
    oldName,
    newName
  );

  await callPgExecutor(pgExec,
    `UPDATE domains SET registrar_id = $1::uuid WHERE id = $2::uuid`,
    [registrarId, domainRow.id]
  );

  changes.push('Registrar');
}

