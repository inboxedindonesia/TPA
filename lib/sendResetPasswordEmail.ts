import nodemailer from "nodemailer";

export async function sendResetPasswordEmail(to: string, token: string) {
  const port = Number(process.env.SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const resetUrl = `${
    process.env.NEXT_PUBLIC_BASE_URL || "https://tpa-seven.vercel.app"
  }/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Reset Password TPA Universitas",
    text: `Anda meminta reset password akun TPA Universitas. Klik link berikut untuk mengatur password baru: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #f4f6fb; padding: 32px;">
        <div style="max-width: 480px; margin: auto; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0001; padding: 32px;">
          <div style="text-align:center; margin-bottom: 24px;">
            <img src='https://upload.wikimedia.org/wikipedia/commons/6/6b/Universitas_Indonesia_logo.png' alt='Logo Universitas' style='height:48px; margin-bottom:12px;' />
            <h2 style="color:#2d3a4a; margin:0 0 8px 0;">Reset Password TPA Universitas</h2>
            <p style="color:#4b5563; margin:0;">Anda menerima email ini karena ada permintaan reset password untuk akun Anda.</p>
          </div>
          <p style="color:#374151;">Klik tombol di bawah ini untuk mengatur password baru Anda:</p>
          <div style="text-align:center; margin: 24px 0;">
            <a href="${resetUrl}" style="display:inline-block; background:#2563eb; color:#fff; padding:12px 32px; border-radius:6px; text-decoration:none; font-weight:600; font-size:16px;">Reset Password</a>
          </div>
          <p style="color:#6b7280; font-size:14px;">Jika Anda tidak meminta reset password, abaikan email ini.</p>
          <hr style="margin:32px 0; border:none; border-top:1px solid #e5e7eb;" />
          <div style="color:#9ca3af; font-size:12px; text-align:center;">&copy; ${new Date().getFullYear()} TPA Universitas</div>
        </div>
      </div>
    `,
  });
}
