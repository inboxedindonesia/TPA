// The pagination UI for Tes and Peserta should be placed inside the AdminDashboard component's return statement, after the relevant tables.
"use client";

import { useState, useEffect } from "react";
import PesertaDetailModal from "./PesertaDetailModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QuestionDetailModal from "@/app/components/QuestionDetailModal";
import {
  FileText,
  Clock,
  Users,
  Plus,
  Settings,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  BarChart3,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import AdminHeader from "../../components/AdminHeader";
import FeedbackModal from "../../components/FeedbackModal";
import TesDetailModal from "../../components/TesDetailModal";

interface DashboardData {
  totalSoal: number;
  totalPeserta: number;
  tesAktif: number;
  tesNonaktif: number;
  totalPesertaTes: number;
  rataRataDurasi: string;
  rataRataSkor: string;
  tesList: any[];
  daftarPeserta?: any[];
  daftarSoal?: any[];
  recentActivities?: any[];
}

export default function AdminDashboard() {
  // Pagination state for Tes and Peserta
  const [tesPage, setTesPage] = useState(1);
  const [tesTotalPages, setTesTotalPages] = useState(1);
  const [pesertaPage, setPesertaPage] = useState(1);
  const [pesertaTotalPages, setPesertaTotalPages] = useState(1);

  // Pagination handlers
  const handlePrevTesPage = () => {
    if (tesPage > 1) setTesPage(tesPage - 1);
  };
  const handleNextTesPage = () => {
    if (tesPage < tesTotalPages) setTesPage(tesPage + 1);
  };
  const handlePrevPesertaPage = () => {
    if (pesertaPage > 1) setPesertaPage(pesertaPage - 1);
  };
  const handleNextPesertaPage = () => {
    if (pesertaPage < pesertaTotalPages) setPesertaPage(pesertaPage + 1);
  };

  // Fetch paginated Tes data
  useEffect(() => {
    const fetchTesData = async () => {
      try {
        const res = await fetch(`/api/admin/stats/tes?page=${tesPage}`);
        if (res.ok) {
          const data = await res.json();
          setDashboardData((prev) => ({
            ...prev,
            tesList: data.tesList || [],
          }));
          setTesTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        // handle error
      }
    };
    fetchTesData();
  }, [tesPage]);

  // Fetch paginated Peserta data
  useEffect(() => {
    const fetchPesertaData = async () => {
      try {
        const res = await fetch(`/api/admin/stats/peserta?page=${pesertaPage}`);
        if (res.ok) {
          const data = await res.json();
          setDashboardData((prev) => ({
            ...prev,
            daftarPeserta: data.daftarPeserta || [],
          }));
          setPesertaTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        // handle error
      }
    };
    fetchPesertaData();
  }, [pesertaPage]);
  // Navigasi halaman soal
  const handlePrevSoalPage = () => {
    if (soalPage > 1) setSoalPage(soalPage - 1);
  };
  const handleNextSoalPage = () => {
    if (soalPage < soalTotalPages) setSoalPage(soalPage + 1);
  };
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalSoal: 0,
    totalPeserta: 0,
    tesAktif: 0,
    tesNonaktif: 0,
    totalPesertaTes: 0,
    rataRataDurasi: "0",
    rataRataSkor: "0.0",
    tesList: [],
    daftarPeserta: [],
    daftarSoal: [],
    recentActivities: [],
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [activeStats, setActiveStats] = useState("");
  const [searchTes, setSearchTes] = useState("");
  const [searchSoal, setSearchSoal] = useState("");
  const [soalPage, setSoalPage] = useState(1);
  const [soalTotalPages, setSoalTotalPages] = useState(1);
  const [searchPeserta, setSearchPeserta] = useState("");
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: "success" as "success" | "error" | "warning",
    title: "",
    message: "",
  });

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: "" as "soal" | "tes",
    item: null as any,
    title: "",
    message: "",
  });

  const [viewSoalModal, setViewSoalModal] = useState({
    isOpen: false,
    question: null as any,
  });
  const [tesDetailModal, setTesDetailModal] = useState({
    isOpen: false,
    tes: null as any,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData(soalPage);

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(soalPage);
    }, 30000);

    return () => clearInterval(interval);
  }, [soalPage]);

  const fetchDashboardData = async (page = soalPage) => {
    try {
      const [
        dashboardResponse,
        pesertaResponse,
        soalResponse,
        activitiesResponse,
      ] = await Promise.all([
        fetch("/api/admin/dashboard"),
        fetch("/api/admin/stats/peserta"),
        fetch(`/api/admin/stats/soal?page=${page}`),
        fetch("/api/admin/activities?limit=5"),
      ]);

      if (
        dashboardResponse.ok &&
        pesertaResponse.ok &&
        soalResponse.ok &&
        activitiesResponse.ok
      ) {
        const dashboardData = await dashboardResponse.json();
        const pesertaData = await pesertaResponse.json();
        const soalData = await soalResponse.json();
        const activitiesData = await activitiesResponse.json();

        const updatedData = {
          ...dashboardData,
          daftarPeserta: pesertaData.daftarPeserta || [],
          daftarSoal: Array.isArray(soalData.daftarSoal)
            ? soalData.daftarSoal
            : [],
          recentActivities: activitiesData.activities || [],
        };

        setSoalTotalPages(soalData.totalPages || 1);
        setDashboardData(updatedData);
        // Navigasi halaman soal
        const handlePrevSoalPage = () => {
          if (soalPage > 1) setSoalPage(soalPage - 1);
        };
        const handleNextSoalPage = () => {
          if (soalPage < soalTotalPages) setSoalPage(soalPage + 1);
        };
      } else {
        console.error("Error fetching dashboard data");
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleViewSoal = async (soal: any) => {
    try {
      // Fetch detail soal dari API
      const response = await fetch(`/api/admin/soal/${soal.id}`);
      if (response.ok) {
        const questionData = await response.json();
        setViewSoalModal({
          isOpen: true,
          question: questionData,
        });
      } else {
        setFeedbackModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: "Gagal memuat detail soal",
        });
      }
    } catch (error) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Gagal membuka detail soal",
      });
    }
  };

  const handleEditSoal = async (soal: any) => {
    try {
      // Navigasi ke halaman edit soal
      router.push(`/admin/soal/edit/${soal.id}`);
    } catch (error) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Gagal membuka halaman edit soal",
      });
    }
  };

  const handleDeleteSoal = (soal: any) => {
    // Tampilkan konfirmasi modal
    setDeleteModal({
      isOpen: true,
      type: "soal",
      item: soal,
      title: "Konfirmasi Hapus Soal",
      message: `Apakah Anda yakin ingin menghapus soal "${soal.question.substring(
        0,
        50
      )}..."?`,
    });
  };

  const confirmDeleteSoal = async () => {
    try {
      const soal = deleteModal.item;

      const response = await fetch(`/api/admin/soal/${soal.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseData = await response.text();

      if (response.ok) {
        setFeedbackModal({
          isOpen: true,
          type: "success",
          title: "Berhasil",
          message: "Soal berhasil dihapus",
        });
        // Refresh data
        fetchDashboardData();
      } else {
        const errorData = JSON.parse(responseData);
        setFeedbackModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: errorData.error || "Gagal menghapus soal",
        });
      }
    } catch (error) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Terjadi kesalahan saat menghapus soal",
      });
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  const handleViewTes = (tes: any) => {
    setTesDetailModal({ isOpen: true, tes });
  };

  const handleEditTes = async (tes: any) => {
    try {
      // Navigasi ke halaman edit tes
      router.push(`/admin/tes/edit/${tes.id}`);
    } catch (error) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Gagal membuka halaman edit tes",
      });
    }
  };

  const handleDeleteTes = (tes: any) => {
    // Tampilkan konfirmasi modal
    setDeleteModal({
      isOpen: true,
      type: "tes",
      item: tes,
      title: "Konfirmasi Hapus Tes",
      message: `Apakah Anda yakin ingin menghapus tes "${tes.nama}"?`,
    });
  };

  const confirmDeleteTes = async () => {
    try {
      const tes = deleteModal.item;
      const response = await fetch(`/api/admin/tes/${tes.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFeedbackModal({
          isOpen: true,
          type: "success",
          title: "Berhasil",
          message: "Tes berhasil dihapus",
        });
        // Refresh data
        fetchDashboardData();
      } else {
        setFeedbackModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: "Gagal menghapus tes",
        });
      }
    } catch (error) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Terjadi kesalahan saat menghapus tes",
      });
    } finally {
      setDeleteModal({ ...deleteModal, isOpen: false });
    }
  };

  // Modal detail peserta
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    peserta: null as any,
    testResults: [] as any[],
  });

  const handleViewPeserta = async (peserta: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    try {
      const res = await fetch(
        `${baseUrl}/api/admin/stats/peserta?id=${peserta.id}`,
        { credentials: "include" }
      );
      if (!res.ok) {
        setFeedbackModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: "Gagal mengambil detail peserta",
        });
        return;
      }
      const data = await res.json();
      setDetailModal({
        isOpen: true,
        peserta: data.peserta,
        testResults: data.testResults || [],
      });
    } catch (error) {
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Gagal membuka detail peserta",
      });
    }
  };

  const closeDetailModal = () =>
    setDetailModal({ isOpen: false, peserta: null, testResults: [] });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader currentTime={currentTime.toLocaleString("id-ID")} />

      {/* Modal Detail Peserta */}
      <PesertaDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        peserta={detailModal.peserta}
        testResults={detailModal.testResults}
      />

      <TesDetailModal
        isOpen={tesDetailModal.isOpen}
        onClose={() => setTesDetailModal({ isOpen: false, tes: null })}
        tes={tesDetailModal.tes}
      />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-8">
          {/* Overview Card */}
          <div
            className={`rounded-lg p-4 cursor-pointer transition-all duration-300 ${
              !activeStats && activeTab === "overview"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-900 hover:shadow-md"
            }`}
            onClick={() => {
              setActiveTab("overview");
              setActiveStats("");
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-2 rounded-lg mb-2 ${
                  !activeStats && activeTab === "overview"
                    ? "bg-white text-blue-500"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3
                className={`text-sm font-semibold ${
                  !activeStats && activeTab === "overview"
                    ? "text-white"
                    : "text-gray-900"
                }`}
              >
                Overview
              </h3>
              <p
                className={`text-xs mt-1 ${
                  !activeStats && activeTab === "overview"
                    ? "text-blue-100"
                    : "text-gray-600"
                }`}
              >
                Dashboard Utama
              </p>
            </div>
          </div>

          {/* Kelola Soal Card */}
          <div
            className={`rounded-lg p-4 cursor-pointer transition-all duration-300 ${
              !activeStats && activeTab === "soal"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-900 hover:shadow-md"
            }`}
            onClick={() => {
              setActiveTab("soal");
              setActiveStats("");
              fetchDashboardData();
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-2 rounded-lg mb-2 ${
                  !activeStats && activeTab === "soal"
                    ? "bg-white text-blue-500"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <h3
                className={`text-sm font-semibold ${
                  !activeStats && activeTab === "soal"
                    ? "text-white"
                    : "text-gray-900"
                }`}
              >
                Kelola Soal
              </h3>
              <p
                className={`text-xs mt-1 ${
                  !activeStats && activeTab === "soal"
                    ? "text-blue-100"
                    : "text-gray-600"
                }`}
              >
                {dashboardData.totalSoal.toLocaleString()} Soal
              </p>
            </div>
          </div>

          {/* Kelola Tes Card */}
          <div
            className={`rounded-lg p-4 cursor-pointer transition-all duration-300 ${
              !activeStats && activeTab === "tes"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-900 hover:shadow-md"
            }`}
            onClick={() => {
              setActiveTab("tes");
              setActiveStats("");
              fetchDashboardData();
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-2 rounded-lg mb-2 ${
                  !activeStats && activeTab === "tes"
                    ? "bg-white text-blue-500"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <h3
                className={`text-sm font-semibold ${
                  !activeStats && activeTab === "tes"
                    ? "text-white"
                    : "text-gray-900"
                }`}
              >
                Kelola Tes
              </h3>
              <p
                className={`text-xs mt-1 ${
                  !activeStats && activeTab === "tes"
                    ? "text-blue-100"
                    : "text-gray-600"
                }`}
              >
                {dashboardData.tesAktif} Tes Aktif
              </p>
            </div>
          </div>

          {/* Total Peserta Card */}
          <div
            className={`rounded-lg p-4 cursor-pointer transition-all duration-300 ${
              activeStats === "peserta"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-900 hover:shadow-md"
            }`}
            onClick={() => {
              setActiveStats("peserta");
              setActiveTab("");
              fetchDashboardData();
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-2 rounded-lg mb-2 ${
                  activeStats === "peserta"
                    ? "bg-white text-blue-500"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <h3
                className={`text-sm font-semibold ${
                  activeStats === "peserta" ? "text-white" : "text-gray-900"
                }`}
              >
                Total Peserta
              </h3>
              <p
                className={`text-xs mt-1 ${
                  activeStats === "peserta" ? "text-blue-100" : "text-gray-600"
                }`}
              >
                {dashboardData.totalPeserta.toLocaleString()} Peserta
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="transition-all duration-300 ease-in-out">
          {/* Overview Section */}
          {!activeStats && activeTab === "overview" && (
            <div className="animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Total Soal
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {dashboardData.totalSoal.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Tes Aktif
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {dashboardData.tesAktif}
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
                        Total Peserta
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {dashboardData.totalPeserta.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">
                        Rata-rata Skor
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {dashboardData.rataRataSkor}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Statistik Cepat
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Peserta Aktif
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.floor(dashboardData.totalPeserta * 0.8)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Rata-rata Durasi Tes
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData.rataRataDurasi} menit
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Tingkat Penyelesaian
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {dashboardData.rataRataSkor}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kelola Soal Section */}
          {!activeStats && activeTab === "soal" && (
            <div className="animate-fadeIn">
              <div className="card p-4 px-1 sm:px-2 lg:px-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Kelola Soal
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {dashboardData.totalSoal} soal tersedia • Bank soal untuk
                      semua kategori
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
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari soal..."
                        value={searchSoal}
                        onChange={(e) => setSearchSoal(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Daftar Soal
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Soal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kategori
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipe
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.daftarSoal &&
                        dashboardData.daftarSoal.length > 0 ? (
                          (() => {
                            const filteredSoal =
                              dashboardData.daftarSoal.filter(
                                (soal: any) =>
                                  soal.question
                                    .toLowerCase()
                                    .includes(searchSoal.toLowerCase()) ||
                                  soal.category
                                    .toLowerCase()
                                    .includes(searchSoal.toLowerCase())
                              );
                            if (filteredSoal.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="px-6 py-4 text-center text-gray-500"
                                  >
                                    {searchSoal
                                      ? "Tidak ada soal yang sesuai dengan pencarian"
                                      : "Belum ada soal yang dibuat"}
                                  </td>
                                </tr>
                              );
                            }
                            return filteredSoal.map((soal: any) => (
                              <tr
                                key={soal.id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {soal.question.length > 50
                                      ? soal.question.substring(0, 50) + "..."
                                      : soal.question}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      soal.category === "MATEMATIKA"
                                        ? "bg-blue-100 text-blue-800"
                                        : soal.category === "BAHASA_INDONESIA"
                                        ? "bg-purple-100 text-purple-800"
                                        : soal.category === "GENERAL_KNOWLEDGE"
                                        ? "bg-orange-100 text-orange-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {soal.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      soal.difficulty === "MUDAH"
                                        ? "bg-green-100 text-green-800"
                                        : soal.difficulty === "SEDANG"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : soal.difficulty === "SULIT"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {soal.difficulty}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                    Aktif
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleViewSoal(soal)}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                    </button>
                                    <button
                                      onClick={() => handleEditSoal(soal)}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSoal(soal)}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              {searchSoal
                                ? "Tidak ada soal yang sesuai dengan pencarian"
                                : "Belum ada soal yang dibuat"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination Soal */}
                  <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={handlePrevSoalPage}
                      disabled={soalPage === 1}
                      className={`px-4 py-2 rounded-md border text-sm font-medium mr-2 ${
                        soalPage === 1
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Halaman {soalPage} dari {soalTotalPages}
                    </span>
                    <button
                      onClick={handleNextSoalPage}
                      disabled={soalPage === soalTotalPages}
                      className={`px-4 py-2 rounded-md border text-sm font-medium ml-2 ${
                        soalPage === soalTotalPages
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Kelola Tes Section */}
          {!activeStats && activeTab === "tes" && (
            <div className="animate-fadeIn">
              <div className="card p-4 px-1 sm:px-2 lg:px-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Kelola Tes
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {dashboardData.tesAktif} tes aktif •{" "}
                      {dashboardData.rataRataDurasi || "0"} menit rata-rata
                      durasi • {dashboardData.rataRataSkor || "0.0"} rata-rata
                      skor
                    </p>
                  </div>
                  <div className="flex space-x-4">
                    <Link
                      href="/admin/tes/create"
                      className="btn-primary flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Buat Tes Baru
                    </Link>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari tes..."
                        value={searchTes}
                        onChange={(e) => setSearchTes(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Daftar Tes
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nama Tes
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jumlah Soal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durasi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Peserta
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(dashboardData as any).tesList &&
                        (dashboardData as any).tesList.length > 0 ? (
                          (() => {
                            const filteredTes = (
                              dashboardData as any
                            ).tesList.filter((tes: any) =>
                              tes.nama
                                .toLowerCase()
                                .includes(searchTes.toLowerCase())
                            );
                            if (filteredTes.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={6}
                                    className="px-6 py-4 text-center text-gray-500"
                                  >
                                    {searchTes
                                      ? "Tidak ada tes yang sesuai dengan pencarian"
                                      : "Belum ada tes yang dibuat"}
                                  </td>
                                </tr>
                              );
                            }
                            return filteredTes.map((tes: any) => (
                              <tr
                                key={tes.id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {tes.nama}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {tes.jumlahSoal || 0} soal
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {tes.durasi || 0} menit
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                      tes.status === "aktif"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {tes.status === "aktif"
                                      ? "Aktif"
                                      : "Nonaktif"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {tes.peserta || 0} peserta
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => handleViewTes(tes)}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                    </button>
                                    <button
                                      onClick={() => handleEditTes(tes)}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                      <Edit className="w-4 h-4 mr-1" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTes(tes)}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              Belum ada tes yang dibuat
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Total Peserta Section */}
          {activeStats === "peserta" && (
            <div className="animate-fadeIn">
              <div className="card p-4 px-1 sm:px-2 lg:px-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Statistik Peserta
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Total {dashboardData.totalPeserta.toLocaleString()}{" "}
                      peserta terdaftar
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/admin/peserta"
                      className="btn-primary flex items-center"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Kelola Peserta
                    </Link>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Cari peserta..."
                        value={searchPeserta}
                        onChange={(e) => setSearchPeserta(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Daftar Peserta
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nama
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Registration ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tes Selesai
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.daftarPeserta &&
                        dashboardData.daftarPeserta.length > 0 ? (
                          (() => {
                            const filteredPeserta =
                              dashboardData.daftarPeserta.filter(
                                (peserta: any) =>
                                  peserta.name
                                    .toLowerCase()
                                    .includes(searchPeserta.toLowerCase()) ||
                                  peserta.email
                                    .toLowerCase()
                                    .includes(searchPeserta.toLowerCase())
                              );
                            if (filteredPeserta.length === 0) {
                              return (
                                <tr>
                                  <td
                                    colSpan={5}
                                    className="px-6 py-4 text-center text-gray-500"
                                  >
                                    {searchPeserta
                                      ? "Tidak ada peserta yang sesuai dengan pencarian"
                                      : "Belum ada peserta yang terdaftar"}
                                  </td>
                                </tr>
                              );
                            }
                            return filteredPeserta.map((peserta: any) => (
                              <tr
                                key={peserta.id}
                                className="hover:bg-gray-50"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {peserta.name}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {peserta.email}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {peserta.registration_id || "-"}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                      peserta.is_verified
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {peserta.is_verified
                                      ? "Aktif"
                                      : "Belum Verifikasi"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="text-sm text-gray-900">
                                    {typeof peserta.totalTests === "number"
                                      ? peserta.totalTests
                                      : 0}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="flex space-x-2 justify-center">
                                    <button
                                      onClick={() => handleViewPeserta(peserta)}
                                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                      title="Lihat Detail Peserta"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                    </button>
                                    {/* Tambahkan aksi lain di sini jika diperlukan, misal: edit, hapus, dll */}
                                  </div>
                                </td>
                              </tr>
                            ));
                          })()
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              {searchPeserta
                                ? "Tidak ada peserta yang sesuai dengan pencarian"
                                : "Belum ada peserta yang terdaftar"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Feedback */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        autoClose={true}
      />

      {/* Modal Konfirmasi Delete */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {deleteModal.title}
                </h3>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">{deleteModal.message}</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() =>
                  setDeleteModal({ ...deleteModal, isOpen: false })
                }
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (deleteModal.type === "soal") {
                    confirmDeleteSoal();
                  } else if (deleteModal.type === "tes") {
                    confirmDeleteTes();
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Soal */}
      <QuestionDetailModal
        isOpen={viewSoalModal.isOpen}
        question={viewSoalModal.question}
        onClose={() => setViewSoalModal({ isOpen: false, question: null })}
      />
    </div>
  );
}
