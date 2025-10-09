"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import AuthContainer from "../components/AuthContainer";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Email atau password salah");
        return;
      }

      // Simpan token dan user awal
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Segera refresh user dari API profil (normalized keys)
      try {
        const profRes = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${data.token}` },
          credentials: "include",
        });
        if (profRes.ok) {
          const prof = await profRes.json();
          if (prof && prof.user) {
            localStorage.setItem("user", JSON.stringify(prof.user));
          }
        }
      } catch {}

      // Redirect berdasarkan role
      if (data.user.role_name === "Administrator") {
        router.push("/admin/dashboard");
      } else {
        router.push("/peserta/dashboard");
      }
    } catch (error) {
      setError("Terjadi kesalahan saat login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer
      title="Masuk Akun"
      subtitle="Silakan login untuk memulai tes potensi akademik"
      footer={
        <>
          <a
            href="/forgot-password"
            className="text-blue-600 hover:underline"
          >
            Lupa password?
          </a>
          <div className="mt-2">
            Belum punya akun?{" "}
            <a
              href="/register"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Register
            </a>
          </div>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
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
                required
                autoComplete="current-password"
                className="input-field pl-10 pr-10"
                placeholder="Masukkan password Anda"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex justify-center items-center"
        >
          {isLoading ? (
            <>
              <div className="spinner mr-2"></div>
              Memproses...
            </>
          ) : (
            "Masuk"
          )}
        </button>
      </form>
    </AuthContainer>
  );
}
