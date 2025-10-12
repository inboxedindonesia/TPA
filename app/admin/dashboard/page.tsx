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
import PaginationWithSearch from "../../components/PaginationWithSearch";

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

// Format category name to be more user-friendly
const formatCategoryName = (category: string) => {
  switch (category?.toUpperCase()) {
    case "TES_VERBAL":
      return "Tes Verbal";
    case "TES_GAMBAR":
      return "Tes Gambar";
    case "TES_LOGIKA":
      return "Tes Logika";
    case "TES_ANGKA":
      return "Tes Angka";
    default:
      return (
        category?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
        category
      );
  }
};

export default function AdminDashboard() {
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
  const [selectedSoal, setSelectedSoal] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchPeserta, setSearchPeserta] = useState("");
  const [filterStatusKelulusan, setFilterStatusKelulusan] = useState("");
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

  // Navigasi halaman soal
  const handlePrevSoalPage = () => {
    if (soalPage > 1) setSoalPage(soalPage - 1);
  };
  const handleNextSoalPage = () => {
    if (soalPage < soalTotalPages) setSoalPage(soalPage + 1);
  };

  // Fetch paginated Tes data
  useEffect(() => {
    const fetchTesData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const searchParam = searchTes
          ? `&search=${encodeURIComponent(searchTes)}`
          : "";
        const res = await fetch(
          `/api/admin/stats/tes?page=${tesPage}${searchParam}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setDashboardData((prev) => ({
            ...prev,
            tesList: data.tesList || [],
            tesAktif: data.tesAktif || 0,
            rataRataDurasi: data.rataRataDurasi || "0",
            rataRataSkor: data.rataRataSkor || "0.0",
          }));
          setTesTotalPages(data.totalPages || 1);
        } else if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
        }
      } catch (err) {
        // handle error
      }
    };
    fetchTesData();
  }, [tesPage, searchTes]);

  // Fetch paginated Peserta data
  useEffect(() => {
    const fetchPesertaData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const searchParam = searchPeserta
          ? `&search=${encodeURIComponent(searchPeserta)}`
          : "";
        const statusParam = filterStatusKelulusan
          ? `&status=${encodeURIComponent(filterStatusKelulusan)}`
          : "";
        const res = await fetch(
          `/api/admin/stats/peserta?page=${pesertaPage}${searchParam}${statusParam}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setDashboardData((prev) => ({
            ...prev,
            daftarPeserta: data.daftarPeserta || [],
            totalPeserta: data.totalPeserta || 0,
            pesertaAktif: data.pesertaAktif || 0,
            pesertaBaru: data.pesertaBaru || 0,
            rataRataSkor: data.rataRataSkor || "0.0",
          }));
          setPesertaTotalPages(data.totalPages || 1);
        } else if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
        }
      } catch (err) {
        // handle error
      }
    };
    fetchPesertaData();
  }, [pesertaPage, searchPeserta, filterStatusKelulusan]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData(soalPage, searchSoal);

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData(soalPage, searchSoal);
    }, 30000);

    return () => clearInterval(interval);
  }, [soalPage, searchSoal]);

  // Reset selectAll when search changes and reset to page 1
  useEffect(() => {
    setSelectAll(false);
    setSelectedSoal([]);
    if (searchSoal) {
      setSoalPage(1); // Reset to first page when searching
    }
  }, [searchSoal]);

  const fetchDashboardData = async (page = soalPage, search = searchSoal) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Add timestamp to prevent caching
      const timestamp = Date.now();

      // Build search parameter for soal API
      const soalSearchParam = search
        ? `&search=${encodeURIComponent(search)}`
        : "";

      const headers = {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache",
      };

      const [
        dashboardResponse,
        pesertaResponse,
        soalResponse,
        activitiesResponse,
      ] = await Promise.all([
        fetch(`/api/admin/dashboard?_t=${timestamp}`, {
          cache: "no-store",
          headers,
        }),
        fetch(`/api/admin/stats/peserta?_t=${timestamp}`, {
          cache: "no-store",
          headers,
        }),
        fetch(
          `/api/admin/stats/soal?page=${page}${soalSearchParam}&_t=${timestamp}`,
          {
            cache: "no-store",
            headers,
          }
        ),
        fetch(`/api/admin/notifications/logs?limit=5&_t=${timestamp}`, {
          cache: "no-store",
          headers,
        }),
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
          recentActivities: activitiesData.notifications || [],
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
        // Check for authentication errors
        if (
          dashboardResponse.status === 401 ||
          pesertaResponse.status === 401 ||
          soalResponse.status === 401 ||
          activitiesResponse.status === 401
        ) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.push("/login");
          return;
        }
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

  // Handle checkbox selection
  const handleSelectSoal = (soalId: string) => {
    setSelectedSoal((prev) => {
      if (prev.includes(soalId)) {
        return prev.filter((id) => id !== soalId);
      } else {
        return [...prev, soalId];
      }
    });
  };

  const handleSelectAll = (filteredSoal: any[]) => {
    if (selectAll) {
      setSelectedSoal([]);
      setSelectAll(false);
    } else {
      setSelectedSoal(filteredSoal.map((soal: any) => soal.id));
      setSelectAll(true);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedSoal.length === 0) {
      setFeedbackModal({
        isOpen: true,
        type: "warning",
        title: "Peringatan",
        message: "Pilih minimal satu soal untuk dihapus",
      });
      return;
    }

    setDeleteModal({
      isOpen: true,
      type: "soal",
      item: { bulk: true, ids: selectedSoal },
      title: "Konfirmasi Hapus Soal",
      message: `Apakah Anda yakin ingin menghapus ${selectedSoal.length} soal yang dipilih?`,
    });
  };

  const confirmBulkDelete = async () => {
    try {
      const response = await fetch("/api/admin/soal/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedSoal }),
      });

      const responseData = await response.json();

      if (response.ok) {
        setFeedbackModal({
          isOpen: true,
          type: "success",
          title: "Berhasil",
          message: `${selectedSoal.length} soal berhasil dihapus`,
        });
        setSelectedSoal([]);
        setSelectAll(false);
        fetchDashboardData();
      } else {
        setFeedbackModal({
          isOpen: true,
          type: "error",
          title: "Error",
          message: responseData.error || "Gagal menghapus soal",
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
    try {
      // Use same-origin API to avoid CORS issues in production
      const res = await fetch(`/api/admin/stats/peserta?id=${peserta.id}`, {
        credentials: "include",
      });
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
                    <div className="flex items-center space-x-4">
                      {selectedSoal.length > 0 && (
                        <button
                          onClick={handleBulkDelete}
                          className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus ({selectedSoal.length})
                        </button>
                      )}
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
                </div>

                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200"></div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={
                                selectAll &&
                                dashboardData.daftarSoal &&
                                dashboardData.daftarSoal.filter(
                                  (soal: any) =>
                                    soal.question
                                      .toLowerCase()
                                      .includes(searchSoal.toLowerCase()) ||
                                    soal.category
                                      .toLowerCase()
                                      .includes(searchSoal.toLowerCase())
                                ).length > 0
                              }
                              onChange={() => {
                                const filtered = dashboardData.daftarSoal
                                  ? dashboardData.daftarSoal.filter(
                                      (soal: any) =>
                                        soal.question
                                          .toLowerCase()
                                          .includes(searchSoal.toLowerCase()) ||
                                        soal.category
                                          .toLowerCase()
                                          .includes(searchSoal.toLowerCase())
                                    )
                                  : [];
                                handleSelectAll(filtered);
                              }}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Soal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kategori
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Poin
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Level Kesulitan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipe Soal
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
                          dashboardData.daftarSoal.map((soal: any) => (
                            <tr
                              key={soal.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedSoal.includes(soal.id)}
                                  onChange={() => handleSelectSoal(soal.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className="text-sm font-medium text-gray-900 max-w-[200px] truncate"
                                  title={soal.question}
                                >
                                  {soal.question.length > 30
                                    ? `${soal.question.substring(0, 30)}...`
                                    : soal.question}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    soal.category === "TES_VERBAL"
                                      ? "bg-blue-100 text-blue-800"
                                      : soal.category === "TES_ANGKA"
                                      ? "bg-green-100 text-green-800"
                                      : soal.category === "TES_LOGIKA"
                                      ? "bg-purple-100 text-purple-800"
                                      : soal.category === "TES_GAMBAR"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {soal.category === "TES_VERBAL"
                                    ? "Tes Verbal"
                                    : soal.category === "TES_ANGKA"
                                    ? "Tes Angka"
                                    : soal.category === "TES_LOGIKA"
                                    ? "Tes Logika"
                                    : soal.category === "TES_GAMBAR"
                                    ? "Tes Gambar"
                                    : formatCategoryName(soal.category)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {soal.points || 1} poin
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    (soal.levelKesulitan || soal.difficulty) ===
                                    "MUDAH"
                                      ? "bg-green-100 text-green-800"
                                      : (soal.levelKesulitan ||
                                          soal.difficulty) === "SEDANG"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : (soal.levelKesulitan ||
                                          soal.difficulty) === "SULIT"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {(soal.levelKesulitan || soal.difficulty) ===
                                  "MUDAH"
                                    ? "Mudah"
                                    : (soal.levelKesulitan ||
                                        soal.difficulty) === "SEDANG"
                                    ? "Sedang"
                                    : (soal.levelKesulitan ||
                                        soal.difficulty) === "SULIT"
                                    ? "Sulit"
                                    : "Sedang"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                  {soal.tipeSoal === "PILIHAN_GANDA"
                                    ? "Pilihan Ganda"
                                    : soal.tipeSoal || "Pilihan Ganda"}
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
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={8}
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
                  <PaginationWithSearch
                    currentPage={soalPage}
                    totalPages={soalTotalPages}
                    onPageChange={(page) => setSoalPage(page)}
                    onPrevPage={handlePrevSoalPage}
                    onNextPage={handleNextSoalPage}
                  />
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
                  <div className="px-6 py-4 border-b border-gray-200"></div>
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
                            Periode Tes
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
                          (dashboardData as any).tesList.map((tes: any) => (
                            <tr
                              key={tes.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className="text-sm font-medium text-gray-900 max-w-[150px] truncate"
                                  title={tes.nama}
                                >
                                  {tes.nama.length > 20
                                    ? `${tes.nama.substring(0, 20)}...`
                                    : tes.nama}
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
                                <div className="text-sm text-gray-900">
                                  {tes.availableFrom && tes.availableUntil ? (
                                    (() => {
                                      const endDate = new Date(
                                        tes.availableUntil
                                      );
                                      const currentYear =
                                        new Date().getFullYear();
                                      // Jika tahun berakhir >= 2099 atau lebih dari 50 tahun dari sekarang, anggap tidak terbatas
                                      if (
                                        endDate.getFullYear() >= 2099 ||
                                        endDate.getFullYear() > currentYear + 50
                                      ) {
                                        return (
                                          <span className="text-gray-900">
                                            Tidak terbatas
                                          </span>
                                        );
                                      }
                                      return (
                                        <>
                                          <div>
                                            {new Date(
                                              tes.availableFrom
                                            ).toLocaleDateString("id-ID")}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            s/d{" "}
                                            {endDate.toLocaleDateString(
                                              "id-ID"
                                            )}
                                          </div>
                                        </>
                                      );
                                    })()
                                  ) : (
                                    <span className="text-gray-400">
                                      Tidak terbatas
                                    </span>
                                  )}
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
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              {searchTes
                                ? "Tidak ada tes yang sesuai dengan pencarian"
                                : "Belum ada tes yang dibuat"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {/* Pagination Tes */}
                    <PaginationWithSearch
                      currentPage={tesPage}
                      totalPages={tesTotalPages}
                      onPageChange={(page) => setTesPage(page)}
                      onPrevPage={handlePrevTesPage}
                      onNextPage={handleNextTesPage}
                    />
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
                    <div className="flex items-center space-x-3">
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
                      <div className="relative">
                        <select
                          value={filterStatusKelulusan}
                          onChange={(e) =>
                            setFilterStatusKelulusan(e.target.value)
                          }
                          className="pl-4 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm appearance-none bg-white w-full"
                        >
                          <option value="">Status Kelulusan</option>
                          <option value="lolos">Lolos</option>
                          <option value="tidak-lolos">Tidak Lolos</option>
                          <option value="belum-tes">Belum Tes</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200"></div>
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
                            Status Kelulusan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.daftarPeserta &&
                        dashboardData.daftarPeserta.length > 0 ? (
                          dashboardData.daftarPeserta.map((peserta: any) => (
                            <tr
                              key={peserta.id}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className="text-sm font-medium text-gray-900 max-w-[150px] truncate"
                                  title={peserta.name}
                                >
                                  {peserta.name.length > 20
                                    ? `${peserta.name.substring(0, 20)}...`
                                    : peserta.name}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className="text-sm text-gray-900 max-w-[150px] truncate"
                                  title={peserta.email}
                                >
                                  {peserta.email.length > 15
                                    ? `${peserta.email.substring(0, 15)}...`
                                    : peserta.email}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                  className="text-sm text-gray-900"
                                  title={peserta.registration_id || "-"}
                                >
                                  {peserta.registration_id
                                    ? peserta.registration_id.length > 15
                                      ? `${peserta.registration_id.substring(
                                          0,
                                          15
                                        )}...`
                                      : peserta.registration_id
                                    : "-"}
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
                                <div>
                                  {peserta.kelulusan === "lolos" ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      Lolos
                                    </span>
                                  ) : peserta.kelulusan === "tidak-lolos" ? (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                      Tidak Lolos
                                    </span>
                                  ) : (
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                      Belum Tes
                                    </span>
                                  )}
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
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              {searchPeserta || filterStatusKelulusan
                                ? "Tidak ada peserta yang sesuai dengan filter"
                                : "Belum ada peserta yang terdaftar"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {/* Pagination Peserta untuk Tab Total Peserta */}
                    <PaginationWithSearch
                      currentPage={pesertaPage}
                      totalPages={pesertaTotalPages}
                      onPageChange={(page) => setPesertaPage(page)}
                      onPrevPage={handlePrevPesertaPage}
                      onNextPage={handleNextPesertaPage}
                    />
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
                    if (deleteModal.item?.bulk) {
                      confirmBulkDelete();
                    } else {
                      confirmDeleteSoal();
                    }
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
