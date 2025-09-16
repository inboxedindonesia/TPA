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
} from "lucide-react";

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
      if (formData.password.length < 6) {
        setError("Password minimal 6 karakter!");
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
        if (formData.name) body.append("name", formData.name);
        if (formData.tempat_lahir)
          body.append("tempat_lahir", formData.tempat_lahir);
        if (formData.tanggal_lahir)
          body.append("tanggal_lahir", formData.tanggal_lahir);
        if (formData.jenis_kelamin)
          body.append("jenis_kelamin", formData.jenis_kelamin);
        if (formData.alamat) body.append("alamat", formData.alamat);
        if (formData.asal_sekolah)
          body.append("asal_sekolah", formData.asal_sekolah);
        if (formData.provinsi_sekolah)
          body.append("provinsi_sekolah", formData.provinsi_sekolah);
        if (formData.jurusan) body.append("jurusan", formData.jurusan);
        if (formData.nik) body.append("nik", formData.nik);
        if (formData.passport) body.append("passport", formData.passport);
        if (formData.jenjang) body.append("jenjang", formData.jenjang);
        if (formData.nationality) body.append("nationality", formData.nationality);
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
    } catch (err) {
      setError(
        step === 1
          ? "Terjadi kesalahan saat registrasi"
          : "Terjadi kesalahan saat menyimpan biodata"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div
        className={`${step === 2 ? "max-w-3xl" : "max-w-md"} w-full space-y-8`}
      >
        <div className={`card shadow-2xl ${step === 2 ? "p-10" : "p-8"}`}>
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              {step === 1 ? "Daftar Akun" : "Lengkapi Biodata"}
            </h2>
            <p className="text-gray-600">
              {step === 1
                ? "Buat akun untuk mengikuti TPA"
                : "Tambahkan informasi untuk melengkapi profil Anda"}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6 text-center">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form
            className="mt-8 space-y-6"
            onSubmit={handleSubmit}
          >
            {step === 1 ? (
              <>
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
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
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
                      placeholder="Masukkan nama lengkap"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                </div>
                {/* Grid fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label
                      htmlFor="tempat_lahir"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                          setFormData({
                            ...formData,
                            tempat_lahir: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="tanggal_lahir"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                          })
                        }
                      >
                        <option value="">Pilih Kewarganegaraan</option>
                        <option value="WNI">Warga Negara Indonesia (WNI)</option>
                        <option value="WNA">Warga Negara Asing (WNA)</option>
                      </select>
                    </div>
                  </div>
                  {/* Conditional field based on nationality */}
                  {formData.nationality === 'WNI' && (
                    <div>
                      <label
                        htmlFor="nik"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        NIK (Nomor Induk Kependudukan)
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
                          placeholder="Masukkan NIK (16 digit)"
                          value={formData.nik}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              nik: e.target.value.replace(/[^0-9]/g, ""),
                            })
                          }
                          pattern="[0-9]{16}"
                          maxLength={16}
                        />
                      </div>
                    </div>
                  )}
                  {formData.nationality === 'WNA' && (
                    <div>
                      <label
                        htmlFor="passport"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Nomor Passport
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
                          placeholder="Masukkan nomor passport"
                          value={formData.passport || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              passport: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                  <div>
                    <label
                      htmlFor="jenjang"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                          setFormData({
                            ...formData,
                            asal_sekolah: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="provinsi_sekolah"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                        onChange={(e) =>
                          setFormData({ ...formData, jurusan: e.target.value })
                        }
                        disabled={!formData.jenjang}
                      >
                        {!formData.jenjang ? (
                          <option value="">
                            Pilih jenjang terlebih dahulu
                          </option>
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

                  <div className="md:col-span-2">
                    <label
                      htmlFor="alamat"
                      className="block text-sm font-medium text-gray-700 mb-2"
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
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Foto (opsional)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
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
                          setFotoPreview(
                            file ? URL.createObjectURL(file) : null
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

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
              ) : step === 1 ? (
                "Daftar"
              ) : (
                "Simpan"
              )}
            </button>
          </form>

          <div className="flex flex-col items-center gap-2 mt-4">
            <span className="text-sm text-gray-600">
              Sudah punya akun?{" "}
              <a
                href="/login"
                className="text-primary-600 hover:text-primary-500 font-medium transition-colors duration-200"
              >
                Login
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
