import whois from 'whois-json';
import type { Dates, Registrar, Contact, Abuse } from '../../types/common';
import Logger from './logger';

const log = new Logger('whois');
const WHOISXML_API_KEY = process.env['WHOISXML_API_KEY'];
const RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';

interface WhoisResult {
  domainName: string | null;
  status: string[];
  dnssec: string | null;
  dates: Partial<Dates>;
  registrar: Partial<Registrar>;
  whois: Partial<Contact>;
  abuse: Partial<Abuse>;
}

let rdapBootstrapCache: Record<string, string> | null = null;

export const getWhoisInfo = async (domain: string): Promise<WhoisResult | null> => {
  const trimmed = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').trim();

  const fallback = async (): Promise<WhoisResult | null> => {
    const rdap = await tryRdapLookup(trimmed);
    if (rdap) return rdap;

    if (WHOISXML_API_KEY) {
      const xml = await tryWhoisXml(trimmed);
      if (xml) return xml;
    }

    return {} as WhoisResult;
  };

  try {
    const WHOIS_TIMEOUT_MS = 8000;
    const raw = await Promise.race([
      whois(trimmed),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`WHOIS timeout after ${WHOIS_TIMEOUT_MS}ms for ${domain}`)), WHOIS_TIMEOUT_MS)
      )
    ]);
    if (raw && typeof raw === 'object' && Object.keys(raw).length > 0) {
      log.success(`Got WHOIS data via whois-json for ${domain}`);
      return normalizeWhoisJson(raw);
    }
    log.warn(`whois-json returned empty for ${domain}, falling back`);
    return await fallback();
  } catch (err) {
    log.error(`whois-json failed for ${domain}: ${(err as Error).message}`);
    return await fallback();
  }
};

/* Converts mystery random whois structure into WhoisResult */
const normalizeWhoisJson = (raw: any): WhoisResult => {
  const registrarName = raw.registrarName
  || (typeof raw.registrar === 'string') ? raw.registrar : raw?.registrar?.name
  || 'Unknown';
  return {
    domainName: raw.domainName || null,
    registrar: {
      name: registrarName,
      id: raw.registrarIanaId || null,
      url: raw.registrarUrl || null,
      registryDomainId: raw.registryDomainId || null,
    },
    dates: { // Why can't we just have a single date option!!!
      creation_date:
        raw.creationDate ||
        raw.createdDate ||
        raw.created ||
        raw.domainRegistrationDate ||
        raw.registered ||
        raw.registrationDate ||
        (raw.dates && (raw.dates.creation_date || raw.dates.created)) ||
        null,
      updated_date:
        raw.updatedDate ||
        raw.lastUpdated ||
        raw.updated ||
        raw.domainLastUpdated ||
        raw.lastModified ||
        (raw.dates && (raw.dates.updated_date || raw.dates.updated)) ||
        null,
      expiry_date:
        raw.expiryDate ||
        raw.registrarRegistrationExpirationDate ||
        raw.expiresDate ||
        raw.expirationDate ||
        raw.domainExpirationDate ||
        raw.expiry ||
        (raw.dates && (raw.dates.expiry_date || raw.dates.expires)) ||
        null,
    },
    whois: {
      name: raw.registrantName || null,
      organization: raw.registrantOrganization || null,
      street: raw.registrantStreet || null,
      city: raw.registrantCity || null,
      country: raw.registrantCountry || null,
      state: raw.registrantStateProvince || null,
      postal_code: raw.registrantPostalCode || null,
    },
    abuse: {
      email: raw.abuseContactEmail || raw.registrarAbuseContactEmail || null,
      phone: raw.abuseContactPhone || raw.registrarAbuseContactPhone || null,
    },
    status: parseStatusArray(raw.domainStatus),
    dnssec: raw.dnssec || null,
  };
}

/* Statuses come back as long string with urls, convert to array of IDs */
const parseStatusArray = (status?: string): string[] => {
  if (!status) return [];

  const knownStatuses = [
    'clientDeleteProhibited',
    'clientHold',
    'clientRenewProhibited',
    'clientTransferProhibited',
    'clientUpdateProhibited',
    'serverDeleteProhibited',
    'serverHold',
    'serverRenewProhibited',
    'serverTransferProhibited',
    'serverUpdateProhibited',
    'inactive',
    'ok',
    'pendingCreate',
    'pendingDelete',
    'pendingRenew',
    'pendingRestore',
    'pendingTransfer',
    'pendingUpdate',
    'addPeriod',
    'autoRenewPeriod',
    'renewPeriod',
    'transferPeriod'
  ];
  // Convert to lowercase, just for the comparison
  const normalized = status.toLowerCase();
  // Match anything resembling a known status
  const matches = knownStatuses.filter((s) => normalized.includes(s.toLowerCase()));
  // Deduplicate + preserve ICANN casing
  return Array.from(new Set(matches));
};


/* Determine the url for an rdp lookup, based on the domains TLD */
const getRdapUrlForTld = async (tld: string): Promise<string | null> => {
  try {
    if (!rdapBootstrapCache) {
      const res = await fetch(RDAP_BOOTSTRAP_URL);
      if (!res.ok) throw new Error(`Failed to fetch IANA RDAP data`);
      const json = await res.json();

      rdapBootstrapCache = {};
      for (const [tlds, urls] of json.services) {
        for (const name of tlds) {
          rdapBootstrapCache[name] = urls[0].replace(/\/$/, '');
        }
      }
    }
    return rdapBootstrapCache[tld] ?? null;
  } catch (err) {
    log.warn(`Failed to fetch RDAP bootstrap: ${(err as Error).message}`);
    return null;
  }
};

const tryRdapLookup = async (domain: string): Promise<WhoisResult | null> => {
  try {
    const tld = domain.split('.').pop();
    if (!tld) return null;

    const rdapBase = await getRdapUrlForTld(tld);
    if (!rdapBase) {
      log.warn(`No RDAP base found for TLD .${tld}`);
      return null;
    }

    const res = await fetch(`${rdapBase}/domain/${domain}`);
    if (!res.ok) throw new Error(`RDAP request failed with ${res.status}`);
    const json = await res.json();

    const events = (json.events || []) as Array<{ eventAction: string; eventDate: string }>;
    const getEvent = (action: string) =>
      events.find((e) => e.eventAction === action)?.eventDate || null;

    const abuseEmail = json.entities?.flatMap((e: any) =>
      e.vcardArray?.[1]?.filter((v: any[]) => v[0] === 'email').map((v: any) => v[3])
    )?.[0] ?? null;

    return {
      domainName: json.ldhName || null,
      registrar: {
        name: json.handle || null,
        id: undefined,
        url: undefined,
        registryDomainId: json.handle || null,
      },
      dates: {
        creation_date: getEvent('registration') || undefined,
        updated_date: getEvent('last changed') || undefined,
        expiry_date: getEvent('expiration') || undefined,
      },
      whois: {
        name: undefined,
        organization: undefined,
        street: undefined,
        city: undefined,
        country: undefined,
        state: undefined,
        postal_code: undefined,
      },
      abuse: {
        email: abuseEmail,
        phone: undefined,
      },
      status: json.status || [],
      dnssec: json.secureDNS?.zoneSigned ? 'signed' : null,
    };
  } catch (err) {
    log.warn(`RDAP failed for ${domain}: ${(err as Error).message}`);
    return null;
  }
};

/* We can also try a whois lookup using a third-party API. But, unlikely to work if our whois failed */
const tryWhoisXml = async (domain: string): Promise<WhoisResult | null> => {
  try {
    const apiUrl =
      `https://www.whoisxmlapi.com/whoisserver/WhoisService?` +
      `apiKey=${WHOISXML_API_KEY}&outputFormat=json&domainName=${domain}`;

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const record = data?.WhoisRecord?.registryData ?? {};
    const registrant = record?.registrant ?? {};

    return {
      domainName: data?.WhoisRecord?.domainName || null,
      registrar: {
        name: data?.WhoisRecord?.registrarName || record.registrarName || null,
        id: data?.WhoisRecord?.registrarIANAID || null,
        url: data?.WhoisRecord?.customField3Value || record.whoisServer ? `https://${record.whoisServer}` : undefined,
        registryDomainId: record.registryDomainId || null,
      },
      dates: {
        creation_date: record.createdDateNormalized || null,
        expiry_date: record.expiresDateNormalized || null,
        updated_date: record.updatedDateNormalized || null,
      },
      whois: {
        name: registrant.name || null,
        organization: registrant.organization || null,
        street: registrant.street1 || null,
        city: registrant.city || registrant.state || null,
        country: registrant.countryCode || null,
        postal_code: registrant.postalCode || null,
        state: registrant.state || null,
      },
      abuse: {
        email: data?.WhoisRecord?.customField1Value || null,
        phone: data?.WhoisRecord?.customField2Value || null,
      },
      status: parseStatusArray(record.status || data?.WhoisRecord?.status),
      dnssec: null,
    };
  } catch (err) {
    log.warn(`WhoisXML failed for ${domain}: ${(err as Error).message}`);
    return null;
  }
};

