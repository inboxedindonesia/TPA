import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";

  if (!host && user.includes("@gmail.com")) {
    // Fallback to Gmail service if host not provided
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }

  if (!host) {
    throw new Error(
      "SMTP_HOST tidak diatur. Set SMTP_HOST atau gunakan akun Gmail di SMTP_USER."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587/others
    auth: { user, pass },
  });
}

export async function GET() {
  try {
    // Check environment variables
    const smtpConfig = {
      SMTP_HOST: process.env.SMTP_HOST || "(kosong)",
      SMTP_PORT: process.env.SMTP_PORT || "587",
      SMTP_USER: process.env.SMTP_USER || "(kosong)",
      SMTP_PASS: process.env.SMTP_PASS ? "***" : "(kosong)",
      SMTP_FROM: process.env.SMTP_FROM || "(kosong)",
    };

    // Check if required fields are set
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({
        success: false,
        error: "SMTP_USER dan SMTP_PASS harus diisi",
        config: smtpConfig,
        instructions: {
          gmail: {
            step1: "Buka Google Account Settings > Security",
            step2: "Aktifkan 2-Step Verification",
            step3: "Buat App Password untuk Mail",
            step4: "Gunakan App Password 16 digit di SMTP_PASS",
            step5: "Isi SMTP_USER dengan email Gmail Anda"
          }
        }
      }, { status: 400 });
    }

    // Test SMTP connection
    const transporter = buildTransport();
    await transporter.verify();

    return NextResponse.json({
      success: true,
      message: "Konfigurasi SMTP berhasil! Email dapat dikirim.",
      config: smtpConfig
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Gagal menguji konfigurasi SMTP",
      config: {
        SMTP_HOST: process.env.SMTP_HOST || "(kosong)",
        SMTP_PORT: process.env.SMTP_PORT || "587",
        SMTP_USER: process.env.SMTP_USER || "(kosong)",
        SMTP_PASS: process.env.SMTP_PASS ? "***" : "(kosong)",
        SMTP_FROM: process.env.SMTP_FROM || "(kosong)",
      },
      instructions: {
        gmail: {
          step1: "Buka Google Account Settings > Security",
          step2: "Aktifkan 2-Step Verification",
          step3: "Buat App Password untuk Mail",
          step4: "Gunakan App Password 16 digit di SMTP_PASS",
          step5: "Isi SMTP_USER dengan email Gmail Anda"
        }
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { testEmail } = await request.json();
    
    if (!testEmail) {
      return NextResponse.json({
        success: false,
        error: "Email tujuan diperlukan untuk test"
      }, { status: 400 });
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({
        success: false,
        error: "SMTP belum dikonfigurasi. Isi SMTP_USER dan SMTP_PASS di .env.local"
      }, { status: 400 });
    }

    // Send test email
    const transporter = buildTransport();
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: "Test Email - TPA Universitas",
      text: "Ini adalah email test untuk memverifikasi konfigurasi SMTP.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Test Email Berhasil!</h2>
          <p>Konfigurasi SMTP TPA Universitas berfungsi dengan baik.</p>
          <p>Email ini dikirim pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      `
    });

    return NextResponse.json({
      success: true,
      message: `Email test berhasil dikirim ke ${testEmail}`
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || "Gagal mengirim email test"
    }, { status: 500 });
  }
}