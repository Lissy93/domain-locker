import { defineEventHandler, getQuery } from 'h3';
import whois from 'whois-json';
import dns from 'dns';
import tls, { PeerCertificate } from 'tls';
import type { DomainInfo, HostData } from '../../types/DomainInfo';
import type { Contact, Host } from 'src/types/common';
import { verifyAuth } from '../utils/auth';
import Logger from '../utils/logger';

const log = new Logger('domain-info');

// --- Helpers ---

const safeExecute = async <T>(
  fn: () => Promise<T>,
  errorMsg: string,
  errors: string[],
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (err) {
    errors.push(errorMsg);
    log.warn(`${errorMsg}: ${(err as Error).message}`);
    return;
  }
};

const getParentDomain = (domain: string): string => {
  const parts = domain.split('.');
  return parts.length > 2 && parts[parts.length - 2].length > 3
    ? parts.slice(-2).join('.')
    : domain;
};

const getWhoisData = async (domain: string): Promise<any | null> => {
  try {
    const data = await whois(getParentDomain(domain));
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      log.debug(`Found primary WHOIS data for ${domain}`);
      return data as Contact;
    } else {
      log.warn(`Primary WHOIS data failed, attempting backup lookup for ${domain}`);
      const backup = await getWhoisBackupData(domain);
      return backup ?? null;
    }
  } catch (err) {
    log.error(`WHOIS lookup failed: ${(err as Error).message}`);
    return null;
  }
};

const getIpAddress = (domain: string) =>
  new Promise<string[]>((resolve) => {
    dns.resolve4(domain, (err, addresses) => resolve(err ? [] : addresses));
  });

const getIpv6Address = (domain: string) =>
  new Promise<string[]>((resolve) => {
    dns.resolve6(domain, (err, addresses) => resolve(err ? [] : addresses));
  });

const getMxRecords = (domain: string) =>
  new Promise<string[]>((resolve) => {
    dns.resolveMx(domain, (err, records) =>
      resolve(err ? [] : records.map(r => `${r.exchange} (priority: ${r.priority})`)),
    );
  });

const getTxtRecords = (domain: string) =>
  new Promise<string[]>((resolve) => {
    dns.resolveTxt(domain, (err, records) =>
      resolve(err ? [] : records.flatMap(r => r)),
    );
  });

const getNameServers = (domain: string) =>
  new Promise<string[]>((resolve) => {
    dns.resolveNs(domain, (err, records) => resolve(err ? [] : records));
  });

const getSslCertificateDetails = (domain: string): Promise<Partial<PeerCertificate>> =>
  new Promise((resolve, reject) => {
    const socket = tls.connect(443, domain, { servername: domain }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      cert ? resolve(cert) : reject(new Error('No certificate found'));
    });
    socket.on('error', reject);
  });

const getHostData = async (ip: string): Promise<Host | undefined> => {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=12249`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.regionName) data.region = data.regionName;
    return data;
  } catch (err) {
    log.warn(`IP info fetch failed: ${(err as Error).message}`);
    return;
  }
};

const makeStatusArray = (status?: string): string[] =>
  status ? Array.from(new Set([...status.matchAll(/([a-zA-Z]+Prohibited)/g)].map(m => m[1]))) : [];

const getWhoisBackupData = async (domain: string): Promise<any | null> => {
  const WHOISXML_API_KEY = import.meta.env['WHOISXML_API_KEY'];
  if (!WHOISXML_API_KEY) {
    log.warn('Skipping fallback lookup - no API key set.');
    return null;
  }

  const parent = getParentDomain(domain);
  const apiUrl = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOISXML_API_KEY}&outputFormat=json&domainName=${parent}`;

  try {
    const res = await fetch(apiUrl);
    if (!res.ok) {
      log.warn(`[WHOISXML] Request failed for ${parent}: ${res.statusText}`);
      return null;
    }

    const json = await res.json();
    const record = json?.WhoisRecord?.registryData ?? {};
    const registrant = record?.registrant ?? {};

    return {
      domainName: json?.WhoisRecord?.domainName || parent,
      registrar: {
        name: json?.WhoisRecord?.registrarName || record.registrarName || 'Unknown',
        id: json?.WhoisRecord?.registrarIANAID || 'Unknown',
        url: record.whoisServer ? `https://${record.whoisServer}` : null,
      },
      dates: {
        creation_date: record.createdDateNormalized || 'Unknown',
        expiry_date: record.expiresDateNormalized || 'Unknown',
        updated_date: record.updatedDateNormalized || 'Unknown',
      },
      whois: {
        name: registrant.name ?? null,
        organization: registrant.organization ?? null,
        street: registrant.street1 ?? null,
        city: registrant.state ?? null,
        country: registrant.countryCode ?? null,
        postal_code: registrant.postalCode ?? null,
      },
    };
  } catch (err) {
    log.error(`[WHOISXML] Fallback fetch failed: ${(err as Error).message}`);
    return null;
  }
};

// --- Main handler ---

export default defineEventHandler(async (event) => {
  const authResult = await verifyAuth(event);
  if (!authResult.success) {
    return { statusCode: 401, body: { error: authResult.error } };
  }

  const { domain } = getQuery(event);
  if (!domain || typeof domain !== 'string') {
    log.warn('Domain name is required for domain info lookup');
    return { error: 'Domain name is required' };
  }

  log.info(`Resolving domain info for: ${domain}`);
  const errors: string[] = [];
  const dunno = null;

  try {
    const whoisData = await getWhoisData(domain);
    if (!whoisData) {
      log.warn(`WHOIS data not found for ${domain}`);
      return { error: 'Failed to fetch WHOIS data' };
    }

    const [ipv4, ipv6, mx, txt, ns, ssl] = await Promise.all([
      safeExecute(() => getIpAddress(domain), 'IPv4 lookup failed', errors),
      safeExecute(() => getIpv6Address(domain), 'IPv6 lookup failed', errors),
      safeExecute(() => getMxRecords(domain), 'MX records failed', errors),
      safeExecute(() => getTxtRecords(domain), 'TXT records failed', errors),
      safeExecute(() => getNameServers(domain), 'NS records failed', errors),
      safeExecute(() => getSslCertificateDetails(domain), 'SSL cert fetch failed', errors),
    ]);

    const host = ipv4?.[0]
      ? await safeExecute(() => getHostData(ipv4[0]), 'Host info fetch failed', errors)
      : undefined;

    const registrarName =
      whoisData.registrarName ||
      (typeof whoisData.registrar === 'string'
        ? whoisData.registrar
        : whoisData?.registrar?.name) || dunno;

    const domainInfo: DomainInfo = {
      domainName: whoisData.domainName || dunno,
      status: makeStatusArray(whoisData.domainStatus),
      ip_addresses: { ipv4: ipv4 || [], ipv6: ipv6 || [] },
      dates: {
        expiry_date:
          whoisData.expiryDate ||
          whoisData.registrarRegistrationExpirationDate ||
          whoisData?.dates?.expiry_date,
        updated_date:
          whoisData.lastUpdated ||
          whoisData.updatedDate ||
          whoisData?.dates?.updated_date,
        creation_date:
          whoisData.creationDate || whoisData?.dates?.creation_date,
      },
      registrar: {
        name: registrarName,
        id: whoisData.registrarIanaId || dunno,
        url: whoisData.registrarUrl || dunno,
        registryDomainId: whoisData.registryDomainId || dunno,
      },
      whois: {
        name: whoisData.registrantName || dunno,
        organization: whoisData.registrantOrganization || dunno,
        street: whoisData.registrantStreet || dunno,
        city: whoisData.registrantCity || dunno,
        country: whoisData.registrantCountry || dunno,
        state: whoisData.registrantStateProvince || dunno,
        postal_code: whoisData.registrantPostalCode || dunno,
      },
      abuse: {
        email:
          whoisData.abuseContactEmail ||
          whoisData.registrarAbuseContactEmail ||
          dunno,
        phone:
          whoisData.abuseContactPhone ||
          whoisData.registrarAbuseContactPhone ||
          dunno,
      },
      dns: {
        dnssec: whoisData.dnssec || dunno,
        nameServers: ns || [],
        mxRecords: mx || [],
        txtRecords: txt || [],
      },
      ssl: {
        issuer: ssl?.issuer?.O || dunno,
        issuer_country: ssl?.issuer?.C || '',
        valid_from: ssl?.valid_from || '',
        valid_to: ssl?.valid_to || '',
        subject: ssl?.subject?.CN || '',
        fingerprint: ssl?.fingerprint || '',
        key_size: ssl?.bits || 0,
        signature_algorithm: ssl?.asn1Curve || '',
      },
      host,
    };

    log.success(`Successfully resolved: ${domain}`);
    return { domainInfo, errors: errors.length ? errors : undefined };
  } catch (err) {
    log.error(`Fatal error during domain lookup: ${(err as Error).message}`);
    return {
      error: 'An unexpected error occurred while processing domain information',
    };
  }
});
