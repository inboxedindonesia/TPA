"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Password tidak cocok!");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password minimal 6 karakter!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Terjadi kesalahan saat registrasi");
        return;
      }

      // Log register activity
      try {
        const { ClientActivityLogger } = await import(
          "@/lib/clientActivityLogger"
        );
        await ClientActivityLogger.logAuth(data.user.id, "REGISTER");
      } catch (logError) {
        console.error("Error logging register activity:", logError);
      }

      // Redirect ke halaman verifikasi OTP setelah registrasi berhasil
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      setError("Terjadi kesalahan saat registrasi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="card p-8 shadow-2xl">
          {/* Back button */}

          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              Daftar Akun Baru
            </h2>
          </div>

          <form
            className="mt-8 space-y-6"
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    className="input-field pl-10"
                    placeholder="Masukkan nama lengkap Anda"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="input-field pl-10"
                    placeholder="Masukkan email Anda"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="Masukkan password Anda"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {formData.password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          formData.password.length >= 6
                            ? "bg-green-500"
                            : "bg-gray-300"
                        }`}
                      ></div>
                      <span className="text-xs text-gray-500">
                        Minimal 6 karakter
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="Konfirmasi password Anda"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      {formData.password === formData.confirmPassword ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-xs ${
                          formData.password === formData.confirmPassword
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formData.password === formData.confirmPassword
                          ? "Password cocok"
                          : "Password tidak cocok"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex justify-center items-center group"
              >
                {isLoading ? (
                  <>
                    <div className="spinner mr-2"></div>
                    Memproses...
                  </>
                ) : (
                  <>Daftar</>
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Dengan mendaftar, Anda menyetujui{" "}
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-500 transition-colors duration-200"
                >
                  Syarat dan Ketentuan
                </a>{" "}
                serta{" "}
                <a
                  href="#"
                  className="text-primary-600 hover:text-primary-500 transition-colors duration-200"
                >
                  Kebijakan Privasi
                </a>
              </p>
            </div>
          </form>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600">Sudah punya akun? </span>
            <a
              href="/login"
              className="text-primary-600 hover:text-primary-500 font-medium transition-colors duration-200"
            >
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
