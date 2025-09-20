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
    tabLeaveLimit: 3, // default 3
    minimumScore: 60, // default 60%
    availableFrom: "",
    availableUntil: "",
  });
  const [isUnlimitedPeriod, setIsUnlimitedPeriod] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Section state
  type Section = {
    name: string;
    duration: number;
    questions: Question[];
    autoGrouping?: boolean;
    category?: string;
    questionCount?: number;
  };
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionNameInput, setSectionNameInput] = useState("");
  const [sectionDurationInput, setSectionDurationInput] = useState(10);
  const [sectionAutoGrouping, setSectionAutoGrouping] = useState(false);
  const [sectionCategory, setSectionCategory] = useState("");
  const [sectionQuestionCount, setSectionQuestionCount] = useState(10);

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
    
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === "number") {
      const numValue = parseInt(value) || 0;
      // Validasi khusus untuk setiap field numerik
      let validatedValue = numValue;
      
      if (name === "maxAttempts") {
        validatedValue = Math.max(0, Math.min(20, numValue));
      } else if (name === "tabLeaveLimit") {
        validatedValue = Math.max(0, Math.min(10, numValue));
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: validatedValue,
      }));
    } else {
      // Validasi untuk text dan textarea
      let validatedValue = value;
      
      if (name === "name" && value.length > 100) {
        validatedValue = value.substring(0, 100);
      } else if (name === "description" && value.length > 500) {
        validatedValue = value.substring(0, 500);
      }
      
      setFormData((prev) => ({
        ...prev,
        [name]: validatedValue,
      }));
    }
  };

  const handleAddSection = () => {
    if (!sectionNameInput.trim() || !sectionDurationInput) return;
    setSections((prev) => [
      ...prev,
      {
        name: sectionNameInput.trim(),
        duration: sectionDurationInput,
        questions: [],
        autoGrouping: sectionAutoGrouping,
        category: sectionAutoGrouping ? sectionCategory : undefined,
        questionCount: sectionAutoGrouping ? sectionQuestionCount : undefined,
      },
    ]);
    setSectionNameInput("");
    setSectionDurationInput(10);
    setSectionAutoGrouping(false);
    setSectionCategory("");
    setSectionQuestionCount(10);
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
    // Validasi nama tes
    if (!formData.name.trim()) {
      showFeedback(
        "warning",
        "Validasi Gagal",
        "Nama tes wajib diisi"
      );
      return;
    }
    
    if (formData.name.trim().length < 3) {
      showFeedback(
        "warning",
        "Validasi Gagal",
        "Nama tes minimal 3 karakter"
      );
      return;
    }

    // Validasi periode tes (hanya jika tidak unlimited)
    if (!isUnlimitedPeriod) {
      if (!formData.availableFrom || !formData.availableUntil) {
        showFeedback(
          "warning",
          "Validasi Gagal",
          "Periode tes (mulai & berakhir) wajib diisi"
        );
        return;
      }
      
      const from = new Date(formData.availableFrom);
      const until = new Date(formData.availableUntil);
      const now = new Date();
      
      if (isNaN(from.getTime()) || isNaN(until.getTime())) {
        showFeedback(
          "warning",
          "Validasi Gagal",
          "Format tanggal dan waktu tidak valid"
        );
        return;
      }
      
      if (from >= until) {
        showFeedback(
          "warning",
          "Validasi Gagal",
          "Waktu mulai harus sebelum waktu berakhir"
        );
        return;
      }
      
      if (until <= now) {
        showFeedback(
          "warning",
          "Validasi Gagal",
          "Waktu berakhir harus di masa depan"
        );
        return;
      }
    }
    
    // Validasi nilai numerik
    if (formData.maxAttempts < 0) {
      showFeedback(
        "warning",
        "Validasi Gagal",
        "Batas percobaan tidak boleh negatif"
      );
      return;
    }
    
    if (formData.tabLeaveLimit < 0) {
      showFeedback(
        "warning",
        "Validasi Gagal",
        "Batas peringatan tab leave tidak boleh negatif"
      );
      return;
    }
    
    // Validasi batas minimum skor
    if (formData.minimumScore < 0 || formData.minimumScore > 100) {
      showFeedback(
        "warning",
        "Validasi Gagal",
        "Batas minimum skor harus antara 0-100%"
      );
      return;
    }
    // Validasi: setiap section harus memiliki soal (kecuali yang menggunakan auto-grouping)
    if (sections.some((s) => !s.autoGrouping && s.questions.length === 0)) {
      showFeedback(
        "warning",
        "Validasi Gagal",
        "Setiap section harus memiliki minimal satu soal atau menggunakan auto-grouping"
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
      
      // Prepare data dengan handling periode unlimited
      const testData = {
        ...formData,
        duration: totalDuration,
        creatorId,
        // Jika unlimited period, set availableFrom ke now dan availableUntil ke tanggal yang sangat jauh
        availableFrom: isUnlimitedPeriod 
          ? new Date().toISOString().slice(0, 16) 
          : formData.availableFrom,
        availableUntil: isUnlimitedPeriod 
          ? new Date('2099-12-31T23:59').toISOString().slice(0, 16)
          : formData.availableUntil,
        sections: sections.map((s) => ({
          name: s.name,
          duration: s.duration,
          questionIds: s.questions.map((q) => q.id),
          autoGrouping: s.autoGrouping,
          category: s.category,
          questionCount: s.questionCount,
        })),
      };
      
      const testResponse = await fetch("/api/tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(testData),
      });

      if (testResponse.ok) {
        showFeedback(
          "success",
          "Berhasil Dibuat",
          "Tes dengan section berhasil dibuat dan siap digunakan!"
        );
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 2000);
      } else {
        const errorData = await testResponse.json();
        const errorMessage = errorData.error || "Terjadi kesalahan saat membuat tes";
        setError(errorMessage);
        showFeedback("error", "Gagal Membuat Tes", errorMessage);
      }
    } catch (error) {
      const errorMessage = "Terjadi kesalahan pada server. Silakan coba lagi.";
      setError(errorMessage);
      showFeedback("error", "Kesalahan Server", errorMessage);
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
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                    <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">Error:</span>
                    <span className="ml-1">{error}</span>
                  </div>
                )}

                {/* Nama Tes */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nama Tes <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Masukkan nama tes (contoh: TPA Matematika Dasar)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maksimal 100 karakter
                  </p>
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
                    maxLength={500}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                    placeholder="Jelaskan tujuan dan cakupan tes ini (opsional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maksimal 500 karakter ({formData.description.length}/500)
                  </p>
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

                {/* Pengaturan Tes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Jumlah Percobaan (maxAttempts) */}
                  <div>
                    <label
                      htmlFor="maxAttempts"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Batas Percobaan Tes <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="maxAttempts"
                      name="maxAttempts"
                      value={formData.maxAttempts}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      0 = tak terbatas
                    </p>
                  </div>
                  
                  {/* Batas Tab/Window Leave */}
                  <div>
                    <label
                      htmlFor="tabLeaveLimit"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Batas Peringatan Tab Leave <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="tabLeaveLimit"
                      name="tabLeaveLimit"
                      value={formData.tabLeaveLimit}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      0 = tak terbatas
                    </p>
                  </div>
                </div>

                {/* Batas Minimum Skor */}
                <div>
                  <label
                    htmlFor="minimumScore"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Batas Minimum Skor Kelulusan <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="minimumScore"
                      name="minimumScore"
                      value={formData.minimumScore}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      required
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="60"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-gray-500 text-sm">%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Peserta harus mencapai skor minimal ini untuk dinyatakan lulus (0-100%)
                  </p>
                </div>
                {/* Periode Tes */}
                <div className="mb-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="isUnlimitedPeriod"
                      checked={isUnlimitedPeriod}
                      onChange={(e) => setIsUnlimitedPeriod(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label
                      htmlFor="isUnlimitedPeriod"
                      className="ml-2 text-sm font-medium text-gray-700"
                    >
                      Periode tes tidak terbatas
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    {isUnlimitedPeriod 
                      ? "Tes dapat diakses kapan saja tanpa batas waktu"
                      : "Tentukan periode waktu tes dapat diakses peserta"
                    }
                  </p>
                </div>
                
                {!isUnlimitedPeriod && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="availableFrom"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Periode Mulai Tes <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="availableFrom"
                        name="availableFrom"
                        value={formData.availableFrom}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Waktu mulai tes dapat diakses peserta (zona waktu lokal)
                      </p>
                    </div>
                    <div>
                      <label
                        htmlFor="availableUntil"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Periode Berakhir Tes <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        id="availableUntil"
                        name="availableUntil"
                        value={formData.availableUntil}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Peserta tidak dapat memulai tes setelah waktu ini
                      </p>
                    </div>
                  </div>
                )}


                {/* Section List */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Section Tes
                    </label>
                    <button
                      type="button"
                      className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm font-medium"
                      onClick={() => setShowSectionModal(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Tambah Section
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
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-blue-800 truncate">
                                {section.name}
                              </div>
                              <div className="text-xs text-gray-600">
                                Durasi: {section.duration} menit &bull;{" "}
                                {section.autoGrouping ? (
                                  <span className="text-blue-600 font-medium">
                                    Auto-grouping: {section.questionCount || 10} soal dari kategori {section.category?.replace('TES_', '').replace('_', ' ')}
                                  </span>
                                ) : (
                                  `${section.questions.length} soal`
                                )}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditSectionModal(
                                    idx,
                                    section.name,
                                    section.duration
                                  )
                                }
                                className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                Edit
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
                        type="button"
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        onClick={() =>
                          setShowEditSectionModal(false)
                        }
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
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
                                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                Hapus
                              </button>
                              <button
                                type="button"
                                className={`px-2 py-1 rounded transition-colors ${
                                  section.autoGrouping 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-green-600 hover:bg-green-50'
                                }`}
                                onClick={() => {
                                  if (!section.autoGrouping) {
                                    setActiveSectionIdx(idx);
                                    setShowQuestionSelector(true);
                                  }
                                }}
                                disabled={section.autoGrouping}
                                title={section.autoGrouping ? 'Soal akan dipilih otomatis' : 'Pilih soal manual'}
                              >
                                {section.autoGrouping ? 'Auto-grouping Aktif' : 'Pilih Soal'}
                              </button>
                            </div>
                          </div>
                          {/* List soal per section */}
                          {section.autoGrouping ? (
                            <div className="text-xs text-blue-600 italic mt-2 bg-blue-50 p-2 rounded">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>
                                  Soal akan dipilih otomatis saat tes dibuat ({section.questionCount || 10} soal dari kategori {section.category?.replace('TES_', '').replace('_', ' ')})
                                </span>
                              </div>
                            </div>
                          ) : section.questions.length === 0 ? (
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
                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={
                      loading ||
                      sections.length === 0 ||
                      sections.some((s) => !s.autoGrouping && s.questions.length === 0)
                    }
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Menyimpan...
                      </>
                    ) : (
                      "Buat Tes"
                    )}
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
                className="w-full border px-3 py-2 rounded mb-3"
                placeholder="Durasi section (menit)"
                value={sectionDurationInput}
                onChange={(e) =>
                  setSectionDurationInput(parseInt(e.target.value) || 1)
                }
              />
              
              {/* Auto-grouping toggle */}
              <div className="mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sectionAutoGrouping}
                    onChange={(e) => setSectionAutoGrouping(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Auto-grouping soal berdasarkan kategori
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Sistem akan otomatis memilih soal berdasarkan kategori yang dipilih
                </p>
              </div>

              {/* Category selection when auto-grouping is enabled */}
              {sectionAutoGrouping && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Soal
                  </label>
                  <select
                    value={sectionCategory}
                    onChange={(e) => setSectionCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="TES_VERBAL">Tes Verbal</option>
                    <option value="TES_GAMBAR">Tes Gambar</option>
                    <option value="TES_LOGIKA">Tes Logika</option>
                    <option value="TES_ANGKA">Tes Angka</option>
                  </select>
                </div>
              )}

              {sectionAutoGrouping && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah Soal
                  </label>
                  <input
                    type="number"
                    value={sectionQuestionCount}
                    onChange={(e) => setSectionQuestionCount(parseInt(e.target.value) || 10)}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jumlah soal yang akan dipilih otomatis"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sistem akan memilih soal secara acak dari kategori yang dipilih
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                onClick={() => setShowSectionModal(false)}
              >
                Batal
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                onClick={handleAddSection}
                disabled={!sectionNameInput.trim() || !sectionDurationInput || (sectionAutoGrouping && (!sectionCategory || !sectionQuestionCount))}
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
        sectionName={
          activeSectionIdx !== null
            ? sections[activeSectionIdx]?.name
            : undefined
        }
        autoGrouping={
          activeSectionIdx !== null
            ? sections[activeSectionIdx]?.autoGrouping || false
            : false
        }
        sectionCategory={
          activeSectionIdx !== null
            ? sections[activeSectionIdx]?.category
            : undefined
        }
        sectionQuestionCount={
          activeSectionIdx !== null
            ? sections[activeSectionIdx]?.questionCount
            : undefined
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
