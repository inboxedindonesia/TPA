// Reusable owner-lock verification utilities (ES256 over custom compact token)
// Token format (compact, not JWT): base64url(JSON payload).base64url(derSignature)
// Payload fields: iss, aud (string|array), scope, iat (ms), exp (ms), ver (int), jti, instanceId

export type OwnerClaims = {
  iss: string;
  aud: string | string[];
  scope?: string;
  iat: number; // epoch ms
  exp: number; // epoch ms
  ver: number; // should equal REVOCATION_VERSION
  jti: string; // random id
  instanceId?: string;
};

export function base64urlDecode(input: string): Uint8Array {
  const pad = input.length % 4;
  const base64 =
    input.replace(/-/g, "+").replace(/_/g, "/") + (pad ? "===".slice(pad) : "");
  const bin =
    typeof atob === "function"
      ? atob(base64)
      : Buffer.from(base64, "base64").toString("binary");
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export function base64urlEncode(buf: Uint8Array): string {
  const bin =
    typeof btoa === "function"
      ? String.fromCharCode(...buf)
      : Buffer.from(buf).toString("binary");
  const b64 =
    typeof btoa === "function"
      ? btoa(bin)
      : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function parseOwnerToken(token: string): {
  payload: OwnerClaims;
  sigDer: Uint8Array;
  signingInput: Uint8Array;
} {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [payloadB64u, sigB64u] = parts;
  const payloadJson = new TextDecoder().decode(base64urlDecode(payloadB64u));
  const payload = JSON.parse(payloadJson) as OwnerClaims;
  const sigDer = base64urlDecode(sigB64u);
  const signingInput = new TextEncoder().encode(payloadB64u);
  return { payload, sigDer, signingInput };
}

export async function importP256PublicKeyJwk(
  jwkJson: string | object
): Promise<CryptoKey> {
  const jwk =
    typeof jwkJson === "string"
      ? (JSON.parse(jwkJson) as JsonWebKey)
      : (jwkJson as JsonWebKey);
  // Expect: { kty: 'EC', crv: 'P-256', x, y }
  const subtle = getSubtle();
  return await subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
}

export async function verifyEs256(
  publicKey: CryptoKey,
  data: Uint8Array,
  signatureDer: Uint8Array
): Promise<boolean> {
  const subtle = getSubtle();
  // Ensure BufferSource types for TS
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
    sigView as unknown as BufferSource,
    dataView as unknown as BufferSource
  );
}

export type VerifyOptions = {
  aud?: string; // expected audience/host
  nowMs?: number;
  maxSkewMs?: number; // default 5 min
  requiredVersion?: number; // REVOCATION_VERSION
  instanceId?: string;
};

export function validateOwnerClaims(
  payload: OwnerClaims,
  opts: VerifyOptions = {}
): void {
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

export async function verifyOwnerToken(
  token: string,
  jwkPublic: string | object,
  opts: VerifyOptions = {}
): Promise<OwnerClaims> {
  const { payload, sigDer, signingInput } = parseOwnerToken(token);
  const key = await importP256PublicKeyJwk(jwkPublic);
  const ok = await verifyEs256(key, signingInput, sigDer);
  if (!ok) throw new Error("Invalid signature");
  validateOwnerClaims(payload, opts);
  return payload;
}

export function getCookie(
  req: { cookies: any },
  name: string
): string | undefined {
  try {
    const v = req.cookies.get?.(name)?.value ?? req.cookies[name];
    return typeof v === "string" ? v : undefined;
  } catch {
    return undefined;
  }
}

export function getSubtle(): SubtleCrypto {
  const anyGlobal: any = globalThis as any;
  if (anyGlobal?.crypto?.subtle) return anyGlobal.crypto.subtle as SubtleCrypto;
  throw new Error("WebCrypto SubtleCrypto not available");
}

function matchWildcard(pattern: string, value: string): boolean {
  // simple "*.example.com" pattern support
  if (!pattern.includes("*")) return pattern === value;
  const re = new RegExp(
    "^" + pattern.split("*").map(escapeRegex).join(".*") + "$"
  );
  return re.test(value);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
