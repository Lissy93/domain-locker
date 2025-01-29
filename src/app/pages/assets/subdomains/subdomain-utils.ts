import { Subdomain } from "~/app/../types/Database";

/**
 * The subdomain info (from sd_info column) is stored as a stringified array of KV pairs.
 * The entries can technically be anything, but there's a few common keys that we care most about
 * This func takes the parsed obj and returns an array of key-values ready for the UI
 * @param sdInfo 
 * @returns 
 */
export const makeKVList = (sdInfo: any): { key: string; value: string }[] => {
  if (!sdInfo) return [];

  if (typeof sdInfo === 'string') {
    try { sdInfo = JSON.parse(sdInfo); } catch (e) { return []; }
  }

  const results = [];
  if (sdInfo['type']) results.push({ key: 'Type', value: `${sdInfo['type']} Record` });
  if (sdInfo['ip']) results.push({ key: 'Value', value: sdInfo['ip'] });
  if (sdInfo['ports'] && sdInfo['ports'].length) {
    results.push({ key: 'Ports', value: sdInfo['ports'].join(', ') });
  }
  if (sdInfo['tags'] && sdInfo['tags'].length) {
    results.push({ key: 'Tags', value: sdInfo['tags'].join(', ') });
  }
  if (sdInfo['asn']) results.push({ key: 'ASN', value: sdInfo['asn'] });
  if (sdInfo['asn_name']) results.push({ key: 'ASN Name', value: sdInfo['asn_name'] });
  if (sdInfo['asn_range']) results.push({ key: 'ASN Range', value: sdInfo['asn_range'] });
  if (sdInfo['country'] && sdInfo['country'] !== 'unknown') results.push({ key: 'Country', value: sdInfo['country'] });

  return results;
}

/**
 * When we get subdomains back from the API, some of them are not that useful.
 * E.g.
 * - DNS records like _dmarc, _acme-challenge, etc.
 * - The www. subdomain, which is usually just a redirect
 * - Subdomains that are just the same as the domain name
 * This function just filters these subdomains out.
 * We call before displaying anything to the user, and before saving to the DB.
 * @param subdomains 
 * @returns 
 */
export const filterOutIgnoredSubdomains = (subdomains: any[], parentDomain?: string): any[] => {
  if (!subdomains || !subdomains.length) return [];
  return subdomains.filter(subdomain => {
    const name = subdomain.subdomain;
    if (!name) return false;
    if (name.startsWith('_')) return false;
    if (name === 'www') return false;
    if (parentDomain && (name === parentDomain)) return false;
    const parts = name.split('.');
    if (parts.length > 1 && parts[0] === parts[1]) return false;
    return true;
  });
};


export const cleanSubdomain = (subdomain: string): string => {
  return subdomain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('.')[0];
}

export const subdomainsReadyForSave = (
  subdomainNames: string[],
  subdomainInfo: { subdomain: string; [key: string]: any }[],
): { name: string; sd_info?: string | undefined; }[] => {
  return subdomainNames.map((sd: string) => {
    const subdomainData = subdomainInfo.find((info) => info.subdomain === sd);
    return {
      name: cleanSubdomain(sd),
      sd_info: subdomainData ? JSON.stringify(subdomainData) : undefined,
    };
  });
}

export const autoSubdomainsReadyForSave = (subdomainInfo: { subdomain: string; [key: string]: any }[]): { name: string; sd_info?: string | undefined; }[] => {
  return subdomainInfo.map((info) => {
    return {
      name: cleanSubdomain(info.subdomain),
      sd_info: JSON.stringify(info),
    };
  });
}



/**
 * For a given array of subdomains, group them by domain name.
 * @param subdomains 
 * @returns 
 */
export const groupSubdomains = (subdomains: any[]): { domain: string; subdomains: Subdomain[] }[] => {
  const grouped = subdomains.reduce((acc, subdomain) => {
    const domainName = subdomain.domains?.domain_name;

    // Skip subdomains without a domain name
    if (!domainName) return acc;

    // Safely parse the `sd_info` JSON
    let parsedSdInfo = null;
    if (subdomain.sd_info) {
      try {
        parsedSdInfo = JSON.parse(subdomain.sd_info);
      } catch (error) {
        console.warn(`Failed to parse sd_info for subdomain ${subdomain.name}:`, error);
      }
    }

    // Find the group for this domain or create it
    if (!acc[domainName]) {
      acc[domainName] = [];
    }

    // Push the subdomain into the appropriate group
    acc[domainName].push({
      ...subdomain,
      sd_info: parsedSdInfo, // Replace the original `sd_info` with the parsed object
    });

    return acc;
  }, {} as Record<string, any[]>);

  // Convert the grouped object into an array
  return Object.keys(grouped).map((domain) => ({
    domain,
    subdomains: grouped[domain],
  }));
}
