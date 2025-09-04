# @yourorg/owner-lock (private)

Minimal verifier for self-lockdown activation tokens (ES256, P-256) using WebCrypto.

API

- verifyOwnerToken(token: string, jwkPublic: string|JWK, opts?): Promise<claims>
  - opts: { aud?, requiredVersion?, instanceId?, maxSkewMs?, nowMs? }

Token format

- Compact (JWT-like): base64url(JSON payload).base64url(derSignature)
- Payload claims: { iss, aud, scope?, iat, exp, ver, jti, instanceId? }

Local dev

- This package is referenced via `file:packages/owner-lock`.
- Entry points to `src/index.js` (no build step).

Publishing (GitHub Packages example)

1. Set package name scope to your org, ensure repo is private.
2. Create a personal access token (PAT) with `read:packages` and `write:packages`.
3. Add `.npmrc` in the package or CI with:
   //npm.pkg.github.com/:\_authToken=${NPM_TOKEN}
   @yourorg:registry=https://npm.pkg.github.com
4. Update root `package.json` dependency to a semver version (e.g., ^0.1.0).
5. `npm publish --access restricted` from this folder.

Security notes

- Only public key (JWK P-256) is needed by the app.
- Keep the private key offline to mint activation tokens.
