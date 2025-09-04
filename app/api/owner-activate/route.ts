import { NextRequest, NextResponse } from "next/server";
import { loadOwnerVerifier } from "@/lib/ownerLockClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: string | undefined = body?.activationToken;
    if (!token)
      return NextResponse.json(
        { message: "activationToken required" },
        { status: 400 }
      );

    const pub = process.env.OWNER_PUBLIC_KEY;
    const requiredVer = Number(process.env.REVOCATION_VERSION || "1");
    const cookieName = process.env.OWNER_COOKIE_NAME || "__ownlock";
    const maxSkew = Number(process.env.OWNER_MAX_SKEW_MS || "300000");
    const instanceId = process.env.INSTANCE_ID;

    if (!pub)
      return NextResponse.json(
        { message: "OWNER_PUBLIC_KEY not set" },
        { status: 500 }
      );

    const host = req.headers.get("host") || undefined;
    const { verifyOwnerToken } = await loadOwnerVerifier();
    const claims = await verifyOwnerToken(token, pub, {
      aud: host,
      requiredVersion: requiredVer,
      maxSkewMs: maxSkew,
      instanceId,
    });

    const res = NextResponse.json({
      ok: true,
      claims: {
        iss: claims.iss,
        aud: claims.aud,
        exp: claims.exp,
        ver: claims.ver,
      },
    });
    // Set cookie with the raw token; middleware will verify each request
    // Use Max-Age derived from exp-now (clamped at 24h)
    const now = Date.now();
    const ttlSec = Math.max(
      60,
      Math.min(24 * 60 * 60, Math.floor((claims.exp - now) / 1000))
    );
    res.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: ttlSec,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || "activation failed" },
      { status: 400 }
    );
  }
}
