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
  BarChart3,
  X,
  Search,
  XCircle,
} from "lucide-react";
import FeedbackModal from "@/app/components/FeedbackModal";

export default function AdminDashboard() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [dashboardData, setDashboardData] = useState({
    totalPeserta: 0,
    totalSoal: 0,
    tesAktif: 0,
    soalCategories: 0,
    soalDifficulties: 0,
    soalCategoryList: "",
    soalDifficultyList: "",
    soalBaru: 0,
    tesBaru: 0,
    tesNonaktif: 0,
    pesertaBaru: 0,
    pesertaAktif: 0,
    rataRataSkor: "0",
    rataRataDurasi: "0",
    soalAktif: 0,
    rataRataKesulitan: "0",
    totalPesertaTes: 0,
  });
  const [activeTab, setActiveTab] = useState<string>("soal");
  const [activeStats, setActiveStats] = useState<string>("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State untuk soal data
  const [soalData, setSoalData] = useState<any>(null);
  const [selectedSoal, setSelectedSoal] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // State untuk peserta data
  const [pesertaData, setPesertaData] = useState<any>(null);
  const [searchPeserta, setSearchPeserta] = useState("");
  const [searchSoal, setSearchSoal] = useState("");
  const [searchTes, setSearchTes] = useState("");

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
    soalId: "",
    soalTitle: "",
  });

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
    setIsClient(true);
    fetchDashboardData();
    if (activeTab === "soal") {
      fetchSoalData();
    }
    if (activeStats === "peserta") {
      fetchPesertaData();
    }
  }, [activeTab, activeStats]);

  const formatDate = (dateString: string) => {
    if (!isClient) return dateString;

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

  const formatCategory = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      TES_VERBAL: "Tes Verbal",
      TES_GAMBAR: "Tes Gambar",
      TES_ANGKA: "Tes Angka",
      TES_LOGIKA: "Tes Logika",
      TES_SPASIAL: "Tes Spasial",
      TES_BAHASA: "Tes Bahasa",
      TES_MATEMATIKA: "Tes Matematika",
      TES_UMUM: "Tes Umum",
      GENERAL_KNOWLEDGE: "Pengetahuan Umum",
      BAHASA_INDONESIA: "Bahasa Indonesia",
      MATEMATIKA: "Matematika",
    };

    return categoryMap[category] || category;
  };

  const formatCorrectAnswer = (
    correctAnswer: string | string[],
    tipeJawaban: string,
    options: string[]
  ) => {
    if (Array.isArray(correctAnswer)) {
      // Handle multiple answers
      if (tipeJawaban === "IMAGE") {
        return correctAnswer.map((answer: string) => {
          if (answer.startsWith("gambar_")) {
            const index = parseInt(answer.replace("gambar_", ""));
            if (options && options[index] !== undefined) {
              return options[index];
            }
          }
          return answer;
        });
      }
      return correctAnswer;
    } else {
      // Handle single answer
      if (tipeJawaban === "IMAGE" && correctAnswer.startsWith("gambar_")) {
        const index = parseInt(correctAnswer.replace("gambar_", ""));
        if (options && options[index] !== undefined) {
          return options[index];
        }
      }
      return correctAnswer;
    }
  };

  const fetchSoalData = async () => {
    try {
      const response = await fetch("/api/admin/stats/soal");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setSoalData(data);
    } catch (error) {
      console.error("Error fetching soal data:", error);
      setError(
        error instanceof Error ? error.message : "Gagal memuat data soal"
      );
    }
  };

  const fetchPesertaData = async () => {
    try {
      const response = await fetch("/api/admin/stats/peserta");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setPesertaData(data);
    } catch (error) {
      console.error("Error fetching peserta data:", error);
      setError(
        error instanceof Error ? error.message : "Gagal memuat data peserta"
      );
    }
  };

  const handleViewSoal = (soal: any) => {
    setSelectedSoal(soal);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedSoal(null);
  };

  const handleEditSoal = (soal: any) => {
    // Redirect to edit page
    window.location.href = `/admin/soal/edit/${soal.id}`;
  };

  const handleDeleteSoal = async (soal: any) => {
    setDeleteModal({
      isOpen: true,
      soalId: soal.id,
      soalTitle: soal.question,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      soalId: "",
      soalTitle: "",
    });
  };

  const confirmDeleteSoal = async () => {
    try {
      const response = await fetch(`/api/questions/${deleteModal.soalId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFeedbackModal({
          isOpen: true,
          type: "success",
          title: "Berhasil",
          message: `Soal "${deleteModal.soalTitle}" berhasil dihapus!`,
        });
        fetchSoalData(); // Refresh data
      } else {
        const errorData = await response.json();
        setFeedbackModal({
          isOpen: true,
          type: "error",
          title: "Gagal",
          message: `Gagal menghapus soal: ${errorData.error}`,
        });
      }
    } catch (error) {
      console.error("Error deleting soal:", error);
      setFeedbackModal({
        isOpen: true,
        type: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat menghapus soal",
      });
    } finally {
      closeDeleteModal();
    }
  };

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

  // Filter peserta berdasarkan search
  const filteredPeserta =
    pesertaData?.daftarPeserta?.filter(
      (peserta: any) =>
        peserta.name.toLowerCase().includes(searchPeserta.toLowerCase()) ||
        peserta.email.toLowerCase().includes(searchPeserta.toLowerCase())
    ) || [];

  // Filter soal berdasarkan search
  const filteredSoal =
    soalData?.daftarSoal?.filter(
      (soal: any) =>
        soal.question.toLowerCase().includes(searchSoal.toLowerCase()) ||
        soal.category.toLowerCase().includes(searchSoal.toLowerCase()) ||
        soal.difficulty.toLowerCase().includes(searchSoal.toLowerCase())
    ) || [];

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

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-8">
        {/* All Cards in One Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-8">
          {/* Kelola Soal Card */}
          <div
