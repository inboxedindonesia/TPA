"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Plus,
  CheckCircle,
  Clock,
  BarChart3,
  Eye,
  X,
  Edit,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import FeedbackModal from "@/app/components/FeedbackModal";

interface SoalStats {
  totalSoal: number;
  soalBaru: number;
  soalAktif: number;
  rataRataKesulitan: number;
  daftarSoal: Array<{
    id: string;
    question: string;
    category: string;
    difficulty: string;
    createdAt: string;
    usageCount: number;
    successRate: number;
    options?: string[];
    correctAnswer?: string | string[];
    kategori?: string;
    subkategori?: string;
    tipeJawaban?: string;
    gambar?: string;
    gambarJawaban?: string[];
    tipeSoal?: string;
    levelKesulitan?: string;
    deskripsi?: string;
    allowMultipleAnswers?: boolean;
  }>;
}

export default function SoalStatsPage() {
  const [stats, setStats] = useState<SoalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSoal, setSelectedSoal] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isClient, setIsClient] = useState(false);

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
    setIsClient(true);
    fetchSoalStats();
  }, []);

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

  const fetchSoalStats = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch("/api/admin/stats/soal");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching soal stats:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Gagal memuat data statistik soal"
      );
    } finally {
      setIsLoading(false);
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
        fetchSoalStats(); // Refresh data
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-6"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <button
              onClick={fetchSoalStats}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/dashboard"
              className="p-2 bg-white rounded-lg transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Statistik Soal
              </h1>
              <p className="text-gray-600">
                Detail lengkap data soal dan performa tes
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Soal</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalSoal.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Soal Baru</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.soalBaru.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Soal Aktif</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.soalAktif.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Rata-rata Kesulitan
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.rataRataKesulitan}/10
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Soal */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Daftar Soal
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kesulitan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Dibuat
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Penggunaan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tingkat Keberhasilan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.daftarSoal.map((soal) => (
                  <tr
                    key={soal.id}
                    className="table-row-hover"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {soal.question}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatCategory(soal.category)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {soal.difficulty}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {formatDate(soal.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {soal.usageCount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {soal.successRate}%
                      </div>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal View Soal */}
      {showModal && selectedSoal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Detail Soal
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Question */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Pertanyaan:</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                  {selectedSoal.question}
                </p>
              </div>

              {/* Correct Answer Section */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Jawaban Benar:
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <span className="text-green-600 font-medium mr-2">✓</span>
                    {selectedSoal.tipeJawaban === "IMAGE" &&
                    selectedSoal.correctAnswer &&
                    (Array.isArray(selectedSoal.correctAnswer)
                      ? selectedSoal.correctAnswer.some((answer: string) =>
                          answer.startsWith("gambar_")
                        )
                      : selectedSoal.correctAnswer.startsWith("gambar_")) ? (
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          {Array.isArray(selectedSoal.correctAnswer)
                            ? "Jawaban benar adalah gambar berikut:"
                            : "Jawaban benar adalah gambar berikut:"}
                        </p>
                        <div className="flex justify-center">
                          {Array.isArray(selectedSoal.correctAnswer) ? (
                            <div className="grid grid-cols-2 gap-2">
                              {(
                                formatCorrectAnswer(
                                  selectedSoal.correctAnswer,
                                  selectedSoal.tipeJawaban,
                                  selectedSoal.options || []
                                ) as string[]
                              ).map((imageSrc: string, index: number) => (
                                <img
                                  key={index}
                                  src={imageSrc}
                                  alt={`Jawaban Benar ${index + 1}`}
                                  className="max-w-full h-auto rounded border-2 border-green-300"
                                  style={{ maxHeight: "150px" }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <img
                              src={
                                formatCorrectAnswer(
                                  selectedSoal.correctAnswer,
                                  selectedSoal.tipeJawaban,
                                  selectedSoal.options || []
                                ) as string
                              }
                              alt="Jawaban Benar"
                              className="max-w-full h-auto rounded border-2 border-green-300"
                              style={{ maxHeight: "200px" }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {Array.isArray(selectedSoal.correctAnswer)
                          ? (
                              formatCorrectAnswer(
                                selectedSoal.correctAnswer,
                                selectedSoal.tipeJawaban || "",
                                selectedSoal.options || []
                              ) as string[]
                            ).join(", ")
                          : formatCorrectAnswer(
                              selectedSoal.correctAnswer || "",
                              selectedSoal.tipeJawaban || "",
                              selectedSoal.options || []
                            )}
                      </span>
                    )}
                  </div>
                  {selectedSoal.tipeSoal === "ISIAN" && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Peserta harus mengisi jawaban yang tepat sesuai dengan
                        jawaban di atas.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                        <p className="text-xs text-yellow-800">
                          <strong>Catatan:</strong> Jawaban harus tepat sama
                          dengan yang ditentukan (case sensitive).
                        </p>
                      </div>
                      {selectedSoal.tipeJawaban === "IMAGE" && (
                        <div className="bg-purple-50 border border-purple-200 rounded-md p-2 mt-2">
                          <p className="text-xs text-purple-800">
                            <strong>Info:</strong> Soal ini menggunakan gambar
                            sebagai jawaban yang harus diisi peserta.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedSoal.tipeSoal === "PILIHAN_GANDA" && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Jawaban yang benar dari pilihan yang tersedia.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                        <p className="text-xs text-blue-800">
                          <strong>Catatan:</strong> Jawaban yang ditandai dengan
                          ✓ adalah jawaban yang benar.
                        </p>
                      </div>
                      {selectedSoal.tipeJawaban === "IMAGE" && (
                        <div className="bg-purple-50 border border-purple-200 rounded-md p-2 mt-2">
                          <p className="text-xs text-purple-800">
                            <strong>Info:</strong> Soal ini menggunakan gambar
                            sebagai pilihan jawaban. Jawaban benar ditandai
                            dengan ✓.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Question Image */}
              {selectedSoal.gambar && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Gambar Soal:
                  </h4>
                  <div className="flex justify-center">
                    <img
                      src={selectedSoal.gambar}
                      alt="Gambar Soal"
                      className="max-w-full h-auto rounded-md border"
                      style={{ maxHeight: "300px" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TPA Specific Info */}
              {selectedSoal.kategori && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Kategori:
                    </h4>
                    <p className="text-gray-700">
                      {formatCategory(
                        selectedSoal.kategori || selectedSoal.category
                      )}
                    </p>
                  </div>
                  {selectedSoal.subkategori && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Subkategori:
                      </h4>
                      <p className="text-gray-700">
                        {selectedSoal.subkategori}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Answer Type */}
              {selectedSoal.tipeJawaban && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Tipe Jawaban:
                  </h4>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {selectedSoal.tipeJawaban === "TEXT" ? "Teks" : "Gambar"}
                  </div>
                  {selectedSoal.tipeJawaban === "IMAGE" && (
                    <p className="text-sm text-gray-500 mt-1">
                      Jawaban menggunakan gambar sebagai pilihan.
                    </p>
                  )}
                  {selectedSoal.tipeJawaban === "TEXT" && (
                    <p className="text-sm text-gray-500 mt-1">
                      Jawaban menggunakan teks sebagai pilihan.
                    </p>
                  )}
                </div>
              )}

              {/* Answer Options */}
              {selectedSoal.options &&
                selectedSoal.options.length > 0 &&
                selectedSoal.tipeSoal === "PILIHAN_GANDA" && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Pilihan Jawaban:
                    </h4>
                    <div className="space-y-2">
                      {selectedSoal.options.map(
                        (option: string, index: number) => (
                          <div
                            key={index}
                            className={`p-3 rounded-md border ${
                              option === selectedSoal.correctAnswer
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="font-medium text-gray-700 mr-2">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              {selectedSoal.tipeJawaban === "IMAGE" ? (
                                <div className="flex-1">
                                  <img
                                    src={option}
                                    alt={`Pilihan ${String.fromCharCode(
                                      65 + index
                                    )}`}
                                    className="max-w-full h-auto rounded"
                                    style={{ maxHeight: "100px" }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-700 flex-1">
                                  {option}
                                </span>
                              )}
                              {option === selectedSoal.correctAnswer && (
                                <span className="ml-2 text-green-600 font-medium flex items-center">
                                  <span className="mr-1">✓</span>
                                  Benar
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        <strong>Jawaban Benar:</strong>{" "}
                        {selectedSoal.tipeJawaban === "IMAGE" &&
                        selectedSoal.correctAnswer &&
                        selectedSoal.correctAnswer.startsWith("gambar_")
                          ? "Gambar yang ditandai ✓ di atas"
                          : selectedSoal.correctAnswer}
                      </p>
                    </div>
                  </div>
                )}

              {/* Question Type Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Tipe Soal:</h4>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {selectedSoal.tipeSoal === "PILIHAN_GANDA"
                    ? "Pilihan Ganda"
                    : "Isian"}
                </div>
                {selectedSoal.tipeSoal === "ISIAN" && (
                  <p className="text-sm text-gray-500 mt-1">
                    Soal ini memerlukan jawaban berupa teks yang diisi oleh
                    peserta.
                  </p>
                )}
                {selectedSoal.tipeSoal === "PILIHAN_GANDA" && (
                  <p className="text-sm text-gray-500 mt-1">
                    Soal ini memiliki beberapa pilihan jawaban, peserta harus
                    memilih satu yang benar.
                  </p>
                )}
              </div>

              {/* Answer Images */}
              {selectedSoal.gambarJawaban &&
                selectedSoal.gambarJawaban.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Gambar Jawaban:
                    </h4>
                    <div className="space-y-4">
                      {selectedSoal.gambarJawaban.map(
                        (image: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <div className="w-8 h-8 bg-blue-500 text-white text-sm rounded-full flex items-center justify-center flex-shrink-0">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div className="flex-1">
                              <img
                                src={image}
                                alt={`Jawaban ${index + 1}`}
                                className="max-w-full h-auto rounded border"
                                style={{ maxHeight: "200px" }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Description */}
              {selectedSoal.deskripsi && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Deskripsi:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedSoal.deskripsi}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-3">
                  Informasi Soal:
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tanggal Dibuat:</span>
                    <p className="text-gray-900 font-medium">
                      {formatDate(selectedSoal.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Level Kesulitan:</span>
                    <p className="text-gray-900 font-medium">
                      {selectedSoal.levelKesulitan || selectedSoal.difficulty}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Jumlah Penggunaan:</span>
                    <p className="text-gray-900 font-medium">
                      {selectedSoal.usageCount} kali
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tingkat Keberhasilan:</span>
                    <p className="text-gray-900 font-medium">
                      {selectedSoal.successRate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Delete */}
      {deleteModal.isOpen && (
        <FeedbackModal
          isOpen={deleteModal.isOpen}
          type="warning"
          title="Konfirmasi Hapus Soal"
          message={`Apakah Anda yakin ingin menghapus soal "${deleteModal.soalTitle}"?`}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteSoal}
          showConfirmButton={true}
          confirmText="Hapus"
          cancelText="Batal"
        />
      )}

      {/* Modal Feedback */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        autoClose={true}
      />
    </div>
  );
}
