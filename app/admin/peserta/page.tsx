"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PesertaDetailModal from "@/components/PesertaDetailModal";
import AdminHeader from "@/app/components/AdminHeader";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  ArrowLeft,
  UserPlus,
  EyeOff,
  X,
} from "lucide-react";
import FeedbackModal from "@/app/components/FeedbackModal";

export default function AdminPeserta() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [pesertaData, setPesertaData] = useState<any>(null);
  const [searchPeserta, setSearchPeserta] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // State untuk modal feedback
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: "info" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  // State untuk modal konfirmasi delete
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    pesertaId: "",
    pesertaName: "",
  });

  // State untuk modal create peserta
  const [createModal, setCreateModal] = useState({
    isOpen: false,
  });

  // State untuk form create
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchPesertaData();
  }, []);

  const fetchPesertaData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/stats/peserta");
      if (!response.ok) {
        throw new Error("Gagal mengambil data peserta");
      }
      const data = await response.json();
      setPesertaData(data);
    } catch (error) {
      console.error("Error fetching peserta data:", error);
      setError("Gagal memuat data peserta");
    } finally {
      setIsLoading(false);
    }
  };

  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    peserta: null as any,
    testResults: [] as any[],
  });

  const handleViewPeserta = async (peserta: any) => {
    // Fetch detail peserta & test results
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://tpa-seven.vercel.app";
    const res = await fetch(
      `${baseUrl}/api/admin/stats/peserta?id=${peserta.id}`,
      { credentials: "include" }
    );
    if (!res.ok) return;
    const data = await res.json();
    setDetailModal({
      isOpen: true,
      peserta: data.peserta,
      testResults: data.testResults || [],
    });
  };

  const closeDetailModal = () =>
    setDetailModal({ isOpen: false, peserta: null, testResults: [] });

  const handleEditPeserta = (peserta: any) => {
    // Implementasi edit peserta
    console.log("Edit peserta:", peserta);
  };

  const handleDeletePeserta = async (peserta: any) => {
    setDeleteModal({
      isOpen: true,
      pesertaId: peserta.id,
      pesertaName: peserta.name,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      pesertaId: "",
      pesertaName: "",
    });
  };

  const confirmDeletePeserta = async () => {
    try {
      // Implementasi delete peserta
      console.log("Deleting peserta:", deleteModal.pesertaId);

      setFeedbackModal({
        isOpen: true,
        type: "success",
        title: "Berhasil",
        message: "Peserta berhasil dihapus",
      });

      closeDeleteModal();
      fetchPesertaData(); // Refresh data
    } catch (error) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Gagal",
        message: "Gagal menghapus peserta",
      });
    }
  };

  const openCreateModal = () => {
    setCreateModal({ isOpen: true });
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const closeCreateModal = () => {
    setCreateModal({ isOpen: false });
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Validasi Error",
        message: "Nama harus diisi",
      });
      return false;
    }

    if (!formData.email.trim()) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Validasi Error",
        message: "Email harus diisi",
      });
      return false;
    }

    if (!formData.email.includes("@")) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Validasi Error",
        message: "Format email tidak valid",
      });
      return false;
    }

    if (!formData.password) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Validasi Error",
        message: "Password harus diisi",
      });
      return false;
    }

    if (formData.password.length < 6) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Validasi Error",
        message: "Password minimal 6 karakter",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Validasi Error",
        message: "Konfirmasi password tidak cocok",
      });
      return false;
    }

    return true;
  };

  const handleCreatePeserta = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/peserta/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFeedbackModal({
          isOpen: true,
          type: "success",
          title: "Berhasil",
          message: "Peserta berhasil ditambahkan",
        });

        closeCreateModal();
        fetchPesertaData(); // Refresh data
      } else {
        setFeedbackModal({
          isOpen: true,
          type: "error",
          title: "Gagal",
          message: data.error || "Gagal menambahkan peserta",
        });
      }
    } catch (error) {
      console.error("Error creating peserta:", error);
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat menambahkan peserta",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Filter peserta berdasarkan search
  const filteredPeserta =
    pesertaData?.daftarPeserta?.filter(
      (peserta: any) =>
        peserta.name.toLowerCase().includes(searchPeserta.toLowerCase()) ||
        peserta.email.toLowerCase().includes(searchPeserta.toLowerCase())
    ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data peserta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Terjadi kesalahan
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPesertaData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader currentTime={currentTime} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manajemen Peserta
              </h1>
              <p className="text-gray-600 mt-1">Kelola data peserta TPA</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari peserta..."
                value={searchPeserta}
                onChange={(e) => setSearchPeserta(e.target.value)}
                className="pl-8 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Peserta
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Peserta
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {pesertaData?.totalPeserta?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Peserta Aktif
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {pesertaData?.pesertaAktif || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Rata-rata Skor
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {pesertaData?.rataRataSkor || "0.0"}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Peserta Baru
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {pesertaData?.pesertaBaru || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Peserta Table */}
        <div className="bg-white rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Daftar Peserta
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tes Diikuti
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rata-rata Skor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Bergabung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPeserta.length > 0 ? (
                  filteredPeserta.map((peserta: any) => (
                    <tr
                      key={peserta.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {peserta.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {peserta.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            peserta.status === "Aktif"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {peserta.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {peserta.totalTests}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {peserta.averageScore}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(peserta.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewPeserta(peserta)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                          </button>
                          <button
                            onClick={() => handleEditPeserta(peserta)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                          </button>
                          <button
                            onClick={() => handleDeletePeserta(peserta)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {searchPeserta
                        ? "Tidak ada peserta yang sesuai dengan pencarian"
                        : "Belum ada data peserta"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Peserta Detail Modal */}
      <PesertaDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        peserta={detailModal.peserta}
        testResults={detailModal.testResults}
      />

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Konfirmasi Hapus
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Apakah Anda yakin ingin menghapus peserta{" "}
                  <span className="font-semibold">
                    {deleteModal.pesertaName}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDeletePeserta}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Peserta Modal */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Tambah Peserta Baru
              </h3>
              <button
                onClick={closeCreateModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleCreatePeserta}
              className="space-y-4"
            >
              {/* Nama */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Masukkan email"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimal 6 karakter</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Konfirmasi Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Konfirmasi password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Tambah Peserta
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
      />
    </div>
  );
}
