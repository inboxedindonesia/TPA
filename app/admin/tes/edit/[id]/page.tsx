"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
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
  usageCount?: number;
  avgScore?: number;
}

type Section = {
  name: string;
  duration: number;
  questions: Question[];
  autoGrouping?: boolean;
  category?: string;
  questionCount?: number;
};

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    maxAttempts: 1,
    tabLeaveLimit: 3,
    minimumScore: 60,
    availableFrom: "",
    availableUntil: "",
  });
  const [isUnlimitedPeriod, setIsUnlimitedPeriod] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null);
  const [showQuestionSelector, setShowQuestionSelector] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionNameInput, setSectionNameInput] = useState("");
  const [sectionDurationInput, setSectionDurationInput] = useState(10);

  // Auto-grouping states
  const [sectionAutoGrouping, setSectionAutoGrouping] = useState(false);
  const [sectionCategory, setSectionCategory] = useState("");
  const [sectionQuestionCount, setSectionQuestionCount] = useState(10);

  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  const [editSectionIdx, setEditSectionIdx] = useState<number | null>(null);
  const [editSectionNameValue, setEditSectionNameValue] = useState("");
  const [editSectionDurationValue, setEditSectionDurationValue] = useState(10);

  // Auto-grouping states for edit section
  const [editSectionAutoGrouping, setEditSectionAutoGrouping] = useState(false);
  const [editSectionCategory, setEditSectionCategory] = useState("");
  const [editSectionQuestionCount, setEditSectionQuestionCount] = useState(10);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<
    "success" | "error" | "warning" | "info"
  >("info");
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    fetchTestWithSections();
  }, [testId]);

  const toInputDateTime = (value: any) => {
    if (!value) return "";
    const raw = String(value);
    const withT = raw.includes("T") ? raw : raw.replace(" ", "T");
    const m1 = withT.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
    if (m1) return m1[1];
    try {
      return new Date(raw).toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  const fetchTestWithSections = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const response = await fetch(`/api/tests/${testId}?withSections=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setError("Gagal memuat data tes");
        return;
      }
      const test = await response.json();
      // Deteksi periode tidak terbatas (availableUntil > 2050)
      const untilDate = new Date(test.availableUntil);
      const isUnlimited = untilDate.getFullYear() > 2050;
      
      setIsUnlimitedPeriod(isUnlimited);
      setFormData({
        name: test.name,
        description: test.description || "",
        isActive: !!test.isActive,
        maxAttempts: test.maxAttempts ?? 1,
        tabLeaveLimit: test.tabLeaveLimit ?? test.tableavelimit ?? 3,
        minimumScore: test.minimumScore ?? 60,
        availableFrom: toInputDateTime(test.availableFrom),
        availableUntil: toInputDateTime(test.availableUntil),
      });
      setSections(
        Array.isArray(test.sections)
          ? test.sections.map((s: any) => {
              return {
                name: s.name,
                duration: s.duration,
                questions: Array.isArray(s.questions) ? s.questions : [],
                autoGrouping: s.autoGrouping || false,
                category: s.category || null,
                questionCount: s.questionCount || null,
              };
            })
          : []
      );
    } catch (e) {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
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

  const handleAddSection = () => {
    if (!sectionNameInput.trim() || !sectionDurationInput) return;
    
    // Validasi untuk auto-grouping
    if (sectionAutoGrouping && (!sectionCategory || !sectionQuestionCount)) {
      showFeedback(
        "warning",
        "Validasi Gagal",
        "Pilih kategori dan jumlah soal untuk auto-grouping"
      );
      return;
    }

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
    
    // Reset form
    setSectionNameInput("");
    setSectionDurationInput(10);
    setSectionAutoGrouping(false);
    setSectionCategory("");
    setSectionQuestionCount(10);
    setShowSectionModal(false);
  };

  const handleEditSection = (
    idx: number,
    newName: string,
    newDuration: number,
    autoGrouping?: boolean,
    category?: string,
    questionCount?: number
  ) => {
    setSections((prev) =>
      prev.map((s, i) =>
        i === idx ? { 
          ...s, 
          name: newName, 
          duration: newDuration,
          autoGrouping: autoGrouping,
          category: autoGrouping ? category : undefined,
          questionCount: autoGrouping ? questionCount : undefined
        } : s
      )
    );
  };

  const openEditSectionModal = (
    idx: number,
    currentName: string,
    currentDuration: number
  ) => {
    const section = sections[idx];
    setEditSectionIdx(idx);
    setEditSectionNameValue(currentName);
    setEditSectionDurationValue(currentDuration);
    
    // Initialize auto-grouping states
    setEditSectionAutoGrouping(section.autoGrouping || false);
    setEditSectionCategory(section.category || "");
    setEditSectionQuestionCount(section.questionCount || 10);
    
    setShowEditSectionModal(true);
  };

  const handleEditSectionSave = () => {
    if (
      editSectionIdx !== null &&
      editSectionNameValue.trim() &&
      editSectionDurationValue > 0
    ) {
      // Validasi untuk auto-grouping
      if (editSectionAutoGrouping && (!editSectionCategory || !editSectionQuestionCount)) {
        showFeedback(
          "warning",
          "Validasi Gagal",
          "Pilih kategori dan jumlah soal untuk auto-grouping"
        );
        return;
      }

      handleEditSection(
        editSectionIdx,
        editSectionNameValue.trim(),
        editSectionDurationValue,
        editSectionAutoGrouping,
        editSectionCategory,
        editSectionQuestionCount
      );
    }
    setShowEditSectionModal(false);
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

    // Validasi periode tes (hanya jika tidak unlimited)
    if (!isUnlimitedPeriod) {
      if (!formData.availableFrom || !formData.availableUntil) {
        showFeedback(
          "warning",
          "Peringatan",
          "Periode tes (mulai & berakhir) wajib diisi"
        );
        return;
      }
      const fromDate = new Date(formData.availableFrom);
      const untilDate = new Date(formData.availableUntil);
      if (
        isNaN(fromDate.getTime()) ||
        isNaN(untilDate.getTime()) ||
        fromDate > untilDate
      ) {
        showFeedback(
          "warning",
          "Peringatan",
          "Periode mulai harus sebelum atau sama dengan periode berakhir"
        );
        return;
      }
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
        "Peringatan",
        "Setiap section harus memiliki minimal satu soal atau menggunakan auto-grouping"
      );
      return;
    }

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
        body: JSON.stringify({
          ...formData,
          ...(isUnlimitedPeriod && {
            availableFrom: new Date().toISOString().slice(0, 16),
            availableUntil: "2099-12-31T23:59",
          }),
          duration: sections.reduce((sum, s) => sum + (s.duration || 0), 0),
          sections: sections.map((s) => ({
            name: s.name,
            duration: s.duration,
            questionIds: s.questions.map((q) => q.id),
            autoGrouping: s.autoGrouping,
            category: s.category,
            questionCount: s.questionCount,
          })),
        }),
      });

      if (response.ok) {
        showFeedback("success", "Berhasil", "Tes berhasil diperbarui!");
        setTimeout(() => router.push("/admin/dashboard"), 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Gagal memperbarui tes");
        showFeedback(
          "error",
          "Gagal",
          errorData.error || "Gagal memperbarui tes"
        );
      }
    } catch (err) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-8">
        <AdminHeader />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white rounded-xl p-6">Memuat...</div>
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

                {/* Durasi Tes */}
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
                          required={!isUnlimitedPeriod}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                          required={!isUnlimitedPeriod}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Peserta tidak dapat memulai tes setelah waktu ini
                        </p>
                      </div>
                    </div>
                  )}
                  {isUnlimitedPeriod && (
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      Tes ini dapat diakses kapan saja tanpa batas waktu.
                    </p>
                  )}
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
                                Durasi: {section.duration} menit •{" "}
                                {section.autoGrouping ? (
                                  <>
                                    Auto-grouping ({section.category}) •{" "}
                                    {section.questionCount} soal
                                  </>
                                ) : (
                                  `${section.questions.length} soal`
                                )}
                              </div>
                              {section.autoGrouping && (
                                <div className="text-xs text-green-600 font-medium">
                                  ✓ Auto-grouping aktif
                                </div>
                              )}
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
                              {showEditSectionModal &&
                                editSectionIdx === idx && (
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
                                          className="w-full border px-3 py-2 rounded mb-2"
                                          placeholder="Nama section"
                                          value={editSectionNameValue}
                                          onChange={(e) =>
                                            setEditSectionNameValue(
                                              e.target.value
                                            )
                                          }
                                          autoFocus
                                        />
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Durasi Section (menit)
                                        </label>
                                        <input
                                          type="number"
                                          min={1}
                                          max={300}
                                          className="w-full border px-3 py-2 rounded mb-3"
                                          placeholder="Durasi section (menit)"
                                          value={editSectionDurationValue}
                                          onChange={(e) =>
                                            setEditSectionDurationValue(
                                              parseInt(e.target.value) || 1
                                            )
                                          }
                                        />
                                        
                                        {/* Auto-grouping toggle */}
                                        <div className="mb-3">
                                          <label className="flex items-center">
                                            <input
                                              type="checkbox"
                                              checked={editSectionAutoGrouping}
                                              onChange={(e) => setEditSectionAutoGrouping(e.target.checked)}
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
                                        {editSectionAutoGrouping && (
                                          <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                              Kategori Soal
                                            </label>
                                            <select
                                              value={editSectionCategory}
                                              onChange={(e) => setEditSectionCategory(e.target.value)}
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

                                        {editSectionAutoGrouping && (
                                          <div className="mb-3">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                              Jumlah Soal
                                            </label>
                                            <input
                                              type="number"
                                              value={editSectionQuestionCount}
                                              onChange={(e) => setEditSectionQuestionCount(parseInt(e.target.value) || 10)}
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
                                            editSectionDurationValue < 1 ||
                                            (editSectionAutoGrouping && (!editSectionCategory || !editSectionQuestionCount))
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
                                className={`px-2 py-1 rounded transition-colors text-xs ${
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
                                  Soal dipilih otomatis dari kategori {section.category?.replace('TES_', '').replace('_', ' ')} sebanyak {section.questionCount || 10} soal
                                </span>
                              </div>
                            </div>
                          ) : (
                            // Tampilkan list soal hanya jika bukan auto-grouping
                            section.questions && section.questions.length > 0 ? (
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
                            ) : (
                              <div className="text-xs text-gray-400 italic">
                                Belum ada soal
                              </div>
                            )
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
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
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
                className="w-full border px-3 py-2 rounded mb-4"
                placeholder="Durasi section (menit)"
                value={sectionDurationInput}
                onChange={(e) =>
                  setSectionDurationInput(parseInt(e.target.value) || 1)
                }
              />

              {/* Auto-grouping checkbox */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sectionAutoGrouping}
                    onChange={(e) => setSectionAutoGrouping(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Auto-grouping soal berdasarkan kategori
                  </span>
                </label>
                {sectionAutoGrouping && (
                  <p className="text-xs text-gray-500 mt-1">
                    Soal akan dipilih otomatis dari kategori yang dipilih saat tes dibuat
                  </p>
                )}
              </div>

              {/* Category selector - only show when auto-grouping is enabled */}
              {sectionAutoGrouping && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori Soal
                    </label>
                    <select
                      value={sectionCategory}
                      onChange={(e) => setSectionCategory(e.target.value)}
                      className="w-full border px-3 py-2 rounded"
                      required
                    >
                      <option value="">Pilih kategori</option>
                      <option value="TES_VERBAL">Tes Verbal</option>
                      <option value="TES_NUMERIK">Tes Numerik</option>
                      <option value="TES_LOGIKA">Tes Logika</option>
                      <option value="TES_SPASIAL">Tes Spasial</option>
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jumlah Soal
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={sectionQuestionCount}
                      onChange={(e) => setSectionQuestionCount(parseInt(e.target.value) || 10)}
                      className="w-full border px-3 py-2 rounded"
                      placeholder="Jumlah soal yang akan dipilih"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Jumlah soal yang akan dipilih secara acak dari kategori
                    </p>
                  </div>
                </>
              )}
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
            ? sections[activeSectionIdx]?.questionCount || 10
            : 10
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
