// Thin loader that pulls verifyOwnerToken from a private package at runtime.
// This keeps the cryptographic implementation out of this repository.

export type VerifyOptions = {
  aud?: string;
  nowMs?: number;
  maxSkewMs?: number;
  requiredVersion?: number;
  instanceId?: string;
};

export type OwnerClaims = Record<string, any>;

export async function loadOwnerVerifier(): Promise<{
  verifyOwnerToken: (
    token: string,
    jwkPublic: string | object,
    opts?: VerifyOptions
  ) => Promise<OwnerClaims>;
}> {
  const modName =
    process.env.OWNER_LOCK_MODULE || "@nalendramuhammad/owner-lock";
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = await import(modName as string);
    if (typeof mod.verifyOwnerToken !== "function")
      throw new Error("verifyOwnerToken not found in module");
    return { verifyOwnerToken: mod.verifyOwnerToken };
  } catch (e: any) {
    throw new Error(`Owner lock module not available: ${e?.message || e}`);
  }
}
