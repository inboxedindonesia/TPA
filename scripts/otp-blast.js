#!/usr/bin/env node
/*
  OTP Blast Test Script

  What it does:
  - Generates a batch of test registrations (unique emails) or uses a provided list
  - Calls /api/auth/register to trigger OTP email sends concurrently with a limit
  - Collects per-request metrics, success/failure, and summary stats

  Safety:
  - Requires OTP_BLAST_ENABLE=true env to run
  - Will refuse to run if BASE_URL is production-like and OTP_BLAST_ALLOW_PROD is not true

  Usage examples:
  - node scripts/otp-blast.js --base http://localhost:3000 --count 50 --concurrency 5
  - node scripts/otp-blast.js --base https://staging.example.com --emails emails.txt --concurrency 10
  - npm run otp:blast -- --base http://localhost:3000 --count 20

  Options:
  --base URL            Base URL of the running app (defaults to process.env.NEXT_PUBLIC_BASE_URL)
  --count N             How many registrations to create (ignored if --emails supplied)
  --concurrency N       Max concurrent requests (default 5)
  --emails PATH         Path to a file with one email per line
  --password PASS       Password to use for all accounts (default "Test1234!")
  --name-prefix STR     Prefix for generated names (default "Test User")
  --domain STR          Domain for generated emails (default "example.test")
  --mode register|resend|smtp  Mode:
                        - register (default): call /api/auth/register
                        - resend: call /api/auth/resend-otp (emails must exist)
                        - smtp: call /api/test-smtp (send test email), emails required or generated
  --timeout MS          Per-request timeout in ms (default 20000)
*/

const fs = require('fs');
const path = require('path');
const { URL } = require('url');

if (typeof fetch === 'undefined') {
  console.error('This script requires Node.js 18+ (global fetch).');
  process.exit(1);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

function isProbablyProd(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host.includes('vercel.app') || host.includes('prod') || host.includes('production') || host.endsWith('.com');
  } catch { return false; }
}

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 20000 } = options;
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(resource, { ...options, signal: ctrl.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

function readEmailList(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
}

function generateEmails(count, domain = 'example.test') {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => `otpblast+${now}-${i}@${domain}`);
}

function formatMs(ms) { return `${ms.toFixed(0)} ms`; }

async function run() {
  const args = parseArgs(process.argv);
  const ENABLE = process.env.OTP_BLAST_ENABLE === 'true';
  if (!ENABLE) {
    console.error('Refusing to run: set OTP_BLAST_ENABLE=true to enable this script.');
    process.exit(1);
  }

  const base = args.base || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const mode = (args.mode || 'register').toLowerCase();
  const concurrency = Math.max(1, parseInt(args.concurrency || '5', 10));
  const timeout = Math.max(1000, parseInt(args.timeout || '20000', 10));

  if (isProbablyProd(base) && process.env.OTP_BLAST_ALLOW_PROD !== 'true') {
    console.error(`Base looks like production (${base}). Set OTP_BLAST_ALLOW_PROD=true to proceed.`);
    process.exit(1);
  }

  let emails = [];
  if (args.emails) {
    const p = path.resolve(process.cwd(), args.emails);
    if (!fs.existsSync(p)) {
      console.error(`Emails file not found: ${p}`);
      process.exit(1);
    }
    emails = readEmailList(p);
  } else {
    const count = Math.max(1, parseInt(args.count || '10', 10));
    emails = generateEmails(count, args.domain || 'example.test');
  }

  const password = args.password || 'Test1234!';
  const namePrefix = args['name-prefix'] || 'Test User';

  console.log(`Starting OTP blast in mode=${mode} to ${base}`);
  console.log(`Requests: ${emails.length}, concurrency: ${concurrency}, timeout: ${timeout} ms`);
  if (mode === 'resend') {
    console.log('Note: resend mode expects emails of EXISTING users; non-existent emails will return 404.');
  }

  const startAll = Date.now();
  let inFlight = 0;
  let idx = 0;
  const results = [];

  async function worker() {
    while (true) {
      const myIndex = idx++;
      if (myIndex >= emails.length) return;
      const email = emails[myIndex];
      const started = Date.now();
      inFlight++;
      try {
        let res, json;
        if (mode === 'smtp') {
          // Use /api/test-smtp to send a single test email (expects { testEmail })
          res = await fetchWithTimeout(`${base}/api/test-smtp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testEmail: email }),
            timeout,
          });
          json = await res.json().catch(() => ({}));
        } else if (mode === 'resend') {
          // Call /api/auth/resend-otp for existing users
          res = await fetchWithTimeout(`${base}/api/auth/resend-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
            timeout,
          });
          json = await res.json().catch(() => ({}));
        } else {
          // Default: register mode
          res = await fetchWithTimeout(`${base}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `${namePrefix} ${myIndex + 1}`,
              email,
              password,
            }),
            timeout,
          });
          json = await res.json().catch(() => ({}));
        }
        const dur = Date.now() - started;
        if (!res.ok) {
          results.push({ email, ok: false, status: res.status, dur, error: json?.error || json?.message || res.statusText });
        } else {
          results.push({ email, ok: true, status: res.status, dur, data: json });
        }
      } catch (e) {
        const dur = Date.now() - started;
        results.push({ email, ok: false, status: 0, dur, error: String(e?.message || e) });
      } finally {
        inFlight--;
        // tiny stagger to avoid bursty spikes
        await sleep(10);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  const totalDur = Date.now() - startAll;

  // Summaries
  const successes = results.filter(r => r.ok);
  const failures = results.filter(r => !r.ok);
  const latencies = results.map(r => r.dur).sort((a, b) => a - b);
  const p50 = latencies[Math.floor(0.5 * (latencies.length - 1))] || 0;
  const p95 = latencies[Math.floor(0.95 * (latencies.length - 1))] || 0;
  const p99 = latencies[Math.floor(0.99 * (latencies.length - 1))] || 0;

  console.log('\n=== Results ===');
  console.log(`Total: ${results.length}, Success: ${successes.length}, Fail: ${failures.length}`);
  console.log(`Duration: ${formatMs(totalDur)}, Avg: ${formatMs(totalDur / Math.max(1, results.length))}`);
  console.log(`Latency p50: ${formatMs(p50)}, p95: ${formatMs(p95)}, p99: ${formatMs(p99)}`);

  const byStatus = {};
  for (const r of results) {
    const key = String(r.status);
    byStatus[key] = (byStatus[key] || 0) + 1;
  }
  console.log('By HTTP status:', byStatus);

  // Write detailed report
  const outDir = path.resolve(process.cwd(), 'scripts', 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `otp-blast-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ base, mode, concurrency, timeout, results }, null, 2));
  console.log(`Detailed report saved to ${outPath}`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
