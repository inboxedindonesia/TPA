"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PesertaHeader from "@/app/components/PesertaHeader";

export default function EditProfilePage() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setLoading(false);
          return;
        }
        const response = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const userData = await response.json();
          setFormData((prev) => ({ ...prev, ...userData.user }));
        }
      } catch {}
      setLoading(false);
    };
    fetchUserProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setError("Password saat ini diperlukan untuk mengubah password");
        setSaving(false);
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("Password baru dan konfirmasi password tidak cocok");
        setSaving(false);
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("Password baru minimal 6 karakter");
        setSaving(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        nim: formData.nim,
        fakultas: formData.fakultas,
        prodi: formData.prodi,
        tempat_lahir: formData.tempat_lahir,
        tanggal_lahir: formData.tanggal_lahir,
        jenis_kelamin: formData.jenis_kelamin,
        phone: formData.phone,
        alamat: formData.alamat,
        agama: formData.agama,
        angkatan: formData.angkatan,
        tahun_masuk: formData.tahun_masuk,
      };
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });
      if (response.ok) {
        router.push("/peserta/profil");
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Gagal memperbarui profil");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memperbarui profil");
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar?")) return;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("/api/auth/logout", {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PesertaHeader handleLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">Edit Profil</h1>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Nama
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                NIM
              </label>
              <input
                type="text"
                name="nim"
                value={formData.nim}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Fakultas
              </label>
              <input
                type="text"
                name="fakultas"
                value={formData.fakultas}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Prodi
              </label>
              <input
                type="text"
                name="prodi"
                value={formData.prodi}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Tempat Lahir
              </label>
              <input
                type="text"
                name="tempat_lahir"
                value={formData.tempat_lahir}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Tanggal Lahir
              </label>
              <input
                type="date"
                name="tanggal_lahir"
                value={formData.tanggal_lahir}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Jenis Kelamin
              </label>
              <input
                type="text"
                name="jenis_kelamin"
                value={formData.jenis_kelamin}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                No. HP
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Alamat
              </label>
              <input
                type="text"
                name="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Agama
              </label>
              <input
                type="text"
                name="agama"
                value={formData.agama}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Angkatan
              </label>
              <input
                type="text"
                name="angkatan"
                value={formData.angkatan}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Tahun Masuk
              </label>
              <input
                type="text"
                name="tahun_masuk"
                value={formData.tahun_masuk}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Password Saat Ini
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Password Baru
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-1">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
