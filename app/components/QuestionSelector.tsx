"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Plus, X, Check } from "lucide-react";
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
  addedAt?: string;
}

interface QuestionSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedQuestions: Question[]) => void;
  testId?: string;
  existingQuestionIds?: string[];
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
      return category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || category;
  }
};

export default function QuestionSelector({
  isOpen,
  onClose,
  onSelect,
  testId,
  existingQuestionIds = [],
}: QuestionSelectorProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categories: [],
    difficulties: [],
    types: [],
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 1000,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "success" | "error" | "warning" | "info"
  >("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchQuestions();
    }
  }, [
    isOpen,
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
        // Filter out questions that are already in the test
        const availableQuestions = data.questions.filter(
          (q: Question) => !existingQuestionIds.includes(q.id)
        );
        setQuestions(availableQuestions);
        setPagination(data.pagination);
        setFilters(data.filters);
      } else {
        showFeedback("error", "Error", "Gagal memuat data soal");
      }
    } catch (error) {
      showFeedback("error", "Error", "Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionToggle = (question: Question) => {
    const isSelected = selectedQuestions.some((q) => q.id === question.id);
    if (isSelected) {
      setSelectedQuestions(
        selectedQuestions.filter((q) => q.id !== question.id)
      );
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  const handleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions([...questions]);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedQuestions.length === 0) {
      showFeedback("warning", "Peringatan", "Pilih minimal satu soal");
      return;
    }

    if (testId) {
      // Add questions to test via API
      addQuestionsToTest();
    } else {
      // Just return selected questions
      onSelect(selectedQuestions);
      onClose();
    }
  };

  const addQuestionsToTest = async () => {
    try {
      const response = await fetch("/api/admin/bank-soal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testId,
          questionIds: selectedQuestions.map((q) => q.id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showFeedback(
          "success",
          "Berhasil",
          `${data.addedCount} soal berhasil ditambahkan ke tes`
        );
        onSelect(selectedQuestions);
        onClose();
      } else {
        const errorData = await response.json();
        showFeedback(
          "error",
          "Gagal",
          errorData.error || "Gagal menambahkan soal ke tes"
        );
      }
    } catch (error) {
      showFeedback("error", "Error", "Terjadi kesalahan server");
    }
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

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Pilih Soal dari Bank Soal
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedQuestions.length} soal dipilih • {questions.length}{" "}
                  soal tersedia
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedQuestions.length === questions.length
                    ? "Batal Semua"
                    : "Pilih Semua"}
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col lg:flex-row gap-4">
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

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filter
              </button>
            </div>

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

          {/* Questions List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Memuat data...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-600">Tidak ada soal ditemukan</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {questions.map((question) => {
                  const isSelected = selectedQuestions.some(
                    (q) => q.id === question.id
                  );
                  return (
                    <div
                      key={question.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : ""
                      }`}
                      onClick={() => handleQuestionToggle(question)}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isSelected
                                ? "bg-blue-500 border-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                                question.category
                              )}`}
                            >
                              {formatCategoryName(question.category)}
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(
                                question.difficulty
                              )}`}
                            >
                              {question.difficulty}
                            </span>
                            <span className="text-xs text-gray-500">
                              {question.type} •{" "}
                              {question.multipleAnswer
                                ? "Multi Jawaban"
                                : "Single Jawaban"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900 mb-2">
                            {truncateText(question.question)}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>Penggunaan: {question.usageCount}</span>
                            <span>
                              Rata-rata Skor: {question.avgScore.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedQuestions.length} soal dipilih
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmSelection}
                  disabled={selectedQuestions.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {testId ? "Tambahkan ke Tes" : "Pilih Soal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={showModal}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowModal(false)}
        autoClose={modalType !== "warning"}
        autoCloseDelay={3000}
      />
    </>
  );
}
