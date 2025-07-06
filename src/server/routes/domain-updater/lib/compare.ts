import { updateExpiryDate } from './../updateFns/expiry';
import { updateRegistrar } from './../updateFns/registrar';
import { updateDomainStatuses } from './../updateFns/statuses';
import { updateSSL } from './../updateFns/ssl';
import { updateWhois } from './../updateFns/whois';
import { updateDNS } from './../updateFns/dns';
import { updateHost } from './../updateFns/hosts';

export async function compareAndUpdateDomain(pgExec: string, domainRow: any, freshInfo: any) {
  const changes: string[] = [];

  const fns: any = [
    updateExpiryDate,
    updateRegistrar,
    updateDomainStatuses,
    updateSSL,
    updateWhois,
    updateDNS,
    updateHost,
  ];

  for (const fn of fns) {
    try {
      await fn(pgExec, domainRow, freshInfo, changes);
    } catch (err: any) {
      changes.push(`(⚠️ Error in ${fn.name}: ${err.message})`);
    }
  }

  return { domain: domainRow.domain_name, changes };
}
