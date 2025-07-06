import { callPgExecutor } from '../lib/pgExecutor';
import { normalizeStr } from '../lib/utils';
import { recordDomainUpdate } from '../lib/recordUpdate';

export async function updateDNS(
  pgExec: string,
  domainRow: any,
  freshInfo: any,
  changes: string[]
): Promise<void> {
  const domainId = domainRow.id;
  const dns = freshInfo?.dns;
  if (!dns) return;

  const types = ['TXT', 'NS', 'MX'] as const;

  for (const type of types) {
    const freshRecords = Array.isArray(dns[type.toLowerCase()]) ? dns[type.toLowerCase()] : [];
    const freshSet = new Set(
      freshRecords.map((r: string) => normalizeStr(r)).filter(Boolean) as string
    );

    const existing = await callPgExecutor<{ id: string; record_value: string }>(
      pgExec,
      `SELECT id, record_value FROM dns_records WHERE domain_id = $1 AND record_type = $2`,
      [domainId, type]
    );

    const existingSet = new Set(
      existing.map((row) => normalizeStr(row.record_value)).filter(Boolean)
    );

    // Add new records
    for (const record of freshSet) {
      if (!existingSet.has(record)) {
        await callPgExecutor(pgExec,
          `INSERT INTO dns_records (domain_id, record_type, record_value) VALUES ($1, $2, $3)`,
          [domainId, type, record]
        );
        await recordDomainUpdate(pgExec, domainId, `DNS ${type} record added`, `dns_${type.toLowerCase()}_added`, '', record);
        changes.push(`DNS ${type}+`);
      }
    }

    // Remove stale records
    for (const row of existing) {
      const normalized = normalizeStr(row.record_value);
      if (!freshSet.has(normalized)) {
        await callPgExecutor(pgExec,
          `DELETE FROM dns_records WHERE id = $1`,
          [row.id]
        );
        await recordDomainUpdate(pgExec, domainId, `DNS ${type} record removed`, `dns_${type.toLowerCase()}_removed`, row.record_value, '');
        changes.push(`DNS ${type}-`);
      }
    }
  }

  // Handle DNSSEC flag
  if (typeof dns.dnssec === 'boolean' && domainRow.dnssec_enabled !== dns.dnssec) {
    await callPgExecutor(pgExec,
      `UPDATE domains SET dnssec_enabled = $1 WHERE id = $2`,
      [dns.dnssec, domainId]
    );
    await recordDomainUpdate(pgExec, domainId, `DNSSEC changed`, 'dnssec', String(domainRow.dnssec_enabled), String(dns.dnssec));
    changes.push('DNSSEC toggled');
  }
}
