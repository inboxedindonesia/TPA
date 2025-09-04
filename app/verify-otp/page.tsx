"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyOtpInner() {
  const [resendLoading, setResendLoading] = useState(false);

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Gagal mengirim ulang OTP");
      } else {
        setSuccess("OTP baru telah dikirim ke email Anda.");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat mengirim ulang OTP");
    } finally {
      setResendLoading(false);
    }
  };
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    const otpValue = otp.join("");
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpValue }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "OTP salah atau sudah kadaluarsa");
        return;
      }
      setSuccess("Verifikasi berhasil! Lanjutkan melengkapi biodata.");
      setTimeout(() => router.push("/register?step=2"), 1200);
    } catch (err) {
      setError("Terjadi kesalahan saat verifikasi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    if (val === "") {
      newOtp[idx] = "";
      setOtp(newOtp);
      return;
    }
    newOtp[idx] = val[val.length - 1];
    setOtp(newOtp);
    // Focus next
    if (val && idx < 5) {
      const next = document.getElementById(`otp-input-${idx + 1}`);
      if (next) (next as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      const prev = document.getElementById(`otp-input-${idx - 1}`);
      if (prev) (prev as HTMLInputElement).focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="card p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-center mb-4">
            Verifikasi OTP
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Masukkan kode OTP yang dikirim ke email <b>{email}</b>
          </p>
          <form
            className="space-y-6"
            onSubmit={handleSubmit}
          >
            <div className="flex justify-center gap-2 mb-2">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-input-${idx}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  className="w-12 h-14 text-center text-2xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all shadow-sm"
                  value={digit}
                  onChange={(e) => handleOtpChange(e, idx)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  required
                  autoFocus={idx === 0}
                />
              ))}
            </div>
            <div className="flex justify-center mb-2">
              <button
                type="button"
                className="text-blue-600 hover:underline text-sm disabled:text-gray-400"
                onClick={handleResendOtp}
                disabled={resendLoading}
              >
                {resendLoading ? "Mengirim ulang..." : "Kirim Ulang OTP"}
              </button>
            </div>
            {error && <div className="text-red-600 text-center">{error}</div>}
            {success && (
              <div className="text-green-600 text-center">{success}</div>
            )}
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : "Verifikasi"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpInner />
    </Suspense>
  );
}
