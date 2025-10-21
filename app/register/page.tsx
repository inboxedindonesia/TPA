"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Calendar,
  MapPin,
  Home,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import AuthContainer from "../components/AuthContainer";

// Helper evaluasi password kuat
function evaluatePassword(pw: string) {
  const length = pw.length >= 8;
  const upper = /[A-Z]/.test(pw);
  const lower = /[a-z]/.test(pw);
  const number = /[0-9]/.test(pw);
  const symbol = /[^A-Za-z0-9]/.test(pw);
  const score = [length, upper, lower, number, symbol].filter(Boolean).length;
  let level: "lemah" | "sedang" | "kuat" = "lemah";
  if (score >= 4 && pw.length >= 10) level = "kuat";
  else if (score >= 3) level = "sedang";
  return {
    length,
    upper,
    lower,
    number,
    symbol,
    score,
    level,
    valid: length && upper && lower && number && symbol,
  };
}

function PasswordStrength({ password }: { password: string }) {
  const { score, level } = evaluatePassword(password);
  const barColors: Record<string, string> = {
    lemah: "bg-red-500",
    sedang: "bg-yellow-500",
    kuat: "bg-green-600",
  };
  // Bar full (100%) hanya saat level "kuat"; selain itu dibatasi agar tidak full
  const raw = Math.round((score / 5) * 100);
  const percent = level === "kuat" ? 100 : Math.min(80, raw);
  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColors[level]} transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={`text-xs font-medium capitalize ${
          level === "lemah"
            ? "text-red-600"
            : level === "sedang"
            ? "text-yellow-600"
            : "text-green-600"
        }`}
      >
        {level}
      </span>
    </div>
  );
}

function PasswordCriteria({
  evaluation,
}: {
  evaluation: ReturnType<typeof evaluatePassword>;
}) {
  const items = [
    { label: "Minimal 8 karakter", ok: evaluation.length },
    { label: "Huruf besar (A–Z)", ok: evaluation.upper },
    { label: "Huruf kecil (a–z)", ok: evaluation.lower },
    { label: "Angka (0–9)", ok: evaluation.number },
    { label: "Simbol (!@#$% dll)", ok: evaluation.symbol },
  ];
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center gap-2"
        >
          {it.ok ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-gray-400" />
          )}
          <span className={it.ok ? "text-green-700" : "text-gray-600"}>
            {it.label}
          </span>
        </div>
      ))}
      <div className="col-span-1 sm:col-span-2 text-[11px] text-gray-500 mt-1">
        Tips: kombinasi 10+ karakter akan meningkatkan skor menjadi kuat.
      </div>
    </div>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    alamat: "",
    asal_sekolah: "",
    provinsi_sekolah: "",
    jurusan: "",
    nik: "",
    jenjang: "",
    nationality: "",
    passport: "",
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Options for jenjang and jurusan (dependent on jenjang)
  const jenjangOptions = [
    { value: "D3", label: "Diploma (D3)" },
    { value: "S1", label: "Sarjana (S1)" },
    { value: "S2", label: "Magister (S2)" },
    { value: "S3", label: "Doktor (S3)" },
  ];
  const jurusanOptions: Record<
    string,
    Array<{ group: string; options: Array<{ value: string; label: string }> }>
  > = {
    D3: [
      {
        group: "Jenjang Diploma (D3)",
        options: [
          { value: "D3 Akuntansi", label: "D3 Akuntansi" },
          {
            value: "D3 Manajemen Perusahaan",
            label: "D3 Manajemen Perusahaan",
          },
        ],
      },
    ],
    S1: [
      {
        group: "Fakultas Ekonomi dan Bisnis (FEB)",
        options: [
          { value: "Akuntansi", label: "Akuntansi" },
          { value: "Manajemen", label: "Manajemen" },
        ],
      },
      {
        group: "Fakultas Teknik",
        options: [
          { value: "Arsitektur", label: "Arsitektur" },
          { value: "Teknik Sipil", label: "Teknik Sipil" },
          { value: "Teknik Mesin", label: "Teknik Mesin" },
          { value: "Teknik Elektro", label: "Teknik Elektro" },
          { value: "Teknik Industri", label: "Teknik Industri" },
        ],
      },
      {
        group: "Fakultas Ilmu Komputer",
        options: [
          { value: "Teknik Informatika", label: "Teknik Informatika" },
          { value: "Sistem Informasi", label: "Sistem Informasi" },
        ],
      },
      {
        group: "Fakultas Ilmu Komunikasi",
        options: [{ value: "Ilmu Komunikasi", label: "Ilmu Komunikasi" }],
      },
      {
        group: "Fakultas Psikologi",
        options: [{ value: "Psikologi", label: "Psikologi" }],
      },
      {
        group: "Fakultas Desain & Seni Kreatif",
        options: [
          { value: "Desain Produk", label: "Desain Produk" },
          { value: "Desain Interior", label: "Desain Interior" },
          {
            value: "Desain Komunikasi Visual",
            label: "Desain Komunikasi Visual",
          },
        ],
      },
    ],
    S2: [
      {
        group: "Jenjang Magister (S2)",
        options: [
          { value: "Magister Manajemen", label: "Magister Manajemen" },
          {
            value: "Magister Ilmu Komunikasi",
            label: "Magister Ilmu Komunikasi",
          },
          {
            value: "Magister Teknik Industri",
            label: "Magister Teknik Industri",
          },
          {
            value: "Magister Teknik Elektro",
            label: "Magister Teknik Elektro",
          },
          { value: "Magister Akuntansi", label: "Magister Akuntansi" },
          { value: "Magister Teknik Sipil", label: "Magister Teknik Sipil" },
          { value: "Magister Teknik Mesin", label: "Magister Teknik Mesin" },
        ],
      },
    ],
    S3: [
      {
        group: "Jenjang Doktor (S3)",
        options: [
          { value: "Doktor Manajemen", label: "Doktor (S3) Manajemen" },
        ],
      },
    ],
  };
  const jurusanGroups = jurusanOptions[formData.jenjang] || [];

  useEffect(() => {
    const s = searchParams.get("step");
    if (s === "2") setStep(2);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (formData.password !== formData.confirmPassword) {
        setError("Password tidak cocok!");
        return;
      }
      if (!passwordStrength.valid) {
        setError(
          "Password belum kuat. Lengkapi semua kriteria (huruf besar, kecil, angka, simbol, minimal 8)."
        );
        return;
      }
    }

    setIsLoading(true);
    setError("");
    try {
      let response: Response;
      if (step === 1) {
        response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
          }),
        });
      } else {
        const body = new FormData();
        const append = (k: string, v?: string) => {
          if (v) body.append(k, v);
        };
        append("name", formData.name);
        append("tempat_lahir", formData.tempat_lahir);
        append("tanggal_lahir", formData.tanggal_lahir);
        append("jenis_kelamin", formData.jenis_kelamin);
        append("alamat", formData.alamat);
        append("asal_sekolah", formData.asal_sekolah);
        append("provinsi_sekolah", formData.provinsi_sekolah);
        append("jurusan", formData.jurusan);
        append("nik", formData.nik);
        append("passport", formData.passport);
        append("jenjang", formData.jenjang);
        append("nationality", formData.nationality);
        if (foto) body.append("foto", foto);
        response = await fetch("/api/auth/profile", {
          method: "PUT",
          body,
        });
      }

      const data = await response.json();
      if (!response.ok) {
        setError(
          data?.error ||
            (step === 1
              ? "Terjadi kesalahan saat registrasi"
              : "Terjadi kesalahan saat menyimpan biodata")
        );
        return;
      }

      if (step === 1) {
        router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
      } else {
        router.push("/login");
      }
    } catch {
      setError(
        step === 1
          ? "Terjadi kesalahan saat registrasi"
          : "Terjadi kesalahan saat menyimpan biodata"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = evaluatePassword(formData.password);
  const confirmMismatch =
    formData.confirmPassword.length > 0 &&
    formData.password !== formData.confirmPassword;

  if (step === 1) {
    return (
      <AuthContainer
        title="Daftar Akun"
        subtitle="Buat akun untuk mengikuti TPA"
        footer={
          <span>
            Sudah punya akun?{" "}
            <a
              href="/login"
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Login
            </a>
          </span>
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
                placeholder="Masukkan password"
                pattern={
                  "(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}"
                }
                title={
                  "Minimal 8 karakter dan mengandung huruf besar, huruf kecil, angka, dan simbol"
                }
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
            <PasswordStrength password={formData.password} />
            <PasswordCriteria
              evaluation={evaluatePassword(formData.password)}
            />
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
                className={`input-field pl-10 pr-10 ${
                  confirmMismatch
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
                placeholder="Ulangi password"
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
            {confirmMismatch && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                Password belum sesuai
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !passwordStrength.valid || confirmMismatch}
            className="btn-primary w-full flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="spinner mr-2"></div>
                Memproses...
              </>
            ) : (
              "Daftar"
            )}
          </button>
        </form>
      </AuthContainer>
    );
  }
  return (
    <AuthContainer
      title="Lengkapi Biodata"
      subtitle="Tambahkan informasi untuk melengkapi profil"
      width="2xl"
      footer={
        <span>
          Sudah punya akun?{" "}
          <a
            href="/login"
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            Login
          </a>
        </span>
      }
    >
      {/* Removed step header label */}
      <form
        onSubmit={handleSubmit}
        className="space-y-10"
      >
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid gap-8 md:gap-8 md:grid-cols-2 xl:grid-cols-3 items-stretch">
          {/* Section: Data Pribadi */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow xl:col-span-1 md:col-span-2 h-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
                1
              </span>
              Data Pribadi
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div className="md:col-span-2">
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
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
                    className="input-field pl-10"
                    placeholder="Sesuai KTP/Identitas"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              {/* Tempat Lahir */}
              <div>
                <label
                  htmlFor="tempat_lahir"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                >
                  Tempat Lahir
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="tempat_lahir"
                    name="tempat_lahir"
                    type="text"
                    className="input-field pl-10"
                    placeholder="Contoh: Bandung"
                    value={formData.tempat_lahir}
                    onChange={(e) =>
                      setFormData({ ...formData, tempat_lahir: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="tanggal_lahir"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                >
                  Tanggal Lahir
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="tanggal_lahir"
                    name="tanggal_lahir"
                    type="date"
                    className="input-field pl-10"
                    value={formData.tanggal_lahir}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tanggal_lahir: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="jenis_kelamin"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                >
                  Jenis Kelamin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="jenis_kelamin"
                    name="jenis_kelamin"
                    className="input-field pl-10"
                    value={formData.jenis_kelamin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenis_kelamin: e.target.value,
                      })
                    }
                  >
                    <option value="">Pilih</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="nationality"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                >
                  Kewarganegaraan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="nationality"
                    name="nationality"
                    className="input-field pl-10"
                    value={formData.nationality}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nationality: e.target.value,
                        nik: "",
                        passport: "",
                      })
                    }
                  >
                    <option value="">Pilih Kewarganegaraan</option>
                    <option value="WNI">Warga Negara Indonesia (WNI)</option>
                    <option value="WNA">Warga Negara Asing (WNA)</option>
                  </select>
                </div>
              </div>
              {formData.nationality === "WNI" && (
                <div className="md:col-span-2">
                  <label
                    htmlFor="nik"
                    className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                  >
                    NIK
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="nik"
                      name="nik"
                      type="text"
                      className="input-field pl-10"
                      placeholder="16 digit"
                      maxLength={16}
                      pattern="[0-9]{16}"
                      value={formData.nik}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nik: e.target.value.replace(/[^0-9]/g, ""),
                        })
                      }
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Pastikan sesuai KTP.
                  </p>
                </div>
              )}
              {formData.nationality === "WNA" && (
                <div className="md:col-span-2">
                  <label
                    htmlFor="passport"
                    className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                  >
                    Passport
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="passport"
                      name="passport"
                      type="text"
                      className="input-field pl-10"
                      placeholder="Nomor passport"
                      value={formData.passport}
                      onChange={(e) =>
                        setFormData({ ...formData, passport: e.target.value })
                      }
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-gray-500">
                    Masukkan nomor aktif.
                  </p>
                </div>
              )}
            </div>
          </div>
          {/* Section: Pendidikan */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow xl:col-span-1 md:col-span-1 h-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
                2
              </span>
              Pendidikan
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label
                  htmlFor="jenjang"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                >
                  Jenjang
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="jenjang"
                    name="jenjang"
                    className="input-field pl-10"
                    value={formData.jenjang}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jenjang: e.target.value,
                        jurusan: "",
                      })
                    }
                  >
                    <option value="">Pilih Jenjang</option>
                    {jenjangOptions.map((o) => (
                      <option
                        key={o.value}
                        value={o.value}
                      >
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="asal_sekolah"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                >
                  Asal Sekolah
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="asal_sekolah"
                    name="asal_sekolah"
                    type="text"
                    className="input-field pl-10"
                    placeholder="Nama sekolah"
                    value={formData.asal_sekolah}
                    onChange={(e) =>
                      setFormData({ ...formData, asal_sekolah: e.target.value })
                    }
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="provinsi_sekolah"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                >
                  Provinsi Sekolah
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="provinsi_sekolah"
                    name="provinsi_sekolah"
                    type="text"
                    className="input-field pl-10"
                    placeholder="Contoh: Jawa Barat"
                    value={formData.provinsi_sekolah}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        provinsi_sekolah: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="jurusan"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                >
                  Jurusan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="jurusan"
                    name="jurusan"
                    className="input-field pl-10"
                    value={formData.jurusan}
                    disabled={!formData.jenjang}
                    onChange={(e) =>
                      setFormData({ ...formData, jurusan: e.target.value })
                    }
                  >
                    {!formData.jenjang ? (
                      <option value="">Pilih jenjang terlebih dahulu</option>
                    ) : (
                      <option value="">Pilih Jurusan</option>
                    )}
                    {jurusanGroups.map((grp) => (
                      <optgroup
                        key={grp.group}
                        label={grp.group}
                      >
                        {grp.options.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                          >
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          {/* Section: Lainnya */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow xl:col-span-1 md:col-span-2 h-full">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="h-5 w-5 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center">
                3
              </span>
              Lainnya
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div className="md:col-span-2">
                <label
                  htmlFor="alamat"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                >
                  Alamat Tempat Tinggal
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Home className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="alamat"
                    name="alamat"
                    type="text"
                    className="input-field pl-10"
                    placeholder="Alamat lengkap"
                    value={formData.alamat}
                    onChange={(e) =>
                      setFormData({ ...formData, alamat: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label
                  htmlFor="foto"
                  className="block text-xs font-medium text-gray-700 tracking-wide mb-1.5"
                >
                  Foto{" "}
                  <span className="text-gray-400 font-normal">(opsional)</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center ring-1 ring-gray-200">
                    {fotoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={fotoPreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      id="foto"
                      name="foto"
                      type="file"
                      accept="image/*"
                      className="input-field"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFoto(file);
                        if (fotoPreview) URL.revokeObjectURL(fotoPreview);
                        setFotoPreview(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                    <p className="text-[10px] text-gray-500">
                      Format jpg/png. Disarankan rasio 1:1.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="btn-secondary px-6"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary min-w-[140px] flex justify-center items-center"
          >
            {isLoading ? (
              <>
                <div className="spinner mr-2"></div>
                Memproses...
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </form>
    </AuthContainer>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
