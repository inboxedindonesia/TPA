import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { LicenseData, isLicenseValid } from "@/lib/license";

export async function POST(req: NextRequest) {
  let licenseKey: string = "";
  try {
    const body = await req.json();
    licenseKey = body.licenseKey;
  } catch {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
  if (!licenseKey) {
    return NextResponse.json(
      { message: "No license key provided" },
      { status: 400 }
    );
  }
  let license: LicenseData;
  try {
    // licenseKey diasumsikan base64 dari JSON
    const json = Buffer.from(licenseKey.trim(), "base64").toString("utf-8");
    license = JSON.parse(json);
  } catch {
    return NextResponse.json(
      { message: "Invalid license key format" },
      { status: 400 }
    );
  }
  if (!isLicenseValid(license)) {
    return NextResponse.json(
      { message: "License not valid or expired" },
      { status: 400 }
    );
  }
  const licensePath = path.resolve(process.cwd(), "license.json");
  fs.writeFileSync(licensePath, JSON.stringify(license, null, 2));

  // Set cookie for middleware
  const res = NextResponse.json({ message: "License uploaded successfully" });
  res.cookies.set("license_valid", "true", { path: "/", httpOnly: false });
  const expired = new Date(license.end_date).getTime();
  res.cookies.set("license_expired", expired.toString(), {
    path: "/",
    httpOnly: false,
  });
  return res;
}
