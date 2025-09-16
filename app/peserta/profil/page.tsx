"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { useRouter } from "next/navigation";
import PesertaHeader from "../../components/PesertaHeader";
import {
  CalendarDays,
  Trophy,
  Clock,
  Timer,
  FileDown,
  ArrowRight,
  CheckCircle2,
  Gauge,
} from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  is_verified?: boolean;
  nim?: string;
  fakultas?: string;
  prodi?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  phone?: string;
  alamat?: string;
  agama?: string;
  angkatan?: string;
  tahun_masuk?: string;
  // Biodata tambahan dari registrasi
  asal_sekolah?: string;
  provinsi_sekolah?: string;
  jurusan?: string;
  nik?: string;
  jenjang?: string;
  foto?: string; // relative path under public/
  registration_id?: string;
  nationality?: string;
  passport?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    nim: "",
    fakultas: "",
    prodi: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    phone: "",
    alamat: "",
    agama: "",
    angkatan: "",
    tahun_masuk: "",
    asal_sekolah: "",
    provinsi_sekolah: "",
    jurusan: "",
    nik: "",
    jenjang: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [activeTab, setActiveTab] = useState<"profil" | "hasil-tes">("profil");
  const [hasilTes, setHasilTes] = useState<any[]>([]);
  const [loadingHasilTes, setLoadingHasilTes] = useState(false);
  const [errorHasilTes, setErrorHasilTes] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        const res = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const mergedUser = data?.user || {};
          setUser(mergedUser);
          setFormData((prev) => ({
            ...prev,
            name: mergedUser.name || "",
            email: mergedUser.email || "",
            nim: mergedUser.nim || "",
            fakultas: mergedUser.fakultas || "",
            prodi: mergedUser.prodi || "",
            tempat_lahir: mergedUser.tempat_lahir || "",
            tanggal_lahir: mergedUser.tanggal_lahir || "",
            jenis_kelamin: mergedUser.jenis_kelamin || "",
            phone: mergedUser.phone || "",
            alamat: mergedUser.alamat || "",
            agama: mergedUser.agama || "",
            angkatan: mergedUser.angkatan || "",
            tahun_masuk: mergedUser.tahun_masuk || "",
            asal_sekolah: mergedUser.asal_sekolah || "",
            provinsi_sekolah: mergedUser.provinsi_sekolah || "",
            jurusan: mergedUser.jurusan || "",
            nik: mergedUser.nik || "",
            jenjang: mergedUser.jenjang || "",
          }));
        } else {
          setError("Gagal memuat data profil");
        }
      } catch (error) {
        setError("Terjadi kesalahan server");
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [router]);

  useEffect(() => {
    if (activeTab === "hasil-tes") {
      setLoadingHasilTes(true);
      setErrorHasilTes("");
      const fetchHasilTes = async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch("/api/peserta/hasil-tes", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Gagal mengambil data hasil tes");
          const data = await response.json();
          setHasilTes(data.results || []);
        } catch (e: any) {
          setErrorHasilTes(e.message || "Gagal memuat hasil tes");
        } finally {
          setLoadingHasilTes(false);
        }
      };
      fetchHasilTes();
    }
  }, [activeTab]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const computeAge = (dateString: string) => {
    if (!dateString) return "-";
    const dob = new Date(dateString);
    if (isNaN(dob.getTime())) return "-";
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} tahun`;
  };

  // Generate PDF untuk satu hasil tes dengan preview
  const downloadSingleResultPdf = (r: any) => {
    try {
      const doc = new jsPDF();
      const safe = (s: any) => (s == null ? "-" : String(s));
      const pct =
        r?.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : null;
      const fileSafe = (s: string) =>
        safe(s)
          .toLowerCase()
          .replace(/[^a-z0-9-_\s]/g, "")
          .trim()
          .replace(/\s+/g, "-");

      doc.setFontSize(16);
      doc.text("Hasil Tes TPA", 10, 15);
      doc.setFontSize(12);

      let y = 30;
      doc.text(`Nama Tes     : ${safe(r?.testName)}`, 10, y);
      y += 8;
      doc.text(
        `Skor          : ${safe(r?.score)}${
          r?.maxScore ? "/" + r.maxScore : ""
        }${pct !== null ? ` (${pct}%)` : ""}`,
        10,
        y
      );
      y += 8;
      doc.text(`Tanggal      : ${r?.date ? formatDate(r.date) : "-"}`, 10, y);
      y += 8;
      doc.text(`Durasi        : ${r?.duration ? formatDuration(r.duration) : "-"}`, 10, y);
      y += 8;
      doc.text(`Status        : ${r?.status === "COMPLETED" ? "Selesai" : "Belum Selesai"}`, 10, y);

      // Tambahkan informasi detail jika ada
      if (r?.correctAnswers !== undefined || r?.wrongAnswers !== undefined) {
        y += 12;
        doc.text("Detail Jawaban:", 10, y);
        y += 8;
        doc.text(`Benar         : ${safe(r?.correctAnswers)}`, 10, y);
        y += 8;
        doc.text(`Salah         : ${safe(r?.wrongAnswers)}`, 10, y);
      }

      // Preview PDF terlebih dahulu
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Buka preview di tab baru
      const previewWindow = window.open(pdfUrl, '_blank');
      
      if (previewWindow) {
        // Tunggu sebentar lalu tanyakan apakah ingin download
        setTimeout(() => {
          const shouldDownload = confirm('Apakah Anda ingin mengunduh PDF ini?');
          if (shouldDownload) {
            const dateForFile = r?.date
              ? new Date(r.date).toISOString().slice(0, 10)
              : "tanggal";
            const nameForFile = fileSafe(r?.testName || "tes");
            doc.save(`hasil-${nameForFile}-${dateForFile}.pdf`);
          }
          // Bersihkan URL object
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
      } else {
        // Jika popup diblokir, langsung download
        alert('Popup diblokir. PDF akan langsung diunduh.');
        const dateForFile = r?.date
          ? new Date(r.date).toISOString().slice(0, 10)
          : "tanggal";
        const nameForFile = fileSafe(r?.testName || "tes");
        doc.save(`hasil-${nameForFile}-${dateForFile}.pdf`);
        URL.revokeObjectURL(pdfUrl);
      }
    } catch (e) {
      alert("Gagal membuat PDF hasil tes.");
    }
  };

  const formatDuration = (sec?: number | null) => {
    if (sec == null || isNaN(sec as any)) return "-";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} detik`;
    return `${m} menit ${s.toString().padStart(2, "0")} detik`;
  };

  const handleLogout = () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Data tidak ditemukan
          </h3>
          <p className="text-gray-600 mb-4">
            Tidak dapat memuat data profil Anda
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      <PesertaHeader handleLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
              <p className="mt-2 text-gray-600">Kelola informasi profil Anda</p>
            </div>
          </div>
        </div>

        <div className="mb-6 flex gap-2 border-b">
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "profil"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("profil")}
          >
            Informasi Profil
          </button>
          <button
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === "hasil-tes"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("hasil-tes")}
          >
            Hasil Tes
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {activeTab === "profil" && (
          <div className="space-y-6">
            {/* Header Summary Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={user.foto ? `/${user.foto}` : "/vercel.svg"}
                      alt="Foto Profil"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.name || "-"}
                    </h2>
                    {user.registration_id && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-medium text-gray-700">
                          {user.registration_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <a
                  href="/peserta/profil/edit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  Edit Profil
                </a>
              </div>
            </div>

            {/* Personal Information Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Informasi Pribadi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {user.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Usia</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {computeAge(user.tanggal_lahir || "")}
                  </p>
                </div>
                {/* Tampilkan field berdasarkan kewarganegaraan */}
                {user.nationality === "WNI" ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Kewarganegaraan</p>
                      <p className="mt-1 font-medium text-gray-900">
                        WNI
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">NIK (Nomor Induk Kependudukan)</p>
                      <p className="mt-1 font-medium text-gray-900">
                        {user.nik || "-"}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Kewarganegaraan</p>
                      <p className="mt-1 font-medium text-gray-900">
                        {user.nationality || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nomor Passport</p>
                      <p className="mt-1 font-medium text-gray-900">
                        {user.passport || "-"}
                      </p>
                    </div>
                  </>
                )}
                <div>
                  <p className="text-sm text-gray-500">Jenjang</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {user.jenjang || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jurusan</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {user.jurusan || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Jenis Kelamin</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {user.jenis_kelamin || "-"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Tempat, Tanggal Lahir</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {user.tempat_lahir || "-"}{" "}
                    {user.tanggal_lahir
                      ? `, ${formatDate(user.tanggal_lahir)}`
                      : ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        user.is_verified
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user.is_verified ? "Aktif" : "Belum Terverifikasi"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Bergabung</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {user.createdAt ? formatDate(user.createdAt) : "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Address / School Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Alamat & Sekolah
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Asal Sekolah</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {user.asal_sekolah || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Provinsi Sekolah</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {user.provinsi_sekolah || "-"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Alamat</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {user.alamat || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Test History Card */}
            <RecentTestHistory userId={user.id} />
          </div>
        )}

        {activeTab === "hasil-tes" && (
          <div>
            {loadingHasilTes ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Memuat hasil tes...</p>
              </div>
            ) : errorHasilTes ? (
              <div className="text-center py-10 text-red-700">
                <p>{errorHasilTes}</p>
              </div>
            ) : hasilTes.length > 0 ? (
              <div>
                {hasilTes.map((tes, index) => {
                  const percent =
                    tes?.maxScore && tes.maxScore > 0
                      ? Math.round((tes.score / tes.maxScore) * 100)
                      : null;
                  const scoreColor =
                    percent === null
                      ? "bg-gray-100 text-gray-800"
                      : percent >= 80
                      ? "bg-green-100 text-green-800"
                      : percent >= 60
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800";

                  return (
                    <div
                      key={index}
                      className="group relative mb-6 rounded-2xl border border-gray-200/70 bg-white/80 p-6 md:p-8 shadow-sm ring-1 ring-black/5 min-h-[260px] md:min-h-[300px]"
                    >
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-px" />

                      <div className="space-y-6">
                        {/* Header row with title/badges and actions */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="text-lg md:text-xl font-semibold tracking-tight text-gray-900">
                              {tes.testName || "Tes"}
                            </h4>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${scoreColor} ring-1 ring-black/5`}
                              >
                                <Trophy className="h-3.5 w-3.5" />
                                {`Skor: ${tes.score ?? "-"}${
                                  tes?.maxScore ? "/" + tes.maxScore : ""
                                }${percent !== null ? ` (${percent}%)` : ""}`}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {`${tes?.date ? formatDate(tes.date) : "-"}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs md:text-sm font-medium text-white shadow-sm ring-1 ring-emerald-600/10 transition hover:bg-emerald-700 hover:shadow"
                              onClick={() => downloadSingleResultPdf(tes)}
                            >
                              <FileDown className="h-4 w-4" />
                              Unduh PDF
                            </button>
                            <a
                              href={`/peserta/hasil-tes/${tes.id}`}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs md:text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
                            >
                              Lihat Detail
                              <ArrowRight className="h-4 w-4" />
                            </a>
                          </div>
                        </div>

                        {/* Progress bars - full width */}
                        <div className="space-y-4">
                          {percent !== null && (
                            <div>
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Skor</span>
                                <span className="font-medium text-gray-700">
                                  {percent}%
                                </span>
                              </div>
                              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={`h-full rounded-full ${
                                    percent >= 80
                                      ? "bg-emerald-500"
                                      : percent >= 60
                                      ? "bg-yellow-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {typeof tes?.durationSpentSec === "number" &&
                          tes?.testDuration ? (
                            <div>
                              {(() => {
                                const totalSec = (tes.testDuration || 0) * 60;
                                const used = Math.max(
                                  0,
                                  Math.min(totalSec, tes.durationSpentSec || 0)
                                );
                                const usedPct =
                                  totalSec > 0
                                    ? Math.round((used / totalSec) * 100)
                                    : 0;
                                return (
                                  <>
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                      <span>Pemakaian Waktu</span>
                                      <span className="font-medium text-gray-700">
                                        {formatDuration(used)} /{" "}
                                        {tes.testDuration} menit
                                      </span>
                                    </div>
                                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                      <div
                                        className="h-full rounded-full bg-blue-500"
                                        style={{
                                          width: `${Math.min(100, usedPct)}%`,
                                        }}
                                      />
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          ) : null}
                        </div>

                        {/* Metrics - full width */}
                        <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-4">
                          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-5 py-4 md:px-6 md:py-5">
                            <div className="rounded-lg bg-white p-2 text-gray-500 shadow-sm ring-1 ring-gray-200">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-gray-500">Benar</div>
                              <div className="font-semibold text-gray-900">
                                {tes?.correctAnswers ?? 0}/
                                {tes?.totalQuestions ?? 0}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-5 py-4 md:px-6 md:py-5">
                            <div className="rounded-lg bg-white p-2 text-gray-500 shadow-sm ring-1 ring-gray-200">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-gray-500">
                                Waktu Pengerjaan
                              </div>
                              <div className="font-semibold text-gray-900">
                                {formatDuration(tes?.durationSpentSec)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 px-5 py-4 md:px-6 md:py-5">
                            <div className="rounded-lg bg-white p-2 text-gray-500 shadow-sm ring-1 ring-gray-200">
                              <Timer className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-gray-500">Durasi Tes</div>
                              <div className="font-semibold text-gray-900">
                                {tes?.testDuration != null
                                  ? `${tes.testDuration} menit`
                                  : "-"}
                              </div>
                            </div>
                          </div>

                          {typeof tes?.totalQuestions === "number" &&
                          typeof tes?.durationSpentSec === "number" &&
                          tes.durationSpentSec > 0 ? (
                            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 md:px-5 md:py-4">
                              <div className="rounded-lg bg-white p-2 text-gray-500 shadow-sm ring-1 ring-gray-200">
                                <Gauge className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="text-gray-500">Kecepatan</div>
                                <div className="font-semibold text-gray-900">
                                  {(() => {
                                    const spm =
                                      tes.durationSpentSec > 0
                                        ? tes.totalQuestions /
                                          (tes.durationSpentSec / 60)
                                        : 0;
                                    const value =
                                      spm >= 10
                                        ? Math.round(spm).toString()
                                        : spm.toFixed(1);
                                    return `${value} soal/menit`;
                                  })()}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="hidden sm:block" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>Belum ada hasil tes yang tersedia.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RecentTestHistory({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `/api/test-sessions?userId=${encodeURIComponent(userId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Gagal mengambil data");
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setItems(list.slice(0, 3));
      } catch (e: any) {
        setError(e.message || "Gagal memuat data");
      } finally {
        setLoading(false);
      }
    };
    if (userId) load();
  }, [userId]);

  const fmt = (d: string) =>
    d ? new Date(d).toLocaleString("id-ID", { dateStyle: "long" }) : "-";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold text-gray-900">
          Riwayat Tes Terakhir
        </h3>
      </div>
      {loading ? (
        <p className="text-gray-500">Memuat...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Belum ada riwayat tes.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((it) => {
            const when =
              it.endTime ||
              it.completedAt ||
              it.updatedAt ||
              it.createdAt ||
              it.startTime;
            const scoreText =
              it.score != null
                ? `Skor: ${it.score}${it.maxScore ? `/${it.maxScore}` : ""}`
                : it.status;
            const statusNorm =
              it.status === "COMPLETED" ? "FINISHED" : it.status;
            const badgeColor =
              statusNorm === "FINISHED"
                ? "bg-green-50 text-green-700"
                : statusNorm === "ONGOING"
                ? "bg-yellow-50 text-yellow-700"
                : "bg-gray-50 text-gray-700";
            return (
              <li
                key={it.id}
                className="py-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {it.test?.name || it.testName || "Tes"}
                  </p>
                  <p className="text-sm text-gray-500">{fmt(when)}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${badgeColor}`}
                  >
                    {scoreText}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
