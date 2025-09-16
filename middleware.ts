import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Hanya enforce license jika on-prem mode diaktifkan
  if (process.env.NEXT_PUBLIC_IS_ONPREM === "true") {
    const licenseValid = req.cookies.get("license_valid")?.value;
    const licenseExpired = req.cookies.get("license_expired")?.value;
    const { origin } = req.nextUrl;
    const uploadLicenseUrl = origin + "/upload-license";
    // Jika cookie belum ada, coba baca license.json dari server dan set cookie otomatis bila valid
    if (licenseValid !== "true") {
      try {
        const resp = await fetch(origin + "/api/admin/license", {
          method: "GET",
          headers: { "cache-control": "no-cache" },
        });
        if (resp.ok) {
          const data = (await resp.json()) as {
            isValid?: boolean;
            expiredAt?: number | null;
          };
          if (data?.isValid && typeof data.expiredAt === "number") {
            const expired = data.expiredAt;
            const bufferEnd = expired + 14 * 24 * 60 * 60 * 1000;
            if (Date.now() <= bufferEnd) {
              const res = NextResponse.next();
              res.cookies.set("license_valid", "true", {
                path: "/",
                httpOnly: false,
              });
              res.cookies.set("license_expired", String(expired), {
                path: "/",
                httpOnly: false,
              });
              return res;
            }
          }
        }
      } catch (_) {
        // ignore and fallthrough to redirect
      }
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
