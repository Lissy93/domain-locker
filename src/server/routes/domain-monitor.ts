import { defineEventHandler } from 'h3';

function getEnvVar(name: string, fallback?: string): string {
  const val = process.env[name] || (import.meta.env && import.meta.env[name]);
  if (!val && !fallback) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val || fallback!;
}

async function callPgExecutor<T>(pgExecutorEndpoint: string, query: string, params?: any[]): Promise<T[]> {
  try {
    const res = await fetch(pgExecutorEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, params: params || [] }),
    });
    if (!res.ok) {
      throw new Error(`callPgExecutor responded with HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    throw new Error(`callPgExecutor error: ${(err as Error).message}`);
  }
}

async function checkDomainUptime(domainName: string): Promise<{
  is_up: boolean;
  response_code: number;
  response_time_ms: number;
  dns_lookup_time_ms: number;
  ssl_handshake_time_ms: number;
}> {
  const url = `https://${domainName}`;
  const start = performance.now();
  try {
    const res = await fetch(url, { method: 'GET' });
    const end = performance.now();

    const isUp = res.status < 400;
    const totalTimeMs = end - start;

    // TODO: Find accurate way to measure DNS & SSL times, like in managed version
    const dnsTimeMs = Math.round(totalTimeMs * 0.2);
    const sslTimeMs = Math.round(totalTimeMs * 0.3);

    return {
      is_up: isUp,
      response_code: res.status,
      response_time_ms: Math.round(totalTimeMs),
      dns_lookup_time_ms: dnsTimeMs,
      ssl_handshake_time_ms: sslTimeMs,
    };

  } catch (err) {
    const end = performance.now();
    const totalTimeMs = end - start;
    return {
      is_up: false,
      response_code: 0,
      response_time_ms: Math.round(totalTimeMs),
      dns_lookup_time_ms: 0,
      ssl_handshake_time_ms: 0,
    };
  }
}

export default defineEventHandler(async (event) => {

  if (getEnvVar('DL_ENV_TYPE') !== 'selfHosted') {
    return { error: 'This endpoint is only available in self-hosted environments.' };
  }

  try {
    const baseUrl = getEnvVar('BASE_URL', 'http://localhost:3000');
    const pgExecutorEndpoint = `${baseUrl}/api/pg-executer`;

    const allDomains = await callPgExecutor<{ id: string; domain_name: string }>(
      pgExecutorEndpoint,
      `
        SELECT id, domain_name
        FROM domains
        ORDER BY domain_name ASC
      `
    );

    if (!allDomains.length) {
      return { message: 'No domains found, nothing to check.' };
    }

    const results: Array<{ domain: string; status: string; error?: string }> = [];

    for (const d of allDomains) {
      try {
        const uptimeData = await checkDomainUptime(d.domain_name);

        await callPgExecutor(pgExecutorEndpoint,
          `
          INSERT INTO uptime
            (domain_id, is_up, response_code, response_time_ms, dns_lookup_time_ms, ssl_handshake_time_ms)
          VALUES
            ($1::uuid, $2::boolean, $3::int, $4::numeric, $5::numeric, $6::numeric)
          `,
          [
            d.id,
            uptimeData.is_up,
            uptimeData.response_code,
            uptimeData.response_time_ms,
            uptimeData.dns_lookup_time_ms,
            uptimeData.ssl_handshake_time_ms
          ]
        );

        const msg = uptimeData.is_up 
          ? `✅ ${d.domain_name} is up (code: ${uptimeData.response_code})`
          : `❌ ${d.domain_name} is down`;
        results.push({ domain: d.domain_name, status: msg });

      } catch (err: any) {
        results.push({ domain: d.domain_name, status: 'error', error: err.message });
      }
    }
    return {
      results,
      note: '📶 Uptime checks complete!',
    };

  } catch (err: any) {
    return { error: err.message };
  }
});
