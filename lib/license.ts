import crypto from "crypto";

const SECRET_KEY = process.env.LICENSE_SECRET_KEY || "gantilah_secret_ini";

export interface LicenseData {
  institution: string;
  start_date: string; // ISO string
  end_date: string; // ISO string
  signature: string;
}

export function signLicense(data: Omit<LicenseData, "signature">): string {
  const payload = `${data.institution}|${data.start_date}|${data.end_date}`;
  return crypto.createHmac("sha256", SECRET_KEY).update(payload).digest("hex");
}

export function verifyLicense(license: LicenseData): boolean {
  const { signature, ...data } = license;
  const expected = signLicense(data);
  return signature === expected;
}

export function isLicenseValid(license: LicenseData): boolean {
  if (!verifyLicense(license)) return false;
  const now = new Date();
  const start = new Date(license.start_date);
  const end = new Date(license.end_date);
  return now >= start && now <= end;
}
