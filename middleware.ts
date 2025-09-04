import { NextRequest, NextResponse } from "next/server";
import { loadOwnerVerifier } from "@/lib/ownerLockClient";

export async function middleware(req: NextRequest) {
  // Owner-lock enforcement (fail-closed) when enabled
  if (process.env.OWNER_LOCK_REQUIRED === "true") {
    const cookieName = process.env.OWNER_COOKIE_NAME || "__ownlock";
    const token = req.cookies.get(cookieName)?.value;
    const pub = process.env.OWNER_PUBLIC_KEY;
    const requiredVer = Number(process.env.REVOCATION_VERSION || "1");
    const maxSkew = Number(process.env.OWNER_MAX_SKEW_MS || "300000");
    const instanceId = process.env.INSTANCE_ID;
    const { origin } = req.nextUrl;
    const activateUrl = origin + "/upload-license"; // reuse upload page as activation UI
    if (!token || !pub) {
      return NextResponse.redirect(activateUrl);
    }
    const host = req.headers.get("host") || undefined;
    try {
      const { verifyOwnerToken } = await loadOwnerVerifier();
      await verifyOwnerToken(token, pub, {
        aud: host,
        requiredVersion: requiredVer,
        maxSkewMs: maxSkew,
        instanceId,
      });
    } catch (e) {
      return NextResponse.redirect(activateUrl);
    }
  }
  // Hanya enforce license jika on-prem mode diaktifkan
  if (process.env.NEXT_PUBLIC_IS_ONPREM === "true") {
    const licenseValid = req.cookies.get("license_valid")?.value;
    const licenseExpired = req.cookies.get("license_expired")?.value;
    const { origin } = req.nextUrl;
    const uploadLicenseUrl = origin + "/upload-license";
    if (licenseValid !== "true") {
      return NextResponse.redirect(uploadLicenseUrl);
    }
    // Buffer 14 hari setelah expired
    if (licenseExpired) {
      const expired = Number(licenseExpired);
      const bufferEnd = expired + 14 * 24 * 60 * 60 * 1000; // 14 hari dalam ms
      if (Date.now() > bufferEnd) {
        return NextResponse.redirect(uploadLicenseUrl);
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!upload-license|_next|api|public).*)"],
};
