import { callPgExecutor } from '../lib/pgExecutor';
import { normalizeStr } from '../lib/utils';
import { recordDomainUpdate } from '../lib/recordUpdate';

export async function updateHost(
  pgExec: string,
  domainRow: any,
  freshInfo: any,
  changes: string[]
): Promise<void> {
  const domainId = domainRow.id;
  const userId = domainRow.user_id; // must be included in SELECT
  const fresh = freshInfo?.host;
  if (!fresh || !fresh.query || !userId) return;

  const existing = domainRow.host || {}; // from joined SELECT

  const fields = [
    'ip', 'lat', 'lon',
    'isp', 'org', 'as_number',
    'city', 'region', 'country'
  ] as const;

  const getStr = (obj: any, field: string) => normalizeStr(obj?.[field] ?? '');
  const getNum = (obj: any, field: string) => obj?.[field] !== undefined ? Number(obj[field]) : null;

  const mappedFresh = {
    ip: fresh.query,
    lat: getNum(fresh, 'lat'),
    lon: getNum(fresh, 'lon'),
    isp: fresh.isp,
    org: fresh.org,
    as_number: fresh.as,
    city: fresh.city,
    region: fresh.region || fresh.regionName,
    country: fresh.country
  };

  const hasChanged = fields.some((f) => {
    const oldVal = typeof mappedFresh[f] === 'number'
      ? Number(existing?.[f] ?? -1)
      : normalizeStr(existing?.[f]);

    const newVal = typeof mappedFresh[f] === 'number'
      ? Number(mappedFresh[f] ?? -1)
      : normalizeStr(mappedFresh[f]);

    return oldVal !== newVal;
  });

  if (!hasChanged) return;

  // Check if a host already exists for this IP and user
  const existingHost = await callPgExecutor<any>(
    pgExec,
    `SELECT id FROM hosts WHERE user_id = $1 AND ip = $2 LIMIT 1`,
    [userId, mappedFresh.ip]
  );

  let hostId: string;

  if (existingHost.length > 0) {
    hostId = existingHost[0].id;
  } else {
    const inserted = await callPgExecutor<any>(
      pgExec,
      `
      INSERT INTO hosts (ip, lat, lon, isp, org, as_number, city, region, country)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
      `,
      fields.map((f) => mappedFresh[f] ?? null)
    );
    hostId = inserted[0].id;
  }

  // Update domain's host_id
  await callPgExecutor(pgExec,
    `UPDATE domains SET host_id = $1 WHERE id = $2`,
    [hostId, domainId]
  );

  await recordDomainUpdate(
    pgExec,
    domainId,
    'Host changed',
    'host_changed',
    existing.ip ?? '',
    mappedFresh.ip
  );

  changes.push('Host');
}
