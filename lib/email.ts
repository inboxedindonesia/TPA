import nodemailer from "nodemailer";

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const pool = process.env.SMTP_POOL === "true"; // enable pooling for throughput
  const dkimDomainName = process.env.SMTP_DKIM_DOMAIN;
  const dkimKeySelector = process.env.SMTP_DKIM_SELECTOR;
  const dkimPrivateKey = process.env.SMTP_DKIM_PRIVATE_KEY;
  const dkim =
    dkimDomainName && dkimKeySelector && dkimPrivateKey
      ? {
          domainName: dkimDomainName,
          keySelector: dkimKeySelector,
          privateKey: dkimPrivateKey,
        }
      : undefined;

  if (!host && user.includes("@gmail.com")) {
    // Fallback to Gmail service if host not provided
    return nodemailer.createTransport(
      {
        service: "gmail",
        pool,
        auth: { user, pass },
        dkim,
      } as any
    );
  }

  if (!host) {
    throw new Error(
      "SMTP_HOST tidak diatur. Set SMTP_HOST atau gunakan akun Gmail di SMTP_USER."
    );
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587/others
    pool,
    auth: { user, pass },
    dkim,
    // Improve deliverability with TLS options if needed
    tls: {
      rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED === "true",
      ciphers: process.env.SMTP_TLS_CIPHERS || undefined,
    },
  } as any);

  return transporter;
}

export async function sendOtpEmail(to: string, otp: string) {
  const transporter = buildTransport();
  // Verify connection when possible (no-op on some providers)
  if (process.env.SMTP_VERIFY_BEFORE_SEND !== "false") {
    try {
      await transporter.verify();
    } catch {}
  }

  // Pisahkan setiap angka OTP ke dalam kotak
  const otpBoxes = String(otp)
    .split("")
    .map(
      (digit) =>
        `<span style="display:inline-block;width:40px;height:48px;line-height:48px;margin:0 4px;background:#2563eb;color:#fff;font-size:28px;font-weight:700;border-radius:8px;text-align:center;letter-spacing:2px;">${digit}</span>`
    )
    .join("");

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://tpa-seven.vercel.app";
  const verifyLink = `${baseUrl}/verify-otp?email=${encodeURIComponent(to)}`;
  try {
    await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        (process.env.SMTP_USER
          ? `TPA Universitas <${process.env.SMTP_USER}>`
          : undefined),
      to,
      subject: "Kode OTP Verifikasi Akun TPA Universitas",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "high",
        "List-Unsubscribe": `<mailto:${process.env.SMTP_FROM || process.env.SMTP_USER}?subject=unsubscribe>`,
      },
      replyTo: process.env.SMTP_REPLY_TO || undefined,
      text: `Kode OTP Anda: ${otp}\n\nKlik link berikut untuk verifikasi: ${verifyLink}`,
      html: `
      <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 32px;">
        <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px;">
          <div style="text-align:center; margin-bottom: 24px;">
            <img src='https://upload.wikimedia.org/wikipedia/commons/6/6b/Universitas_Indonesia_logo.png' alt='Logo Universitas' style='height:48px; margin-bottom:12px;' />
            <h2 style="color:#2d3a4a; margin:0 0 8px 0;">Kode OTP Verifikasi</h2>
            <p style="color:#4b5563; margin:0;">Gunakan kode berikut untuk verifikasi akun TPA Universitas Anda.</p>
          </div>
          <div style="text-align:center; margin: 24px 0;">
            ${otpBoxes}
          </div>
          <p style="color:#6b7280; font-size:14px; text-align:center;">Kode OTP berlaku selama 10 menit.</p>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${verifyLink}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Verifikasi Akun</a>
            <p style="color:#6b7280; font-size:13px; margin-top:8px;">Atau buka link berikut: <br/><a href="${verifyLink}">${verifyLink}</a></p>
          </div>
          <hr style="margin:32px 0; border:none; border-top:1px solid #e5e7eb;" />
          <div style="color:#9ca3af; font-size:12px; text-align:center;">&copy; ${new Date().getFullYear()} TPA Universitas</div>
        </div>
      </div>
    `,
    });
  } catch (err: any) {
    // Surface clearer error for caller/logs
    const reason = err?.response || err?.message || "Gagal mengirim email";
    throw new Error(`OTP email gagal dikirim: ${reason}`);
  }
}
