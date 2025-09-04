import { NextRequest, NextResponse } from "next/server";
import { sign } from "crypto";
import { getToken } from "next-auth/jwt";

// Ambil SECRET_KEY dari env
const SECRET_KEY = process.env.LICENSE_SECRET_KEY;

function signLicense({
  institution,
  start_date,
  end_date,
}: {
  institution: string;
  start_date: string;
  end_date: string;
}) {
  const payload = `${institution}|${start_date}|${end_date}`;
  return require("crypto")
    .createHmac("sha256", SECRET_KEY)
    .update(payload)
    .digest("hex");
}

export async function POST(req: NextRequest) {
  // Tolak jika mode on-premise
  if (process.env.NEXT_PUBLIC_IS_ONPREM === "true") {
    return NextResponse.json(
      { message: "Fitur tidak tersedia di mode on-premise" },
      { status: 403 }
    );
  }
  // Cek autentikasi & role admin (manual decode JWT dari cookie)
  const cookies = req.cookies;
  const jwtToken = cookies.get("token")?.value;
  if (!jwtToken) {
    return NextResponse.json(
      { message: "Unauthorized: token missing" },
      { status: 401 }
    );
  }
  let decoded;
  try {
    decoded = require("jsonwebtoken").verify(
      jwtToken,
      "your-super-secret-jwt-key-for-development"
    );
    console.log("DEBUG DECODED:", decoded);
  } catch (err) {
    return NextResponse.json(
      { message: "Unauthorized: invalid token" },
      { status: 401 }
    );
  }
  if (
    !decoded.roles ||
    !Array.isArray(decoded.roles) ||
    !decoded.roles.includes("role-admin")
  ) {
    return NextResponse.json(
      { message: "Unauthorized: role-admin required", debug: decoded },
      { status: 401 }
    );
  }
  if (!SECRET_KEY) {
    return NextResponse.json(
      { message: "Server misconfig: SECRET_KEY not set" },
      { status: 500 }
    );
  }
  const { institution, start_date, end_date } = await req.json();
  if (!institution || !start_date || !end_date) {
    return NextResponse.json(
      { message: "Data tidak lengkap" },
      { status: 400 }
    );
  }
  const signature = signLicense({ institution, start_date, end_date });
  const license = { institution, start_date, end_date, signature };
  const licenseKey = Buffer.from(JSON.stringify(license), "utf-8").toString(
    "base64"
  );
  return NextResponse.json({ licenseKey });
}
