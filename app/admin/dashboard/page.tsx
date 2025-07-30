"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminHeader from "@/app/components/AdminHeader";
import {
  BookOpen,
  Users,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  LogOut,
  GraduationCap,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [error, setError] = useState("");

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

    updateTime(); // Set initial time
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/dashboard");

      if (!response.ok) {
        throw new Error("Gagal mengambil data dashboard");
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Gagal memuat data dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewTest = (testId: string) => {
    // Navigate to test detail page
    console.log(`Viewing test: ${testId}`);
  };

  const handleEditTest = (testId: string) => {
    // Navigate to edit test page
    console.log(`Editing test: ${testId}`);
  };

  const handleDeleteTest = (testId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tes ini?")) {
      console.log(`Deleting test: ${testId}`);
    }
  };

  const handleViewStats = (type: string) => {
    console.log(`Navigating to stats page for: ${type}`);
    // Navigate to detailed stats page
    switch (type) {
      case "peserta":
        window.location.href = "/admin/stats/peserta";
        break;
      case "soal":
        window.location.href = "/admin/stats/soal";
        break;
      case "tes":
        window.location.href = "/admin/stats/tes";
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
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
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Data tidak ditemukan
          </h3>
          <p className="text-gray-600 mb-4">
            Tidak dapat memuat data dashboard
          </p>
          <button
            onClick={fetchDashboardData}
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
          <div
            className="stats-card cursor-pointer"
            onClick={() => handleViewStats("peserta")}
            title="Klik untuk melihat halaman detail statistik peserta"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Peserta
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.totalPeserta.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div
            className="stats-card cursor-pointer"
            onClick={() => handleViewStats("soal")}
            title="Klik untuk melihat halaman detail statistik soal"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Soal</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.totalSoal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div
            className="stats-card cursor-pointer"
            onClick={() => handleViewStats("tes")}
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tes Aktif</p>
                <p className="text-3xl font-bold text-gray-900">
                  {dashboardData.tesAktif}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("soal")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "soal"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Kelola Soal
              </button>
              <button
                onClick={() => setActiveTab("tes")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "tes"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Kelola Tes
              </button>
            </nav>
          </div>
        </div>

        {/* Content berdasarkan tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="card p-6 hover-lift">
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <BookOpen className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Belum Ada Tes
                </h3>
                <p className="text-gray-600 mb-6">
                  Saat ini belum ada tes yang dibuat. Klik tombol di bawah untuk
                  membuat tes pertama.
                </p>
                <Link
                  href="/admin/tes/create"
                  className="btn-primary flex items-center mx-auto w-fit"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Tes Pertama
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "soal" && (
          <div className="card p-6 hover-lift">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Kelola Soal
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Total {dashboardData.totalSoal} soal •{" "}
                  {dashboardData.soalCategories || 0} kategori •{" "}
                  {dashboardData.soalDifficulties || 0} tingkat kesulitan
                </p>
              </div>
              <div className="flex space-x-4">
                <Link
                  href="/admin/soal/create"
                  className="btn-primary flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Soal
                </Link>
                <Link
                  href="/admin/soal/bank-soal"
                  className="btn-secondary flex items-center"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Bank Soal
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Total Soal</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {dashboardData.totalSoal}
                </p>
                <p className="text-sm text-blue-700">
                  {dashboardData.soalBaru || 0} soal baru bulan ini
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Kategori</h4>
                <p className="text-2xl font-bold text-green-600">
                  {dashboardData.soalCategories || 0}
                </p>
                <p className="text-sm text-green-700">
                  {dashboardData.soalCategoryList || "Belum ada kategori"}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900">
                  Tingkat Kesulitan
                </h4>
                <p className="text-2xl font-bold text-purple-600">
                  {dashboardData.soalDifficulties || 0}
                </p>
                <p className="text-sm text-purple-700">
                  {dashboardData.soalDifficultyList ||
                    "Belum ada tingkat kesulitan"}
                </p>
              </div>
            </div>
            <p className="text-gray-600">
              Kelola soal-soal TPA untuk berbagai mata pelajaran dan tingkat
              kesulitan. Sistem mendukung berbagai jenis soal termasuk pilihan
              ganda, esai, dan soal numerik.
            </p>
          </div>
        )}

        {activeTab === "tes" && (
          <div className="card p-6 hover-lift">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Kelola Tes
              </h2>
              <Link
                href="/admin/tes/create"
                className="btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Tes Baru
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900">Tes Aktif</h4>
                <p className="text-2xl font-bold text-yellow-600">
                  {dashboardData.tesAktif}
                </p>
                <p className="text-sm text-yellow-700">
                  {dashboardData.tesBaru || 0} tes baru bulan ini
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900">Tes Nonaktif</h4>
                <p className="text-2xl font-bold text-red-600">
                  {dashboardData.tesNonaktif || 0}
                </p>
                <p className="text-sm text-red-700">Dalam persiapan</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-900">Total Peserta</h4>
                <p className="text-2xl font-bold text-indigo-600">
                  {dashboardData.totalPeserta}
                </p>
                <p className="text-sm text-indigo-700">
                  +{dashboardData.pesertaBaru || 0} peserta bulan ini
                </p>
              </div>
            </div>
            <p className="text-gray-600">
              Buat dan kelola tes TPA dengan berbagai konfigurasi dan jadwal.
              Sistem mendukung tes dengan durasi fleksibel, soal acak, dan
              pengaturan tingkat kesulitan yang dapat disesuaikan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
