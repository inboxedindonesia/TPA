// LICENSE GENERATOR (Node.js)
// Jalankan: node scripts/generate-license-key.js

const crypto = require("crypto");
const fs = require("fs");

// PENTING: SECRET_KEY HARUS SANGAT RAHASIA!
// Gunakan environment variable LICENSE_SECRET_KEY saat menjalankan script!
const SECRET_KEY = process.env.LICENSE_SECRET_KEY;

function signLicense({ institution, start_date, end_date }) {
  const payload = `${institution}|${start_date}|${end_date}`;
  return crypto.createHmac("sha256", SECRET_KEY).update(payload).digest("hex");
}

if (!SECRET_KEY) {
  console.error(
    "\n[ERROR] Anda harus mengatur LICENSE_SECRET_KEY sebagai environment variable sebelum generate license!\n"
  );
  process.exit(1);
}

function generateLicenseKey({ institution, start_date, end_date }) {
  const signature = signLicense({ institution, start_date, end_date });
  const license = { institution, start_date, end_date, signature };
  const json = JSON.stringify(license);
  return Buffer.from(json, "utf-8").toString("base64");
}

// Ganti data di bawah sesuai kebutuhan
const licenseData = {
  institution: "Universitas Mercu Buana",
  start_date: "2025-08-27",
  end_date: "2025-08-28",
};

// Tidak perlu validasi env, SECRET_KEY sudah diisi langsung di file.

const key = generateLicenseKey(licenseData);
console.log("License Key (input ke aplikasi):\n", key);

// Simpan juga file JSON jika ingin dicek manual
fs.writeFileSync(
  "license.json",
  JSON.stringify(
    { ...licenseData, signature: signLicense(licenseData) },
    null,
    2
  )
);
