import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
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
