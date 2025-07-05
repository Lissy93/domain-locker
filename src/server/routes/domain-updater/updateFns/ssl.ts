import { callPgExecutor } from '../lib/pgExecutor';
import { normalizeStr, toDateOnly } from '../lib/utils';
import { recordDomainUpdate } from '../lib/recordUpdate';

export async function updateSSL(
  pgExec: string,
  domainRow: any,
  freshInfo: any,
  changes: string[]
): Promise<void> {
  const domainId = domainRow.id;
  const fresh = freshInfo?.ssl;
  if (!fresh) return;

  const [existing] = await callPgExecutor<any>(
    pgExec,
    `SELECT * FROM ssl_certificates WHERE domain_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [domainId]
  );

  const fields = [
    { label: 'Issuer', column: 'issuer', type: 'text', old: existing?.issuer ?? '', new: fresh.issuer ?? '', changeType: 'ssl_issuer' },
    { label: 'Issuer Country', column: 'issuer_country', type: 'text', old: existing?.issuer_country ?? '', new: fresh.issuer_country ?? '', changeType: 'ssl_issuer_country' },
    { label: 'Subject', column: 'subject', type: 'text', old: existing?.subject ?? '', new: fresh.subject ?? '', changeType: 'ssl_subject' },
    { label: 'Valid From', column: 'valid_from', type: 'date', old: existing?.valid_from ?? '', new: toDateOnly(fresh.valid_from), changeType: 'ssl_valid_from' },
    { label: 'Valid To', column: 'valid_to', type: 'date', old: existing?.valid_to ?? '', new: toDateOnly(fresh.valid_to), changeType: 'ssl_valid_to' },
    { label: 'Fingerprint', column: 'fingerprint', type: 'text', old: existing?.fingerprint ?? '', new: fresh.fingerprint ?? '', changeType: 'ssl_fingerprint' },
    { label: 'Key Size', column: 'key_size', type: 'int', old: existing?.key_size ?? '', new: fresh.key_size ?? '', changeType: 'ssl_key_size' },
    { label: 'Signature Algorithm', column: 'signature_algorithm', type: 'text', old: existing?.signature_algorithm ?? '', new: fresh.signature_algorithm ?? '', changeType: 'ssl_signature_algorithm' },
  ];

  // No previous SSL? Insert new row
  if (!existing) {
    await callPgExecutor(pgExec,
      `INSERT INTO ssl_certificates (
         domain_id, issuer, issuer_country, subject,
         valid_from, valid_to, fingerprint,
         key_size, signature_algorithm
       ) VALUES (
         $1, $2, $3, $4,
         $5::date, $6::date, $7,
         $8::int, $9
       )`,
      [
        domainId,
        fresh.issuer || null,
        fresh.issuer_country || null,
        fresh.subject || null,
        toDateOnly(fresh.valid_from) || null,
        toDateOnly(fresh.valid_to) || null,
        fresh.fingerprint || null,
        fresh.key_size || null,
        fresh.signature_algorithm || null,
      ]
    );

    await recordDomainUpdate(pgExec, domainId, 'SSL certificate added', 'ssl_created', '', JSON.stringify(fresh));
    changes.push('SSL created');
    return;
  }

  // Compare each field
  const updateSet: string[] = [];
  const updateValues: any[] = [];

  for (const field of fields) {
    let oldVal = String(field.old ?? '');
    let newVal = String(field.new ?? '');
    if (field.type === 'date') {
      oldVal = toDateOnly(oldVal);
      newVal = toDateOnly(newVal);
    } else {
      oldVal = normalizeStr(oldVal);
      newVal = normalizeStr(newVal);
    }

    
    // Special date comparison, because timezones are stupid
    if (field.type === 'date') {
      const oldDate = new Date(oldVal);
      const newDate = new Date(newVal);

      const diffInMs = Math.abs(newDate.getTime() - oldDate.getTime());
      const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

      if (isNaN(diffInDays) || diffInDays > 1) {
        updateSet.push(`${field.column} = $${updateSet.length + 2}::date`);
        updateValues.push(toDateOnly(newVal));
        await recordDomainUpdate(pgExec, domainId, `SSL ${field.label} changed`, field.changeType, toDateOnly(oldVal), toDateOnly(newVal));
        changes.push(`SSL ${field.label}`);
      }
    }
    
    if (oldVal !== newVal && field.type != 'date') {
      updateSet.push(`${field.column} = $${updateSet.length + 2}::${field.type}`);
      updateValues.push(field.new ?? null);

      await recordDomainUpdate(pgExec, domainId, `SSL ${field.label} changed`, field.changeType, String(field.old), String(field.new));
      changes.push(`SSL ${field.label}`);
    }
  }

  if (updateSet.length > 0) {
    await callPgExecutor(pgExec,
      `UPDATE ssl_certificates SET ${updateSet.join(', ')} WHERE id = $1`,
      [existing.id, ...updateValues]
    );
  }
}
