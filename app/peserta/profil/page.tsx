"use client";

import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import { useRouter } from "next/navigation";
import PesertaHeader from "../../components/PesertaHeader";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
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
        const response = await fetch("/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
          setFormData({
            name: userData.user.name || "",
            email: userData.user.email || "",
            nim: userData.user.nim || "",
            fakultas: userData.user.fakultas || "",
            prodi: userData.user.prodi || "",
            tempat_lahir: userData.user.tempat_lahir || "",
            tanggal_lahir: userData.user.tanggal_lahir || "",
            jenis_kelamin: userData.user.jenis_kelamin || "",
            phone: userData.user.phone || "",
            alamat: userData.user.alamat || "",
            agama: userData.user.agama || "",
            angkatan: userData.user.angkatan || "",
            tahun_masuk: userData.user.tahun_masuk || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });
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

  const handleLogout = () => {
    if (!confirm("Apakah Anda yakin ingin keluar?")) return;
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
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900 ">
                Informasi Pribadi
              </h3>
              <a
                href="/peserta/profil/edit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                Edit Profil
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Nama:</span>
                <span className="ml-2 text-gray-900">{user.name || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{user.email || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">NIM:</span>
                <span className="ml-2 text-gray-900">{user.nim || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Fakultas:</span>
                <span className="ml-2 text-gray-900">
                  {user.fakultas || "-"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Prodi:</span>
                <span className="ml-2 text-gray-900">{user.prodi || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Tempat, Tanggal Lahir:
                </span>
                <span className="ml-2 text-gray-900">
                  {user.tempat_lahir || "-"},{" "}
                  {user.tanggal_lahir ? formatDate(user.tanggal_lahir) : "-"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Jenis Kelamin:
                </span>
                <span className="ml-2 text-gray-900">
                  {user.jenis_kelamin || "-"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">No. HP:</span>
                <span className="ml-2 text-gray-900">{user.phone || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Alamat:</span>
                <span className="ml-2 text-gray-900">{user.alamat || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Agama:</span>
                <span className="ml-2 text-gray-900">{user.agama || "-"}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Angkatan:</span>
                <span className="ml-2 text-gray-900">
                  {user.angkatan || "-"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Tahun Masuk:</span>
                <span className="ml-2 text-gray-900">
                  {user.tahun_masuk || "-"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Role:</span>
                <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {user.role || "-"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Bergabung:</span>
                <span className="ml-2 text-gray-900">
                  {user.createdAt ? formatDate(user.createdAt) : "-"}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Akun</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Aktif
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    ID Pengguna:
                  </span>
                  <span className="ml-2 text-gray-900">{user.id}</span>
                </div>
              </div>
            </div>
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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Daftar Hasil Tes
                  </h3>
                  <button
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                    onClick={() => {
                      const doc = new jsPDF();
                      doc.setFontSize(16);
                      doc.text("Hasil Tes TPA Peserta", 10, 15);
                      doc.setFontSize(12);
                      let y = 30;
                      if (hasilTes.length === 0) {
                        doc.text("Belum ada hasil tes.", 10, y);
                      } else {
                        hasilTes.forEach((r, i) => {
                          doc.text(
                            `${i + 1}. ${r.testName || "Tes"} | Skor: ${
                              r.score ?? "-"
                            } | Tanggal: ${r.date ? formatDate(r.date) : "-"}`,
                            10,
                            y
                          );
                          y += 10;
                          if (y > 270) {
                            doc.addPage();
                            y = 20;
                          }
                        });
                      }
                      doc.save("hasil-tes-tpa.pdf");
                    }}
                  >
                    Generate Hasil Tes
                  </button>
                </div>
                {hasilTes.map((tes, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-4 mb-4"
                  >
                    <p>
                      <strong>Nama Tes:</strong> {tes.testName}
                    </p>
                    <p>
                      <strong>Skor:</strong> {tes.score}
                    </p>
                    <p>
                      <strong>Tanggal:</strong> {formatDate(tes.date)}
                    </p>
                  </div>
                ))}
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
