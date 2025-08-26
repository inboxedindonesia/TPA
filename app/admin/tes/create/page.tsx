"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Plus, BookOpen, Trash2 } from "lucide-react";
import QuestionSelector from "@/app/components/QuestionSelector";
import FeedbackModal from "@/app/components/FeedbackModal";
import AdminHeader from "@/app/components/AdminHeader";

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

export default function CreateTestPage() {
  // State untuk modal edit nama section
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [editSectionIdx, setEditSectionIdx] = useState<number | null>(null);
  const [editSectionNameValue, setEditSectionNameValue] = useState("");
  const [editSectionDurationValue, setEditSectionDurationValue] = useState(10);

  const openEditSectionModal = (
    idx: number,
    currentName: string,
    currentDuration: number
  ) => {
    setEditSectionIdx(idx);
    setEditSectionNameValue(currentName);
    setEditSectionDurationValue(currentDuration);
    setShowEditSectionModal(true);
  };
  const handleEditSectionSave = () => {
    if (
      editSectionIdx !== null &&
      editSectionNameValue.trim() &&
      editSectionDurationValue > 0
    ) {
      handleEditSection(
        editSectionIdx,
        editSectionNameValue.trim(),
        editSectionDurationValue
      );
    }
    setShowEditSectionModal(false);
  };
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: 60,
    isActive: true,
    maxAttempts: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Section state
  type Section = {
    name: string;
    duration: number;
    questions: Question[];
  };
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionNameInput, setSectionNameInput] = useState("");
  const [sectionDurationInput, setSectionDurationInput] = useState(10);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "success" | "error" | "warning" | "info"
  >("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

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

  const handleAddSection = () => {
    if (!sectionNameInput.trim() || !sectionDurationInput) return;
    setSections((prev) => [
      ...prev,
      {
        name: sectionNameInput.trim(),
        duration: sectionDurationInput,
        questions: [],
      },
    ]);
    setSectionNameInput("");
    setSectionDurationInput(10);
    setShowSectionModal(false);
  };

  const handleEditSectionDuration = (idx: number, newDuration: number) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, duration: newDuration } : s))
    );
  };

  const handleRemoveSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
    if (activeSectionIdx === idx) setActiveSectionIdx(null);
  };

  const handleEditSection = (
    idx: number,
    newName: string,
    newDuration: number
  ) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === idx ? { ...s, name: newName, duration: newDuration } : s
      )
    );
  };

  // Question per section
  const handleQuestionSelect = (questions: Question[]) => {
    if (activeSectionIdx === null) return;
    setSections((prev) =>
      prev.map((s, i) => (i === activeSectionIdx ? { ...s, questions } : s))
    );
    setShowQuestionSelector(false);
  };

  const handleRemoveQuestion = (sectionIdx: number, questionId: string) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx
          ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) }
          : s
      )
    );
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

    if (sections.length === 0) {
      showFeedback(
        "warning",
        "Peringatan",
        "Buat minimal satu section dan pilih soal untuk setiap section"
      );
      return;
    }
    if (sections.some((s) => s.questions.length === 0)) {
      showFeedback(
        "warning",
        "Peringatan",
        "Setiap section harus memiliki minimal satu soal"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Create test first
      // Kirim data tes beserta sections ke backend
      // Ambil creatorId dari localStorage (user login)
      let creatorId = null;
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const userObj = JSON.parse(userStr);
          creatorId = userObj.id || null;
        }
      } catch {}

      // Hitung total durasi dari semua section
      const totalDuration = sections.reduce(
        (sum, s) => sum + (s.duration || 0),
        0
      );
      const testResponse = await fetch("/api/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          duration: totalDuration,
          creatorId,
          sections: sections.map((s) => ({
            name: s.name,
            duration: s.duration,
            questionIds: s.questions.map((q) => q.id),
          })),
        }),
      });

      if (testResponse.ok) {
        showFeedback(
          "success",
          "Berhasil",
          "Tes dengan section berhasil dibuat!"
        );
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 2000);
      } else {
        const errorData = await testResponse.json();
        setError(errorData.error || "Gagal membuat tes");
        showFeedback("error", "Gagal", errorData.error || "Gagal membuat tes");
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
      showFeedback("error", "Error", "Terjadi kesalahan server");
    } finally {
      setLoading(false);
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durasi Tes
                  </label>
                  <div className="text-gray-700 text-sm">
                    Durasi total tes akan diambil dari penjumlahan seluruh
                    durasi section.
                    <br />
                    <span className="font-semibold">
                      Total durasi:{" "}
                      {sections.reduce((sum, s) => sum + (s.duration || 0), 0)}{" "}
                      menit
                    </span>
                  </div>
                </div>

                {/* Jumlah Percobaan (maxAttempts) */}
                <div>
                  <label
                    htmlFor="maxAttempts"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Batas Percobaan Tes (default 1, 0 = tak terbatas)
                  </label>
                  <input
                    type="number"
                    id="maxAttempts"
                    name="maxAttempts"
                    value={formData.maxAttempts}
                    onChange={handleInputChange}
                    min="0"
                    max="20"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Section List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Section Tes
                    </label>
                    <button
                      type="button"
                      className="flex items-center px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                      onClick={() => setShowSectionModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Tambah Section
                    </button>
                  </div>
                  {sections.length === 0 ? (
                    <div className="text-gray-400 text-sm italic">
                      Belum ada section
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sections.map((section, idx) => (
                        <div
                          key={idx}
                          className="border rounded-lg p-3 bg-gray-50"
                        >
                          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-semibold text-blue-800">
                                {section.name}
                              </div>
                              <div className="text-xs text-gray-600">
                                Durasi: {section.duration} menit &bull;{" "}
                                {section.questions.length} soal
                              </div>
                            </div>
                            <div className="flex flex-row flex-wrap items-end gap-1 mt-2 md:mt-0">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditSectionModal(
                                    idx,
                                    section.name,
                                    section.duration
                                  )
                                }
                                className="text-blue-600 hover:underline text-xs ml-1"
                              >
                                Edit Section
                              </button>
                              {/* Modal Edit Section */}
                              {showEditSectionModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                                  <div className="bg-white rounded-lg p-6 w-full max-w-xs shadow-lg">
                                    <h2 className="text-lg font-semibold mb-4">
                                      Edit Section
                                    </h2>
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nama Section
                                      </label>
                                      <input
                                        type="text"
                                        className="w-full border px-3 py-2 rounded"
                                        placeholder="Nama section"
                                        value={editSectionNameValue}
                                        onChange={(e) =>
                                          setEditSectionNameValue(
                                            e.target.value
                                          )
                                        }
                                        autoFocus
                                      />
                                    </div>
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Durasi (menit)
                                      </label>
                                      <input
                                        type="number"
                                        min={1}
                                        className="w-full border px-3 py-2 rounded"
                                        value={editSectionDurationValue}
                                        onChange={(e) =>
                                          setEditSectionDurationValue(
                                            parseInt(e.target.value) || 1
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                      <button
                                        className="px-3 py-1 text-gray-600 hover:text-gray-900"
                                        onClick={() =>
                                          setShowEditSectionModal(false)
                                        }
                                      >
                                        Batal
                                      </button>
                                      <button
                                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        onClick={handleEditSectionSave}
                                        disabled={
                                          !editSectionNameValue.trim() ||
                                          editSectionDurationValue < 1
                                        }
                                      >
                                        Simpan
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveSection(idx)}
                                className="text-red-600 hover:underline text-xs ml-1"
                              >
                                Hapus
                              </button>
                              <button
                                type="button"
                                className="text-blue-600 hover:underline text-xs ml-1"
                                onClick={() => {
                                  setActiveSectionIdx(idx);
                                  setShowQuestionSelector(true);
                                }}
                              >
                                Pilih Soal
                              </button>
                            </div>
                          </div>
                          {/* List soal per section */}
                          {section.questions.length === 0 ? (
                            <div className="text-xs text-gray-400 italic">
                              Belum ada soal
                            </div>
                          ) : (
                            <ul className="space-y-1 mt-2">
                              {section.questions.map((q, qidx) => (
                                <li
                                  key={q.id}
                                  className="flex items-center justify-between text-xs bg-white rounded px-2 py-1 border"
                                >
                                  <span>
                                    {qidx + 1}. {truncateText(q.question, 40)}
                                  </span>
                                  <button
                                    type="button"
                                    className="ml-2 text-red-400 hover:text-red-700"
                                    onClick={() =>
                                      handleRemoveQuestion(idx, q.id)
                                    }
                                    title="Hapus soal"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
                    disabled={
                      loading ||
                      sections.length === 0 ||
                      sections.some((s) => s.questions.length === 0)
                    }
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Menyimpan..." : "Buat Tes"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Info Box */}
          <div className="lg:col-span-1">
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                💡 Tips Membuat Tes
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Bagi tes ke dalam beberapa section sesuai kebutuhan</li>
                <li>
                  • Berikan nama yang jelas dan deskriptif untuk setiap section
                </li>
                <li>
                  • Pilih soal dari bank soal yang tersedia untuk setiap section
                </li>
                <li>• Nonaktifkan tes jika sedang dalam maintenance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Tambah Section */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg p-6 w-full max-w-xs shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Tambah Section</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Section
              </label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded mb-2"
                placeholder="Nama section"
                value={sectionNameInput}
                onChange={(e) => setSectionNameInput(e.target.value)}
              />
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durasi Section (menit)
              </label>
              <input
                id="sectionDurationInput"
                type="number"
                min={1}
                max={300}
                className="w-full border px-3 py-2 rounded"
                placeholder="Durasi section (menit)"
                value={sectionDurationInput}
                onChange={(e) =>
                  setSectionDurationInput(parseInt(e.target.value) || 1)
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-3 py-1 text-gray-600 hover:text-gray-900"
                onClick={() => setShowSectionModal(false)}
              >
                Batal
              </button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleAddSection}
                disabled={!sectionNameInput.trim() || !sectionDurationInput}
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Selector Modal per section */}
      <QuestionSelector
        isOpen={showQuestionSelector}
        onClose={() => setShowQuestionSelector(false)}
        onSelect={handleQuestionSelect}
        existingQuestionIds={
          activeSectionIdx !== null
            ? sections[activeSectionIdx]?.questions.map((q) => q.id)
            : []
        }
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
