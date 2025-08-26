"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Eye, Edit, Trash2, Plus } from "lucide-react";
import FeedbackModal from "@/app/components/FeedbackModal";

interface Question {
  id: string;
  question: string;
  type: string;
  category: string;
  difficulty: string;
  options: string[];
  correctAnswer: string;
  gambarJawaban: string[];
  tipeJawaban: string;
  multipleAnswer: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  avgScore: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Filters {
  categories: string[];
  difficulties: string[];
  types: string[];
}

export default function BankSoalPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<Filters>({
    categories: [],
    difficulties: [],
    types: [],
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "success" | "error" | "warning" | "info"
  >("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );

  useEffect(() => {
    fetchQuestions();
  }, [
    pagination.page,
    searchTerm,
    selectedCategory,
    selectedDifficulty,
    selectedType,
  ]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        category: selectedCategory,
        difficulty: selectedDifficulty,
        type: selectedType,
      });

      const response = await fetch(`/api/admin/bank-soal?${params}`);

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        setPagination(data.pagination);
        setFilters(data.filters);
      } else {
        setError("Gagal memuat data bank soal");
        showFeedback("error", "Error", "Gagal memuat data bank soal");
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
      showFeedback("error", "Error", "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    setSelectedQuestion(questions.find((q) => q.id === questionId) || null);
    setModalType("warning");
    setModalTitle("Konfirmasi Hapus");
    setModalMessage("Apakah Anda yakin ingin menghapus soal ini?");
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!selectedQuestion) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showFeedback("error", "Error", "Token tidak ditemukan");
        return;
      }

      const response = await fetch(`/api/admin/soal/${selectedQuestion.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Log activity using client-side logger
        try {
          const { ClientActivityLogger } = await import(
            "@/lib/clientActivityLogger"
          );
          await ClientActivityLogger.logQuestionOperation(
            selectedQuestion.id,
            "DELETE",
            selectedQuestion.question
          );
          console.log("Activity logged successfully");
        } catch (logError) {
          console.error("Error logging activity:", logError);
        }

        setQuestions(questions.filter((q) => q.id !== selectedQuestion.id));
        showFeedback("success", "Berhasil", "Soal berhasil dihapus!");
        fetchQuestions(); // Refresh data
      } else {
        showFeedback("error", "Gagal", "Gagal menghapus soal");
      }
    } catch (error) {
      showFeedback("error", "Error", "Terjadi kesalahan server");
    } finally {
      setShowModal(false);
      setSelectedQuestion(null);
    }
  };

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setModalType("info");
    setModalTitle("Detail Soal");
    setModalMessage("");
    setShowModal(true);
  };

  const handleEditQuestion = (questionId: string) => {
    router.push(`/admin/soal/edit/${questionId}`);
  };

  const handleAddQuestion = () => {
    router.push("/admin/soal/create");
  };

  const showFeedback = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string
  ) => {
    setModalType(type);
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case "MUDAH":
        return "bg-green-100 text-green-800";
      case "SEDANG":
        return "bg-yellow-100 text-yellow-800";
      case "SULIT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toUpperCase()) {
      case "MATEMATIKA":
        return "bg-blue-100 text-blue-800";
      case "BAHASA_INDONESIA":
        return "bg-purple-100 text-purple-800";
      case "GENERAL_KNOWLEDGE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Soal</h1>
          <p className="text-gray-600">
            Kelola dan lihat semua soal yang tersedia dalam sistem
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Soal</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pagination.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Rata-rata Skor
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {questions.length > 0
                    ? (
                        questions.reduce((sum, q) => sum + q.avgScore, 0) /
                        questions.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Penggunaan
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {questions.reduce((sum, q) => sum + q.usageCount, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Kategori</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filters.categories.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Cari soal..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </button>

            {/* Add Question */}
            <button
              onClick={handleAddQuestion}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Tambah Soal
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Semua Kategori</option>
                    {filters.categories.map((category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Semua Tingkat</option>
                    {filters.difficulties.map((difficulty) => (
                      <option
                        key={difficulty}
                        value={difficulty}
                      >
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Soal
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Semua Tipe</option>
                    {filters.types.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Soal</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat data...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-600">{error}</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-600">Tidak ada soal ditemukan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Soal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tingkat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Penggunaan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rata-rata Skor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Dibuat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questions.map((question) => (
                    <tr
                      key={question.id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm font-medium text-gray-900">
                            {truncateText(question.question)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {question.type} •{" "}
                            {question.multipleAnswer
                              ? "Multi Jawaban"
                              : "Single Jawaban"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                            question.category
                          )}`}
                        >
                          {question.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {question.usageCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {question.avgScore.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(question.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewQuestion(question)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditQuestion(question.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              dari {pagination.total} soal
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page - 1 })
                }
                disabled={pagination.page === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sebelumnya
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Halaman {pagination.page} dari {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPagination({ ...pagination, page: pagination.page + 1 })
                }
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showModal}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => {
          setShowModal(false);
          setSelectedQuestion(null);
        }}
        onConfirm={modalType === "warning" ? confirmDelete : undefined}
        showConfirmButton={modalType === "warning"}
        confirmText="Hapus"
        cancelText="Batal"
        autoClose={modalType !== "warning"}
        autoCloseDelay={3000}
      />

      {/* Detail Question Modal */}
      {selectedQuestion && modalType === "info" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Detail Soal
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedQuestion(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Question Info */}
              <div className="mb-6">
                <div className="flex items-center space-x-4 mb-4">
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getCategoryColor(
                      selectedQuestion.category
                    )}`}
                  >
                    {selectedQuestion.category}
                  </span>
                  <span
                    className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDifficultyColor(
                      selectedQuestion.difficulty
                    )}`}
                  >
                    {selectedQuestion.difficulty}
                  </span>
                  <span className="text-sm text-gray-500">
                    {selectedQuestion.type} •{" "}
                    {selectedQuestion.multipleAnswer
                      ? "Multi Jawaban"
                      : "Single Jawaban"}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Pertanyaan:
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {selectedQuestion.question.startsWith("/uploads/") ? (
                      <img
                        src={selectedQuestion.question}
                        alt="Soal"
                        className="max-w-full h-auto rounded"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {selectedQuestion.question}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Pilihan Jawaban:
                </h3>
                <div className="space-y-3">
                  {selectedQuestion.options.map((option, index) => {
                    const labels = ["A", "B", "C", "D"];
                    const isCorrect = selectedQuestion.correctAnswer.includes(
                      labels[index]
                    );

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          isCorrect
                            ? "border-green-200 bg-green-50"
                            : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <span
                            className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold ${
                              isCorrect
                                ? "bg-green-500 text-white"
                                : "bg-gray-300 text-gray-700"
                            }`}
                          >
                            {labels[index]}
                          </span>
                          <div className="flex-1">
                            {selectedQuestion.gambarJawaban &&
                            selectedQuestion.gambarJawaban[index] ? (
                              <img
                                src={selectedQuestion.gambarJawaban[index]}
                                alt={`Jawaban ${labels[index]}`}
                                className="max-w-full h-auto rounded"
                              />
                            ) : (
                              <p className="text-gray-900">{option}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-600">
                    Penggunaan
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {selectedQuestion.usageCount}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-600">
                    Rata-rata Skor
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {selectedQuestion.avgScore.toFixed(1)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-purple-600">
                    Tanggal Dibuat
                  </p>
                  <p className="text-sm font-bold text-purple-900">
                    {formatDate(selectedQuestion.createdAt)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleEditQuestion(selectedQuestion.id)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Soal
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedQuestion(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
