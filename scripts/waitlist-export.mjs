#!/usr/bin/env node
// Waitlist reporting for igasm.in - read the marketing waitlist the ONLY way it can be read:
// with the service_role key (the table is FORCE-RLS deny-by-default; anon can INSERT but never
// SELECT - see supabase/migrations/20260617000001_waitlist_signup.sql). This is the blessed
// "service_role reads for reporting" path named in that migration.
//
// Usage:
//   node scripts/waitlist-export.mjs            # summary: count + by-source, to stdout
//   node scripts/waitlist-export.mjs --csv      # full CSV (email,source,referrer,created_at) to stdout
//   node scripts/waitlist-export.mjs --csv > waitlist.csv
//   node scripts/waitlist-export.mjs --real     # exclude internal agent-livecheck test rows
//
// The service_role key is read from (first that exists):
//   $SUPABASE_SERVICE_ROLE_KEY  |  ../igasm-creds/service_role_key.txt  |  ~/igasm-creds/service_role_key.txt
// It is SERVER-ONLY and must never ship to the client or be committed.
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_URL = process.env.SUPABASE_URL || 'https://vctuxzonhjzhhmmhjuwv.supabase.co';

function loadKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY.trim();
  const candidates = [
    join(process.cwd(), '..', 'igasm-creds', 'service_role_key.txt'),
    join(homedir(), 'igasm-creds', 'service_role_key.txt'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return readFileSync(p, 'utf8').trim();
  }
  throw new Error(
    'No service_role key found. Set $SUPABASE_SERVICE_ROLE_KEY or place it at ../igasm-creds/service_role_key.txt',
  );
}

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  const wantCsv = process.argv.includes('--csv');
  const realOnly = process.argv.includes('--real');
  const key = loadKey();

  const params = new URLSearchParams({
    select: 'email,source,referrer,created_at',
    order: 'created_at.desc',
  });
  // Drop the internal QA rows (source = agent-livecheck, or the @igasm.in test address) when --real.
  if (realOnly) params.set('source', 'neq.agent-livecheck');

  const res = await fetch(`${PROJECT_URL}/rest/v1/waitlist_signup?${params}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
  });
  if (!res.ok) {
    throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  }
  const rows = await res.json();

  if (wantCsv) {
    process.stdout.write('email,source,referrer,created_at\n');
    for (const r of rows) {
      process.stdout.write(
        [r.email, r.source, r.referrer, r.created_at].map(csvCell).join(',') + '\n',
      );
    }
    return;
  }

  // Human summary.
  const bySource = new Map();
  for (const r of rows) {
    const k = r.source || '(none)';
    bySource.set(k, (bySource.get(k) || 0) + 1);
  }
  console.log(`igasm.in waitlist - ${rows.length} signup(s)${realOnly ? ' (real only)' : ''}\n`);
  if (rows.length === 0) {
    console.log('  (no rows)');
  } else {
    console.log('  by source:');
    for (const [k, n] of [...bySource].sort((a, b) => b[1] - a[1])) {
      console.log(`    ${String(n).padStart(4)}  ${k}`);
    }
    console.log('\n  most recent:');
    for (const r of rows.slice(0, 10)) {
      console.log(`    ${r.created_at}  ${r.email}  [${r.source || '-'}]`);
    }
  }
  console.log('\n  Full CSV:  node scripts/waitlist-export.mjs --csv > waitlist.csv');
}

main().catch((e) => {
  console.error('waitlist-export failed:', e.message);
  process.exit(1);
});
