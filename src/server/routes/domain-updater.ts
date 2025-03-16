import { defineEventHandler, getQuery } from 'h3';

type FuckIt = any;

/**
 *  1. Helper to get environment variables with a fallback.
 */
function getEnvVar(name: string, fallback?: string): string {
  const val = process.env[name] || (import.meta.env && import.meta.env[name]);
  if (!val && !fallback) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val || fallback!;
}

/**
 *  2. Helper to call the Postgres executor endpoint.
 */
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

/**
 *  3. Helper to fetch fresh domain info from /api/domain-info
 */
async function fetchDomainInfo(domainInfoEndpoint: string, domain: string): Promise<any> {
  const url = `${domainInfoEndpoint}?domain=${encodeURIComponent(domain)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed fetching domain info for "${domain}". HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json || !json.domainInfo) {
    throw new Error(`Invalid domain info response for "${domain}"`);
  }
  return json.domainInfo;
}

/**
 *  4. Normalizers
 *     - normalizeStr: unify case & trim
 *     - normalizeDate: parse to a plain YYYY-MM-DD (ignoring time)
 */
function normalizeStr(val: string | null | undefined): string {
  if (val == null) return '';
  return val.trim().toLowerCase();
}

function normalizeDate(val: string | null | undefined): string {
  if (!val) return '';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) throw new Error();
    return d.toISOString(); // e.g. "2025-06-10T23:00:00.000Z"
  } catch {
    return normalizeStr(val);
  }
}

function datesDifferBeyondThreshold(
  oldDateStr: string | null | undefined,
  newDateStr: string | null | undefined,
  thresholdDays = 1
): boolean {
  if (!oldDateStr || !newDateStr) return false; // or true, depending on your logic

  const oldDate = new Date(oldDateStr);
  const newDate = new Date(newDateStr);
  if (isNaN(oldDate.getTime()) || isNaN(newDate.getTime())) {
    // If either is invalid, we can treat them as different, or skip
    return true;
  }

  const diffMs = Math.abs(newDate.getTime() - oldDate.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}


/**
 *  5. Notifier
 *     Insert a notification if preferences are enabled, and optionally call a webhook.
 */
async function handleNotifications(pgExecutorEndpoint: string, domainId: string, changeType: string, message: string): Promise<void> {
  const userId = 'a0000000-aaaa-42a0-a0a0-00a000000a69'; // default user_id in self-hosted

  // 1) Check if notification is enabled
  const prefs = await callPgExecutor<{ is_enabled: boolean }>(
    pgExecutorEndpoint,
    `
    SELECT is_enabled
    FROM notification_preferences
    WHERE domain_id = $1::uuid
    AND notification_type = $2::text
    `,
    [domainId, changeType]
  );

  if (!prefs.length || !prefs[0].is_enabled) {
    return;
  }

  // 2) Insert record into notifications
  await callPgExecutor(pgExecutorEndpoint,
    `
    INSERT INTO notifications (user_id, domain_id, change_type, message, sent, read)
    VALUES ($1, $2, $3, $4, false, false)
    `,
    [userId, domainId, changeType, message]
  );

  // 3) Potentially call a webhook
  // try {
  //   await fetch(WEBHOOK_URL, { method: 'POST', body: JSON.stringify({ domainId, changeType, message }) });
  // } catch (err) {
  //   // log error but don’t fail
  // }  
}

/**
 *  6. Helper to record a domain update and also create a notification if relevant.
 *     This keeps the code DRY.
 */
async function recordDomainUpdate(
  pgExecutorEndpoint: string,
  domainId: string,
  changeDescription: string,
  changeType: string,
  oldValue: string,
  newValue: string
) {
  const userId = 'a0000000-aaaa-42a0-a0a0-00a000000a69';
  // Insert domain_updates
  await callPgExecutor(pgExecutorEndpoint,
    `
    INSERT INTO domain_updates (domain_id, user_id, change, change_type, old_value, new_value)
    VALUES ($1::uuid, $2, $3, $4, $5, $6)
    `,
    [domainId, userId, changeDescription, changeType, oldValue, newValue]
  );

  // Then handle notifications
  await handleNotifications(pgExecutorEndpoint, domainId, changeType, `${changeDescription}: ${oldValue} → ${newValue}`);
}

/**
 *  7. Update steps:
 *     Each function tries to compare old vs new data for that segment (WHOIS, SSL, statuses, DNS, etc.).
 *     If something changed, we insert domain_updates and update DB accordingly.
 *     We do each block in a try/catch so that an error in one block does not fail the entire domain.
 */

async function updateExpiryDate(
  pgExec: string,
  domainRow: any,
  freshInfo: any,
  changes: string[]
) {
  const oldExpiryRaw = domainRow.expiry_date || '';
  const oldExpiry = new Date(oldExpiryRaw);
  const newExpiry = new Date(freshInfo.dates?.expiry_date);

  const diffDays = Math.abs((newExpiry.getTime() - oldExpiry.getTime()) / (1000 * 60 * 60 * 24));
  if (oldExpiry && newExpiry && diffDays > 7) {
    await recordDomainUpdate(
      pgExec,
      domainRow.id,
      'Expiry date changed',
      'expiry_domain',
      oldExpiryRaw.toString(),
      freshInfo.dates?.expiry_date
    );
    // Update domains table
    await callPgExecutor(pgExec,
      `UPDATE domains SET expiry_date = $1::uuid WHERE id = $2::uuid`,
      [newExpiry, domainRow.id]
    );
    changes.push('Expiry Date');
  }
}

/**
 * Upsert or reuse a registrar, returning its ID.
 */
async function upsertRegistrar(pgExec: string, registrarName: string): Promise<string> {
  // If the DB sets user_id via trigger, we only need to supply 'name'
  const insertQuery = `
    INSERT INTO registrars (name)
    VALUES ($1)
    ON CONFLICT (user_id, name) 
    DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;

  const rows = await callPgExecutor<{ id: string }>(pgExec, insertQuery, [registrarName]);
  if (!rows.length) {
    throw new Error(`Upsert registrar failed for "${registrarName}"`);
  }
  return rows[0].id;
}

/**
 * Compare old vs new registrar name. If changed, upsert in 'registrars' table,
 * then set domain's registrar_id to that ID.
 */
async function updateRegistrar(
  pgExec: string,
  domainRow: any,
  freshInfo: any,
  changes: string[]
) {
  const oldRegistrar = normalizeStr(domainRow.registrar?.name || '');
  const newRegistrar = normalizeStr(freshInfo.registrar?.name || '');
  
  // if no new name or if they match, do nothing
  if (!newRegistrar || oldRegistrar === newRegistrar) {
    return;
  }

  // 1) Upsert the new registrar record
  const registrarId = await upsertRegistrar(pgExec, freshInfo.registrar.name);
  
  // 2) Insert domain_updates
  await recordDomainUpdate(
    pgExec,
    domainRow.id,
    'Registrar changed',
    'registrar',
    oldRegistrar,
    newRegistrar
  );

  // 3) Update domain's registrar_id
  await callPgExecutor(pgExec,
    `UPDATE domains 
     SET registrar_id = $1::uuid
     WHERE id = $2::uuid`,
    [registrarId, domainRow.id]
  );

  changes.push('Registrar');
}


async function updateDomainStatuses(
  pgExec: string,
  domainRow: any,
  freshInfo: any,
  changes: string[]
) {
  // 1) Query existing statuses from domain_statuses table
  type StatusRow = { id: string; status_code: string };
  const existingStatuses = await callPgExecutor<StatusRow>(
    pgExec,
    `
    SELECT id, status_code
    FROM domain_statuses
    WHERE domain_id = $1::uuid
    `,
    [domainRow.id]
  );

  const dbSet = new Set(existingStatuses.map(s => normalizeStr(s.status_code)));
  const freshArr = Array.isArray(freshInfo.status) ? freshInfo.status : [];
  const freshSet = new Set(freshArr.map((s: string) => normalizeStr(s)));

  // 2) Add any new statuses not in DB
  for (const status of freshSet) {
    if (!dbSet.has(status as FuckIt) && status !== '') {
      await recordDomainUpdate(
        pgExec,
        domainRow.id,
        `Status added: ${status}`,
        'status',
        '',
        status as FuckIt
      );
      // Insert into domain_statuses
      await callPgExecutor(pgExec,
        `INSERT INTO domain_statuses (domain_id, status_code) VALUES ($1::uuid, $2::text)`,
        [domainRow.id, status]
      );
      changes.push(`Status+:${status}`);
    }
  }

  // 3) Remove any old statuses not in fresh data
  for (const dbStatus of dbSet) {
    if (!freshSet.has(dbStatus)) {
      await recordDomainUpdate(
        pgExec,
        domainRow.id,
        `Status removed: ${dbStatus}`,
        'status',
        dbStatus,
        ''
      );
      // Delete from domain_statuses
      await callPgExecutor(pgExec,
        `DELETE FROM domain_statuses WHERE domain_id = $1::uuid AND status_code ILIKE $2`,
        [domainRow.id, dbStatus]
      );
      changes.push(`Status-:${dbStatus}`);
    }
  }
}

async function updateWhois(
  pgExec: string,
  domainRow: any,
  freshInfo: any,
  changes: string[]
) {
  // We assume there's exactly 1 whois_info row per domain. We’ll fetch it:
  type WhoisRow = {
    id: string;
    country: string;
    state: string;
    name: string;
    organization: string;
    street: string;
    city: string;
    postal_code: string;
  };
  const [whoisRow] = await callPgExecutor<WhoisRow>(
    pgExec,
    `SELECT id, country, state, name, organization, street, city, postal_code
     FROM whois_info
     WHERE domain_id = $1::uuid`,
    [domainRow.id]
  );

  if (!whoisRow) {
    // Possibly create one if needed
    // For brevity, we do so only if there's fresh data
    if (freshInfo.whois) {
      await callPgExecutor(pgExec,
        `INSERT INTO whois_info (domain_id, country, state, name, organization, street, city, postal_code)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          domainRow.id,
          freshInfo.whois.country || null,
          freshInfo.whois.state || null,
          freshInfo.whois.name || null,
          freshInfo.whois.organization || null,
          freshInfo.whois.street || null,
          freshInfo.whois.city || null,
          freshInfo.whois.postal_code || null
        ]
      );
      changes.push(`WHOIS created`);
      await recordDomainUpdate(
        pgExec,
        domainRow.id,
        'WHOIS record created',
        'whois_',
        '',
        JSON.stringify(freshInfo.whois)
      );
    }
    return;
  }

  // Compare each relevant field
  interface FieldMap {
    label: string;
    dbValue: string;
    freshValue: string;
    changeType: string;
  }
  const fieldsToCheck: FieldMap[] = [
    {
      label: 'WHOIS Name',
      dbValue: whoisRow.name || '',
      freshValue: freshInfo.whois?.name || '',
      changeType: 'whois_name',
    },
    {
      label: 'WHOIS Org',
      dbValue: whoisRow.organization || '',
      freshValue: freshInfo.whois?.organization || '',
      changeType: 'whois_organization',
    },
    {
      label: 'WHOIS Country',
      dbValue: whoisRow.country || '',
      freshValue: freshInfo.whois?.country || '',
      changeType: 'whois_country',
    },
    {
      label: 'WHOIS State',
      dbValue: whoisRow.state || '',
      freshValue: freshInfo.whois?.state || '',
      changeType: 'whois_state',
    },
    {
      label: 'WHOIS Street',
      dbValue: whoisRow.street || '',
      freshValue: freshInfo.whois?.street || '',
      changeType: 'whois_street',
    },
    {
      label: 'WHOIS City',
      dbValue: whoisRow.city || '',
      freshValue: freshInfo.whois?.city || '',
      changeType: 'whois_city',
    },
    {
      label: 'WHOIS Postal Code',
      dbValue: whoisRow.postal_code || '',
      freshValue: freshInfo.whois?.postal_code || '',
      changeType: 'whois_postal_code',
    },
  ];

  let updateNeeded = false;
  const updateSet: string[] = [];
  const updateParams: any[] = [];
  for (const field of fieldsToCheck) {
    const oldVal = normalizeStr(field.dbValue);
    const newVal = normalizeStr(field.freshValue);
    if (oldVal !== newVal) {
      // Record domain update
      await recordDomainUpdate(
        pgExec,
        domainRow.id,
        `${field.label} changed`,
        field.changeType,
        field.dbValue,
        field.freshValue
      );
      changes.push(field.label);

      updateNeeded = true;
      updateSet.push(`${field.changeType.replace('whois_', '')} = $${updateSet.length + 2}`); 
      // We'll replace "whois_country" → "country" etc. in the actual column name
      updateParams.push(field.freshValue || null);
    }
  }

  if (updateNeeded) {
    // Build dynamic update statement
    const finalQuery = `
      UPDATE whois_info
      SET ${updateSet
        .map((fragment, idx) => {
          // e.g. "country = $2, state = $3, ..."
          return fragment;
        })
        .join(', ') }
      WHERE id = $1::uuid
    `;
    await callPgExecutor(pgExec, finalQuery, [whoisRow.id, ...updateParams]);
  }
}
/**
 * Helper to strip time and return only YYYY-MM-DD.
 * If invalid date, returns ''.
 */
function toDateOnly(val: string | number | null | undefined): string {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return '';
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // e.g. "2025-06-10"
}

/**
 * Update or create the SSL certificate row for a domain, ignoring minor time offsets 
 * by storing only the date in valid_from / valid_to columns.
 */
async function updateSSL(
  pgExec: string,
  domainRow: any,
  freshInfo: any,
  changes: string[]
) {
  // 1. Fetch the current ssl_certificates row for this domain (if any).
  //    We cast domain_id to ::uuid to avoid "could not determine data type" errors.
  type SSLRow = {
    id: string;
    issuer: string | null;
    issuer_country: string | null;
    subject: string | null;
    valid_from: string | null;     // stored as DATE in DB
    valid_to: string | null;       // stored as DATE in DB
    fingerprint: string | null;
    key_size: number | null;
    signature_algorithm: string | null;
  };

  const [sslRow] = await callPgExecutor<SSLRow>(
    pgExec,
    `
    SELECT id,
           issuer,
           issuer_country,
           subject,
           valid_from,
           valid_to,
           fingerprint,
           key_size,
           signature_algorithm
      FROM ssl_certificates
     WHERE domain_id = $1::uuid
     ORDER BY created_at DESC
     LIMIT 1
    `,
    [domainRow.id]
  );

  // 2. If there's no fresh SSL info at all, do nothing
  if (!freshInfo.ssl) {
    return;
  }

  // 3. If no existing row, create one
  if (!sslRow) {
    await callPgExecutor(pgExec,
      `
      INSERT INTO ssl_certificates
        (domain_id,
         issuer,
         issuer_country,
         subject,
         valid_from,
         valid_to,
         fingerprint,
         key_size,
         signature_algorithm)
      VALUES
        ($1::uuid,
         $2::text,
         $3::text,
         $4::text,
         $5::date,
         $6::date,
         $7::text,
         $8::int,
         $9::text)
      `,
      [
        domainRow.id,
        freshInfo.ssl.issuer || null,
        freshInfo.ssl.issuer_country || null,
        freshInfo.ssl.subject || null,
        toDateOnly(freshInfo.ssl.valid_from),  // store just the date
        toDateOnly(freshInfo.ssl.valid_to),    // store just the date
        freshInfo.ssl.fingerprint || null,
        freshInfo.ssl.key_size || null,
        freshInfo.ssl.signature_algorithm || null,
      ]
    );

    changes.push('SSL created');
    await recordDomainUpdate(
      pgExec,
      domainRow.id,
      'SSL record created',
      'ssl_change',            // or 'expiry_ssl' if you prefer
      '',
      JSON.stringify(freshInfo.ssl)
    );
    return;
  }

  // 4. Compare each field in the existing row vs fresh data
  interface SSLFieldMap {
    label: string;         // human label: "SSL Issuer"
    dbValue: string|null|number;    // existing DB value
    freshValue: string|null|number; // new data
    dbCol: string;         // column in the DB
    changeType: string;    // domain_updates.change_type
    isDate?: boolean;      // if we should store as date
  }

  const fields: SSLFieldMap[] = [
    {
      label: 'SSL Issuer',
      dbValue: sslRow.issuer,
      freshValue: freshInfo.ssl.issuer,
      dbCol: 'issuer',
      changeType: 'ssl_issuer',
    },
    {
      label: 'SSL Issuer Country',
      dbValue: sslRow.issuer_country,
      freshValue: freshInfo.ssl.issuer_country,
      dbCol: 'issuer_country',
      changeType: 'ssl_issuer_country',
    },
    {
      label: 'SSL Subject',
      dbValue: sslRow.subject,
      freshValue: freshInfo.ssl.subject,
      dbCol: 'subject',
      changeType: 'ssl_subject',
    },
    {
      label: 'SSL Valid From',
      dbValue: sslRow.valid_from,
      freshValue: freshInfo.ssl.valid_from,
      dbCol: 'valid_from',
      changeType: 'ssl_valid_from',
      isDate: true,
    },
    {
      label: 'SSL Valid To',
      dbValue: sslRow.valid_to,
      freshValue: freshInfo.ssl.valid_to,
      dbCol: 'valid_to',
      changeType: 'ssl_valid_to',
      isDate: true,
    },
    {
      label: 'SSL Fingerprint',
      dbValue: sslRow.fingerprint,
      freshValue: freshInfo.ssl.fingerprint,
      dbCol: 'fingerprint',
      changeType: 'ssl_fingerprint',
    },
    {
      label: 'SSL Key Size',
      dbValue: sslRow.key_size,
      freshValue: freshInfo.ssl.key_size,
      dbCol: 'key_size',
      changeType: 'ssl_key_size',
    },
    {
      label: 'SSL Signature Algorithm',
      dbValue: sslRow.signature_algorithm,
      freshValue: freshInfo.ssl.signature_algorithm,
      dbCol: 'signature_algorithm',
      changeType: 'ssl_signature_algorithm',
    },
  ];

  let updateNeeded = false;
  const updateSet: string[] = [];
  const updateParams: any[] = [];

  for (const field of fields) {
    // Convert to strings for easy comparison
    let oldValStr = (field.dbValue ?? '').toString().trim(); 
    let newValStr = (field.freshValue ?? '').toString().trim();

    // If date, we store only day in DB. Compare as "YYYY-MM-DD"
    if (field.isDate) {
      oldValStr = toDateOnly(oldValStr); 
      newValStr = toDateOnly(newValStr);
    } else {
      // Normal string or numeric fields – for consistent comparison, 
      // you might do case-insensitive if you prefer:
      oldValStr = oldValStr.toLowerCase();
      newValStr = newValStr.toLowerCase();
    }

    // If different, record a domain update & add to the update statement
    if (oldValStr.substring(0, 8) !== newValStr.substring(0, 8)) {
      await recordDomainUpdate(
        pgExec,
        domainRow.id,
        `${field.label} changed`,
        field.changeType,
        (field.dbValue ?? '').toString(),
        (field.freshValue ?? '').toString()
      );
      changes.push(field.label);

      updateNeeded = true;
      
      // If it's date, cast param to '::date'
      if (field.isDate) {
        updateSet.push(`${field.dbCol} = $${updateSet.length + 2}::date`);
        updateParams.push(toDateOnly(field.freshValue));
      } else if (typeof field.dbValue === 'number') {
        // if the column is actually integer, we could do `::int`
        updateSet.push(`${field.dbCol} = $${updateSet.length + 2}::int`);
        updateParams.push(field.freshValue ?? null);
      } else {
        // text
        updateSet.push(`${field.dbCol} = $${updateSet.length + 2}::text`);
        updateParams.push(field.freshValue ?? null);
      }
    }
  }

  // 5. If we have any changed fields, do the update
  if (updateNeeded) {
    const updateQuery = `
      UPDATE ssl_certificates
      SET ${updateSet.join(', ')}
      WHERE id = $1::uuid
    `;
    await callPgExecutor(pgExec, updateQuery, [sslRow.id, ...updateParams]);
  }
}


async function updateDNS(
  pgExec: string,
  domainRow: any,
  freshInfo: any,
  changes: string[]
) {
  // "DNS" in fresh info has multiple subfields: dnssec, nameServers, mxRecords, txtRecords, etc.
  // In DB, we have a generic "dns_records" table (record_type, record_value).
  // We'll treat each record type as a set. For example, record_type = 'NS', record_value = 'ns1.google.com'.
  // We'll also handle "dnssec" as a special record_type maybe.

  // 1) Query existing records
  type DNSRecord = { id: string; record_type: string; record_value: string };
  const existing = await callPgExecutor<DNSRecord>(
    pgExec,
    `SELECT id, record_type, record_value FROM dns_records WHERE domain_id = $1`,
    [domainRow.id]
  );

  // 2) Build a list of fresh DNS records from the domainInfo
  //    We'll flatten: nameServers → type=NS, mxRecords → type=MX, txtRecords → type=TXT, dnssec → type=DNSSEC, ...
  const freshRecords: { type: string; value: string }[] = [];

  // DNSSEC
  if (freshInfo.dns?.dnssec) {
    freshRecords.push({ type: 'DNSSEC', value: freshInfo.dns.dnssec });
  }
  // NS
  if (Array.isArray(freshInfo.dns?.nameServers)) {
    for (const ns of freshInfo.dns.nameServers) {
      freshRecords.push({ type: 'NS', value: ns });
    }
  }
  // MX
  if (Array.isArray(freshInfo.dns?.mxRecords)) {
    for (const mx of freshInfo.dns.mxRecords) {
      freshRecords.push({ type: 'MX', value: mx });
    }
  }
  // TXT
  if (Array.isArray(freshInfo.dns?.txtRecords)) {
    for (const txt of freshInfo.dns.txtRecords) {
      freshRecords.push({ type: 'TXT', value: txt });
    }
  }

  const existingSet = new Set(
    existing.map((r) => `${r.record_type.toUpperCase()}|${normalizeStr(r.record_value)}`)
  );
  const freshSet = new Set(
    freshRecords.map((r) => `${r.type.toUpperCase()}|${normalizeStr(r.value)}`)
  );

  // 3) Insert new records
  for (const fr of freshRecords) {
    const key = `${fr.type.toUpperCase()}|${normalizeStr(fr.value)}`;
    if (!existingSet.has(key) && normalizeStr(fr.value) !== '') {
      await recordDomainUpdate(pgExec, domainRow.id, `DNS record added (${fr.type})`, 'dns_', '', fr.value);
      await callPgExecutor(pgExec,
        `INSERT INTO dns_records (domain_id, record_type, record_value)
         VALUES ($1, $2, $3)`,
        [domainRow.id, fr.type, fr.value]
      );
      changes.push(`DNS+ ${fr.type}:${fr.value}`);
    }
  }

  // 4) Remove old records
  for (const ex of existing) {
    const key = `${ex.record_type.toUpperCase()}|${normalizeStr(ex.record_value)}`;
    if (!freshSet.has(key)) {
      await recordDomainUpdate(pgExec, domainRow.id, `DNS record removed (${ex.record_type})`, 'dns_', ex.record_value, '');
      await callPgExecutor(pgExec,
        `DELETE FROM dns_records WHERE id = $1`,
        [ex.id]
      );
      changes.push(`DNS- ${ex.record_type}:${ex.record_value}`);
    }
  }
}

/**
 *  8. The main function to compare existing domain data with fresh domain info.
 */
async function compareAndUpdateDomain(
  pgExec: string,
  domainRow: any,
  freshInfo: any
): Promise<{ domain: string; changes: string[] }> {
  const domainName = domainRow.domain_name;
  const changes: string[] = [];

  // We run each update step in its own try/catch so one failure doesn’t kill the entire domain
  try { await updateExpiryDate(pgExec, domainRow, freshInfo, changes); } catch (err: any) {
    changes.push(`(Error updating expiry: ${err.message})`);
  }

  try { await updateRegistrar(pgExec, domainRow, freshInfo, changes); } catch (err: any) {
    changes.push(`(Error updating registrar: ${err.message})`);
  }

  try { await updateDomainStatuses(pgExec, domainRow, freshInfo, changes); } catch (err: any) {
    changes.push(`(Error updating statuses: ${err.message})`);
  }

  try { await updateWhois(pgExec, domainRow, freshInfo, changes); } catch (err: any) {
    changes.push(`(Error updating WHOIS: ${err.message})`);
  }

  try { await updateSSL(pgExec, domainRow, freshInfo, changes); } catch (err: any) {
    changes.push(`(Error updating SSL: ${err.message})`);
  }

  try { await updateDNS(pgExec, domainRow, freshInfo, changes); } catch (err: any) {
    changes.push(`(Error updating DNS: ${err.message})`);
  }

  // ... Add more as needed: IP addresses, hosts, etc.

  return { domain: domainName, changes };
}

/**
 *  9. Our main endpoint definition.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const lang = query['lang'] || 'en';

  if (getEnvVar('DL_ENV_TYPE') !== 'selfHosted') {
    return { error: 'This endpoint is only available in self-hosted environments.' };
  }

  try {
    // Env vars
    const baseUrl = getEnvVar('BASE_URL', '') || getEnvVar('DL_BASE_URL', 'http://localhost:3000');
    const domainInfoEndpoint = `${baseUrl}/api/domain-info`;
    const pgExecutorEndpoint = `${baseUrl}/api/pg-executer`;

    // 1) Fetch all domains from DB
    const domainsQuery = `
      SELECT 
        d.id, 
        d.domain_name,
        d.expiry_date,
        jsonb_build_object('name', r.name, 'url', r.url) as registrar
      FROM domains d
      LEFT JOIN registrars r ON d.registrar_id = r.id
      ORDER BY d.domain_name ASC
    `;
    const domainRows = await callPgExecutor(pgExecutorEndpoint, domainsQuery);

    if (!domainRows.length) {
      return { message: 'No domains found, nothing to update.' };
    }

    // 2) Process each domain
    const results: Array<{ domain: string; changes?: string[]; error?: string }> = [];

    for (const domainRow of domainRows) {
      try {
        const fresh = await fetchDomainInfo(domainInfoEndpoint, (domainRow as FuckIt).domain_name);
        const { domain, changes } = await compareAndUpdateDomain(pgExecutorEndpoint, domainRow, fresh);

        if (changes.length > 0) {
          results.push({ domain, changes: [`✅ ${domain} updated: ${changes.join(', ')}`] });
        } else {
          results.push({ domain, changes: [] }); // No changes
        }
      } catch (err: any) {
        // Don’t kill the entire loop if one domain fails
        results.push({ domain: (domainRow as FuckIt).domain_name, error: err.message });
      }
    }

    // 3) Return a summary
    return {
      results,
      note: '📝 Domain updates complete!',
      langUsed: lang,
    };

  } catch (err: any) {
    // Top-level error
    return { error: err.message };
  }
});
