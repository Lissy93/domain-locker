import { defineEventHandler } from 'h3';
import { getEnvVar, withTimeout } from './lib/utils';
import { callPgExecutor } from './lib/pgExecutor';
import { fetchDomainInfo } from './lib/fetchInfo';
import { compareAndUpdateDomain } from './lib/compare';

const DOMAIN_FETCH_TIMEOUT = 10000; // ms
const DOMAIN_UPDATE_TIMEOUT = 7000; // ms
const CONCURRENCY_LIMIT = 5;

type WorkerResult<R> = R | { domain: any; error: any };

async function runWithConcurrency<T, R>(
  items: T[],
  workerFn: (item: T) => Promise<R>,
  limit = CONCURRENCY_LIMIT
): Promise<WorkerResult<R>[]> {
  const results: WorkerResult<R>[] = [];
  const queue = [...items];

  const workers = new Array(limit).fill(null).map(async () => {
    while (queue.length) {
      const item = queue.shift();
      if (!item) continue;
      try {
        const result = await workerFn(item);
        results.push(result);
      } catch (err: any) {
        results.push({ domain: (item as any)?.domain_name ?? 'unknown', error: err.message });
      }
    }
  });

  await Promise.all(workers);
  return results;
}

export default defineEventHandler(async (event) => {
  if (getEnvVar('DL_ENV_TYPE') !== 'selfHosted') {
    return { error: 'Only available in self-hosted mode.' };
  }

  const baseUrl = getEnvVar('DL_BASE_URL', 'http://localhost:3000');
  const pgExecUrl = `${baseUrl}/api/pg-executer`;
  const domainInfoUrl = `${baseUrl}/api/domain-info`;

  let domains: any[] = [];

  try {
    domains = await withTimeout(
      callPgExecutor(pgExecUrl, `
        SELECT d.id, d.domain_name, d.expiry_date, 
               jsonb_build_object('name', r.name, 'url', r.url) as registrar
        FROM domains d
        LEFT JOIN registrars r ON d.registrar_id = r.id
        ORDER BY d.domain_name
      `),
      DOMAIN_FETCH_TIMEOUT
    );
  } catch (err: any) {
    return { error: `Failed to fetch domains: ${err.message}` };
  }

  if (!domains.length) {
    return { message: 'No domains found to update.' };
  }

  const results = await runWithConcurrency(domains, async (row) => {
    try {
      const fresh = await withTimeout(fetchDomainInfo(domainInfoUrl, row.domain_name), DOMAIN_FETCH_TIMEOUT);
      const { domain, changes } = await withTimeout(compareAndUpdateDomain(pgExecUrl, row, fresh), DOMAIN_UPDATE_TIMEOUT);

      return changes.length > 0
        ? { domain, changes, note: `✅ ${changes.length} changes were found and saved for ${domain}` }
        : { domain, changes: [], note: `ℹ️ No changes for ${domain}, all data is up-to-date` };
    } catch (err: any) {
      return { domain: row.domain_name, error: err.message };
    }
  });

  return {
    results,
    note: '📝 Domain updates complete!',
  };
});
