import nodemailer from "nodemailer";

export async function sendOtpEmail(to: string, otp: string) {
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

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "Kode OTP Verifikasi Akun TPA Universitas",
    text: `Kode OTP Anda: ${otp}`,
    html: `<p>Kode OTP Anda: <b>${otp}</b></p>`,
  });
}
