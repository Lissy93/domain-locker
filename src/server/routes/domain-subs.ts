/**
 * API endpoint for getting subdomains, along with associated data for a given hostname.
 * Expects use of my custom Cloudflare worker, but also supports fallback to Shodan.
 * TODO: If there is a way to do this by looking at dns zone transfer records, that would be optimal.
 */
import { defineEventHandler, getQuery } from 'h3';
import { verifyAuth } from '../utils/auth';
import Logger from '../utils/logger';

const log = new Logger('domain-subs');

type Subdomain = {
  subdomain: string;
  tags?: string[];
  type: string;
  ip: string;
  ports?: number[];
  asn: string;
  asn_name: string;
  asn_range: string;
  country?: string;
  country_code?: string;
  banners?: Record<string, any>;
};

type ServiceResponse = { subdomains?: Subdomain[]; error?: string };

// Service URLs
const SHODAN_URL = import.meta.env['DL_SHODAN_URL'];
const DNSDUMP_URL = import.meta.env['DL_DNSDUMP_URL'];

const preferredMethod = import.meta.env['DL_PREFERRED_SUBDOMAIN_PROVIDER'];

// Ok yeah, i know, this is messy; but in short we use your preferred method if it's valid
// otherwise we default to 'both' if both services are available, 
// Or pick a fallback service based on what's available
const METHOD: 'shod' | 'dnsdump' | 'both' = (() => {
  if (['shod', 'dnsdump', 'both'].includes(preferredMethod)) return preferredMethod;
  if (DNSDUMP_URL && SHODAN_URL) return 'both';
  return DNSDUMP_URL ? 'dnsdump' : 'shod';
})();

// If user is using one of these services, we need their API keys
const SHODAN_TOKEN = import.meta.env['SHODAN_TOKEN'] || '';
const DNS_DUMPSTER_TOKEN = import.meta.env['DNS_DUMPSTER_TOKEN'] || '';

// Fetches subdomains from a given service URL
async function fetchSubdomains(url: string): Promise<ServiceResponse> {
  log.debug(`Fetching subdomains from ${url}`);
  if (!url || url.includes('undefined')) {
    log.error('Unable to check for subdomains, this has not been configured on your instance yet');
    return { error: 'Skipping subdomains, service not configured - please check your environmental variables' };
  }

  const requestParams: { method?: string, headers?: Record<string, string> } = {};

  if (url.includes('dnsdump')) {
    if (!DNS_DUMPSTER_TOKEN) {
      log.error('DNSDumpster token is not configured');
      return { error: 'Service is not configured' };
    }
    requestParams.method = 'GET';
    requestParams.headers = { 'X-Api-Key': DNS_DUMPSTER_TOKEN };
  }

  try {
    const response = await fetch(url, requestParams);
    const data = await response.json();
    if (data.error) {
      log.error(`Error from ${url}: ${data.error}`);
      return { error: data.error };
    }
    if (url.includes('shodan')) {
      return { subdomains: parseShodanResponse(data) };
    } else {
      return { subdomains: parseDnsDumpResponse(data) };
    }
  } catch (error) {
    log.error(`Error fetching from ${url}: ${error}`);
    return { error: 'Failed to fetch data from service' };
  }
}

// Parses the response from Shodan into a common format
function parseShodanResponse(data: any): Subdomain[] {
  return (
    data.data?.map((entry: any) => {
      if (!entry.value || !entry.type || !entry.subdomain) return null;
      return {
        subdomain: entry.subdomain || data.domain,
        tags: entry.tags,
        type: entry.type,
        ip: entry.value,
        ports: entry.ports,
        asn: entry.asn || '',
        asn_name: entry.asn_name || '',
        asn_range: entry.asn_range || '',
        country: entry.country || 'unknown',
        country_code: entry.country_code || '??',
        banners: entry.banners,
      };
    })?.filter(Boolean) || []
  );
}

// Parses the response from DNSDumpster into a common format
function parseDnsDumpResponse(data: any): Subdomain[] {
  return (
    data.a?.map((entry: any) => {
      const ipData = entry.ips?.[0];
      if (!ipData?.ip || !entry.host) return null;
      return {
        subdomain: entry.host,
        tags: ipData.banners?.http?.apps || [],
        type: 'A',
        ip: ipData.ip,
        ports: ipData.banners?.http?.ports,
        asn: ipData.asn,
        asn_name: ipData.asn_name,
        asn_range: ipData.asn_range,
        country: ipData.country,
        country_code: ipData.country_code,
        banners: ipData.banners,
      };
    })?.filter(Boolean) || []
  );
}


// Merges and deduplicates responses from both services
async function mergeResponses(domain: string, shodUrl: string, dnsDumpUrl: string): Promise<Subdomain[]> {
  const [shodData, dnsData] = await Promise.all([
    fetchSubdomains(shodUrl),
    fetchSubdomains(dnsDumpUrl),
  ]);
  if (shodData.error && dnsData.error) {
    throw new Error('Both services failed');
  }
  const combined = [...(shodData.subdomains || []), ...(dnsData.subdomains || [])];

  // Deduplicate and strip full domain
  return combined.reduce((unique, sub) => {
    // Strip full domain if present
    const strippedSubdomain = sub.subdomain.replace(new RegExp(`\\.?${domain}$`), '') || '';
  
    // Find an existing entry with the same subdomain
    const existing = unique.find((u) => u.subdomain === strippedSubdomain);
  
    if (existing) {
      // Merge the data with the existing entry
      existing.tags = Array.from(new Set([...(existing.tags || []), ...(sub.tags || [])]));
      existing.ports = Array.from(new Set([...(existing.ports || []), ...(sub.ports || [])]));
      existing.banners = { ...existing.banners, ...sub.banners };
      existing.type = existing.type || sub.type; // Keep the first type
      existing.ip = existing.ip || sub.ip; // Prefer existing IP if available
    } else {
      // Add the new entry
      unique.push({ ...sub, subdomain: strippedSubdomain });
    }
  
    return unique;
  }, [] as Subdomain[]);
}

function removeDuplicates(subdomains: Subdomain[]): Subdomain[] {
  const uniqueMap = new Map<string, Subdomain>();

  subdomains.forEach((sub) => {
    if (!uniqueMap.has(sub.subdomain)) {
      uniqueMap.set(sub.subdomain, sub);
    }
  });

  return Array.from(uniqueMap.values());
}


export default defineEventHandler(async (event) => {

  const authResult = await verifyAuth(event);

  if (!authResult.success) {
    return { statusCode: 401, body: { error: authResult.error } };
  }

  const query = getQuery(event);
  const domain = (query['domain'] as string || '').replaceAll('www.', '').trim();

  if (!domain) {
    return { error: 'Domain name is required' };
  }

  const shodanUrl = SHODAN_URL ? `${SHODAN_URL}/${domain}` : `https://api.shodan.io/dns/domain/${domain}${SHODAN_TOKEN ? `?key=${SHODAN_TOKEN}` : ''}`;
  const dnsdumpUrl = DNSDUMP_URL ? `${DNSDUMP_URL}/${domain}` : `https://api.dnsdumpster.com/domain/${domain}`;

  try {
    let subdomains: Subdomain[] = [];
    log.debug(`Fetching subdomains for ${domain} using method: ${METHOD}`);
    if (METHOD === 'both') {
      subdomains = await mergeResponses(domain, shodanUrl, dnsdumpUrl);
    } else {
      const primaryUrl = METHOD === 'shod' ? shodanUrl : dnsdumpUrl;
      const fallbackUrl = METHOD === 'shod' ? dnsdumpUrl : shodanUrl;
      log.debug(`Primary URL: ${primaryUrl}, Fallback URL: ${fallbackUrl}`);

      const primaryData = await fetchSubdomains(primaryUrl);
      if (primaryData.error) {
        const fallbackData = await fetchSubdomains(fallbackUrl);
        if (fallbackData.error) {
          throw new Error('Both primary and fallback services failed');
        }
        subdomains = fallbackData.subdomains || [];
      } else {
        subdomains = primaryData.subdomains || [];
      }
    }

    return removeDuplicates(subdomains);
  } catch (error) {
    log.error(`Error fetching subdomains for ${domain}: ${error}`);
    return { error: 'Failed to retrieve subdomains' };
  }
});

// i'm a dinosaur. raaawwwr.
