#!/usr/bin/env node
// Minimal token mint CLI (ESM). For demo purposes; use secure key handling in production.
// Usage:
//   node src/cli.mjs mint --priv <jwk.json> --aud example.com --ver 1 --ttl 86400 --instance <uuid> --iss you

import fs from "node:fs";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k.startsWith("--")) {
      args[k.slice(2)] = v;
      i++;
    }
  }
  return args;
}

function b64u(bytes) {
  const b64 = Buffer.from(bytes).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toDerSig(raw) {
  // WebCrypto P-256 returns ASN.1 DER already in Node; keep as-is
  return new Uint8Array(raw);
}

async function importP256PrivateKeyJwk(jwk) {
  if (typeof jwk === "string") jwk = JSON.parse(jwk);
  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
}

async function main() {
  const a = parseArgs(process.argv);
  if (a._ === "mint" || a.mint || true) {
    const privPath = a.priv;
    if (!privPath) {
      console.error("Missing --priv <jwk.json>");
      process.exit(1);
    }
    const jwk = JSON.parse(fs.readFileSync(privPath, "utf8"));
    const aud = a.aud || "localhost";
    const iss = a.iss || "owner";
    const ver = Number(a.ver || "1");
    const ttl = Number(a.ttl || "86400"); // seconds
    const instanceId = a.instance || undefined;
    const now = Date.now();
    const exp = now + ttl * 1000;
    const jti = crypto.randomUUID();
    const payload = { iss, aud, ver, iat: now, exp, jti, instanceId };
    const payloadB64u = b64u(Buffer.from(JSON.stringify(payload)));
    const data = new TextEncoder().encode(payloadB64u);
    const key = await importP256PrivateKeyJwk(jwk);
    const sig = await crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      key,
      data
    );
    const token = payloadB64u + "." + b64u(toDerSig(sig));
    console.log(token);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
