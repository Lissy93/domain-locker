// src/utils/whois.ts

import whois from 'whois-json';
import Logger from './logger';

const log = new Logger('whois');
const WHOISXML_API_KEY = process.env['WHOISXML_API_KEY'];
const RDAP_BOOTSTRAP_URL = 'https://data.iana.org/rdap/dns.json';

interface WhoisResult {
  domainName: string | null;
  registrar: {
    name: string | null;
    id: string | null;
    url: string | null;
    registryDomainId: string | null;
  };
  dates: {
    creation_date: string | null;
    updated_date: string | null;
    expiry_date: string | null;
  };
  whois: {
    name: string | null;
    organization: string | null;
    street: string | null;
    city: string | null;
    country: string | null;
    state: string | null;
    postal_code: string | null;
  };
  abuse: {
    email: string | null;
    phone: string | null;
  };
  status: string[];
  dnssec: string | null;
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
    const raw = await whois(trimmed);
    if (raw && typeof raw === 'object' && Object.keys(raw).length > 0) {
      log.success(`Got WHOIS data via whois-json for ${domain}`);
      return normalizeWhoisJson(raw);
    }
    log.warn(`whois-json returned empty for ${domain}, falling back`);
    return await fallback();
  } catch (err) {
    log.warn(`whois-json failed for ${domain}: ${(err as Error).message}`);
    return await fallback();
  }
};

// --- Normalizers and fallback methods ---

const normalizeWhoisJson = (raw: any): WhoisResult => ({
  domainName: raw.domainName || null,
  registrar: {
    name: raw.registrarName || raw.registrar || null,
    id: raw.registrarIanaId || null,
    url: raw.registrarUrl || null,
    registryDomainId: raw.registryDomainId || null,
  },
  dates: {
    creation_date: raw.creationDate || null,
    updated_date: raw.updatedDate || null,
    expiry_date: raw.expiryDate || raw.registrarRegistrationExpirationDate || null,
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
});

const parseStatusArray = (status?: string): string[] =>
  status
    ? Array.from(new Set([...status.matchAll(/([a-zA-Z]+Prohibited)/g)].map(m => m[1])))
    : [];

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
        id: null,
        url: null,
        registryDomainId: json.handle || null,
      },
      dates: {
        creation_date: getEvent('registration'),
        updated_date: getEvent('last changed'),
        expiry_date: getEvent('expiration'),
      },
      whois: {
        name: null,
        organization: null,
        street: null,
        city: null,
        country: null,
        state: null,
        postal_code: null,
      },
      abuse: {
        email: abuseEmail,
        phone: null,
      },
      status: json.status || [],
      dnssec: json.secureDNS?.zoneSigned ? 'signed' : null,
    };
  } catch (err) {
    log.warn(`RDAP failed for ${domain}: ${(err as Error).message}`);
    return null;
  }
};

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
        url: record.whoisServer ? `https://${record.whoisServer}` : null,
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
        city: registrant.state || null,
        country: registrant.countryCode || null,
        postal_code: registrant.postalCode || null,
        state: null,
      },
      abuse: {
        email: null,
        phone: null,
      },
      status: [],
      dnssec: null,
    };
  } catch (err) {
    log.warn(`WhoisXML failed for ${domain}: ${(err as Error).message}`);
    return null;
  }
};
