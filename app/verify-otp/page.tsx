"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyOtpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "OTP salah atau sudah kadaluarsa");
        return;
      }
      setSuccess("Verifikasi berhasil! Silakan login.");
      setTimeout(
        () => router.push("/login?message=Verifikasi berhasil! Silakan login."),
        2000
      );
    } catch (err) {
      setError("Terjadi kesalahan saat verifikasi");
    } finally {
      setIsLoading(false);
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
            <input
              type="text"
              className="input-field w-full text-center text-lg tracking-widest"
              placeholder="Masukkan 6 digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
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
