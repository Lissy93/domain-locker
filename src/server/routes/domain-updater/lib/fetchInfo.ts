export async function fetchDomainInfo(endpoint: string, domain: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const res = await fetch(`${endpoint}?domain=${encodeURIComponent(domain)}`, {
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch domain info for "${domain}", HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json?.domainInfo) {
      throw new Error(`No domainInfo found in response for "${domain}"`);
    }

    return json.domainInfo;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after 5 seconds for "${domain}"`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}
