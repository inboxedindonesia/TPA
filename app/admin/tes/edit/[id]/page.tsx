"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { BookOpen, Plus, Trash2, Eye } from "lucide-react";
import AdminHeader from "@/app/components/AdminHeader";
import QuestionSelector from "@/app/components/QuestionSelector";
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
  addedAt?: string;
}

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    totalQuestions: 0,
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "success" | "error" | "warning" | "info"
  >("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    fetchTest();
    fetchTestQuestions();
  }, [testId]);

  const fetchTest = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/tests/${testId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const test = await response.json();
        setFormData({
          name: test.name,
          description: test.description || "",
          duration: test.duration,
          totalQuestions: test.totalQuestions,
          isActive: test.isActive,
        });
      } else {
        setError("Gagal memuat data tes");
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const fetchTestQuestions = async () => {
    try {
      const response = await fetch(`/api/tests/${testId}/questions`);
      if (response.ok) {
        const data = await response.json();
        setTestQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Error fetching test questions:", error);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? parseInt(value)
          : value,
    }));
  };

  const handleQuestionSelect = async (questions: Question[]) => {
    try {
      const response = await fetch(`/api/tests/${testId}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionIds: questions.map((q) => q.id),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        showFeedback(
          "success",
          "Berhasil",
          `${data.addedCount} soal berhasil ditambahkan ke tes`
        );
        fetchTestQuestions(); // Refresh questions
        fetchTest(); // Refresh test data
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/tests/${testId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showFeedback("success", "Berhasil", "Tes berhasil diperbarui!");
        setTimeout(() => {
          router.push("/admin/tes/kelola");
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Gagal memperbarui tes");
        showFeedback(
          "error",
          "Gagal",
          errorData.error || "Gagal memperbarui tes"
        );
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
      showFeedback("error", "Error", "Terjadi kesalahan server");
    } finally {
      setSaving(false);
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data tes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <AdminHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6">
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                  </div>
                )}

                {/* Nama Tes */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nama Tes *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: TPA Matematika Dasar"
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Deskripsi Tes
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jelaskan tujuan dan cakupan tes ini..."
                  />
                </div>

                {/* Durasi */}
                <div>
                  <label
                    htmlFor="duration"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Durasi (menit) *
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    max="300"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Status Aktif */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Tes aktif (peserta dapat mengakses)
                    </span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Soal Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Soal Tes
                </h3>
                <button
                  onClick={() => setShowQuestionSelector(true)}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Soal
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {testQuestions.length} soal dalam tes ini
                </p>
              </div>

              {testQuestions.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Belum ada soal dalam tes ini
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Klik "Tambah Soal" untuk menambahkan soal dari bank soal
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs font-medium text-gray-500">
                              #{index + 1}
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(
                                question.category
                              )}`}
                            >
                              {question.category}
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(
                                question.difficulty
                              )}`}
                            >
                              {question.difficulty}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">
                            {truncateText(question.question)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <button
                            className="text-blue-500 hover:text-blue-700"
                            title="Lihat detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                💡 Tips Edit Tes
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Anda dapat menambah soal dari bank soal</li>
                <li>• Soal yang sudah ada tidak akan terduplikasi</li>
                <li>• Total soal akan diupdate otomatis</li>
                <li>• Nonaktifkan tes jika sedang dalam maintenance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Question Selector Modal */}
      <QuestionSelector
        isOpen={showQuestionSelector}
        onClose={() => setShowQuestionSelector(false)}
        onSelect={handleQuestionSelect}
        testId={testId}
        existingQuestionIds={testQuestions.map((q) => q.id)}
      />

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
    </div>
  );
}
