// Minimal ES module build for verifyOwnerToken (P-256, WebCrypto)
// Token format: base64url(JSON payload).base64url(derSignature)

function b64uToBytes(input) {
  const pad = input.length % 4;
  const b64 =
    input.replace(/-/g, "+").replace(/_/g, "/") + (pad ? "===".slice(pad) : "");
  if (typeof atob === "function") {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } else {
    return Uint8Array.from(Buffer.from(b64, "base64"));
  }
}

function parseToken(token) {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [payloadB64u, sigB64u] = parts;
  const payloadJson = new TextDecoder().decode(b64uToBytes(payloadB64u));
  const payload = JSON.parse(payloadJson);
  const sigDer = b64uToBytes(sigB64u);
  const signingInput = new TextEncoder().encode(payloadB64u);
  return { payload, sigDer, signingInput };
}

function getSubtle() {
  if (globalThis?.crypto?.subtle) return globalThis.crypto.subtle;
  throw new Error("SubtleCrypto not available");
}

async function importP256PublicKeyJwk(jwk) {
  if (typeof jwk === "string") jwk = JSON.parse(jwk);
  return await getSubtle().importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
}

async function verifyEs256(publicKey, data, signatureDer) {
  const subtle = getSubtle();
  const dataView = new Uint8Array(
    data.buffer,
    data.byteOffset,
    data.byteLength
  );
  const sigView = new Uint8Array(
    signatureDer.buffer,
    signatureDer.byteOffset,
    signatureDer.byteLength
  );
  return await subtle.verify(
    { name: "ECDSA", hash: { name: "SHA-256" } },
    publicKey,
    sigView,
    dataView
  );
}

function matchWildcard(pattern, value) {
  if (!pattern.includes("*")) return pattern === value;
  const re = new RegExp(
    "^" +
      pattern
        .split("*")
        .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*") +
      "$"
  );
  return re.test(value);
}

function validateClaims(payload, opts = {}) {
  const now = opts.nowMs ?? Date.now();
  const skew = opts.maxSkewMs ?? 5 * 60 * 1000;
  if (typeof payload.iat !== "number" || typeof payload.exp !== "number")
    throw new Error("Invalid iat/exp");
  if (payload.iat - skew > now) throw new Error("Token not yet valid");
  if (now - skew > payload.exp) throw new Error("Token expired");
  if (opts.requiredVersion != null && payload.ver !== opts.requiredVersion)
    throw new Error("Revoked version");
  if (opts.aud) {
    const audOk = Array.isArray(payload.aud)
      ? payload.aud.includes(opts.aud)
      : payload.aud === opts.aud || matchWildcard(payload.aud, opts.aud);
    if (!audOk) throw new Error("Audience mismatch");
  }
  if (
    opts.instanceId &&
    payload.instanceId &&
    payload.instanceId !== opts.instanceId
  )
    throw new Error("Instance mismatch");
}

export async function verifyOwnerToken(token, jwkPublic, opts = {}) {
  const { payload, sigDer, signingInput } = parseToken(token);
  const key = await importP256PublicKeyJwk(jwkPublic);
  const ok = await verifyEs256(key, signingInput, sigDer);
  if (!ok) throw new Error("Invalid signature");
  validateClaims(payload, opts);
  return payload;
}
