"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PesertaHeader from "../../../components/PesertaHeader";

interface Answer {
  id: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  answeredAt: string;
  question: {
    question: string;
    type: string;
    category: string;
    difficulty: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  };
}

interface CategoryBreakdown {
  score: number;
  maxScore: number;
  percentage: number;
}

interface TestSession {
  id: string;
  testId: string;
  userId: string;
  status: string;
  score: number;
  maxScore: number;
  startTime: string;
  endTime: string;
  overallPercentage: number;
  categoryBreakdown: {
    TES_VERBAL: CategoryBreakdown;
    TES_ANGKA: CategoryBreakdown;
    TES_LOGIKA: CategoryBreakdown;
    TES_GAMBAR: CategoryBreakdown;
  };
  // RIASEC scores
  score_realistic?: number;
  score_investigative?: number;
  score_artistic?: number;
  score_social?: number;
  score_enterprising?: number;
  score_conventional?: number;
  max_score_realistic?: number;
  max_score_investigative?: number;
  max_score_artistic?: number;
  max_score_social?: number;
  max_score_enterprising?: number;
  max_score_conventional?: number;
  holland_code?: string;
  test: {
    name: string;
    description: string;
    duration: number;
  };
  test_name: string;
  test_description: string;
  test_duration: number;
  user_name: string;
  user_email: string;
  user_registration_id: string;
  answers: Answer[];
}

export default function DetailHasilTesPesertaPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedDetails, setExpandedDetails] = useState<{
    [key: string]: boolean;
  }>({});
  const [detailError, setDetailError] = useState<{ [key: string]: string }>({});
  const [detailLoading, setDetailLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [retryCount, setRetryCount] = useState(0);
  const [autoRetrying, setAutoRetrying] = useState(false);

  useEffect(() => {
    fetchSessionDetail();
  }, [sessionId]);

  // Auto-retry mechanism for failed session loads
  useEffect(() => {
    if (!session && !loading && error && retryCount < 3) {
      const timer = setTimeout(() => {
        setAutoRetrying(true);
        setRetryCount((prev) => prev + 1);
        fetchSessionDetail();
      }, 3000); // Retry after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [session, loading, error, retryCount]);

  const fetchSessionDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError("");
      if (autoRetrying) {
        setAutoRetrying(false);
      }

      const response = await fetch(`/api/test-sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Merge answers into session object for compatibility
        const sessionWithAnswers = {
          ...data.session,
          answers: data.answers || [],
        };
        setSession(sessionWithAnswers);
        setRetryCount(0); // Reset retry count on success
      } else {
        if (retryCount < 3) {
          setError(
            `Data sesi tidak tersedia. Mencoba lagi dalam 3 detik... (${
              retryCount + 1
            }/3)`
          );
        } else {
          setError("Data sesi tidak tersedia. Silakan refresh halaman.");
        }
      }
    } catch (error) {
      if (retryCount < 3) {
        setError(
          `Terjadi kesalahan server. Mencoba lagi dalam 3 detik... (${
            retryCount + 1
          }/3)`
        );
      } else {
        setError("Terjadi kesalahan server. Silakan refresh halaman.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleToggleDetails = (category: string) => {
    try {
      // Prevent multiple rapid clicks
      if (detailLoading[category]) {
        return;
      }

      // Set loading state for this specific category only
      setDetailLoading((prev) => ({ ...prev, [category]: true }));

      // Clear previous error for this category only
      setDetailError((prev) => ({ ...prev, [category]: "" }));

      // Use React.startTransition to ensure state updates are batched properly
      setTimeout(() => {
        try {
          // Check if session data is available
          if (!session || !session.answers) {
            setDetailError((prev) => ({
              ...prev,
              [category]: "Data sesi tidak tersedia. Silakan refresh halaman.",
            }));
            setDetailLoading((prev) => ({ ...prev, [category]: false }));
            return;
          }

          // Check if category has valid data
          const categoryData =
            session.categoryBreakdown[
              category as keyof typeof session.categoryBreakdown
            ];
          if (!categoryData) {
            setDetailError((prev) => ({
              ...prev,
              [category]:
                "Data kategori tidak ditemukan. Silakan hubungi administrator.",
            }));
            setDetailLoading((prev) => ({ ...prev, [category]: false }));
            return;
          }

          // Use functional update to ensure we get the latest state
          // and only toggle the specific category
          setExpandedDetails((currentState) => {
            const newState = { ...currentState };
            newState[category] = !currentState[category];
            return newState;
          });

          setDetailLoading((prev) => ({ ...prev, [category]: false }));
        } catch (innerError) {
          console.error("Inner error toggling details:", innerError);
          setDetailError((prev) => ({
            ...prev,
            [category]:
              "Terjadi kesalahan saat membuka detail. Silakan coba lagi.",
          }));
          setDetailLoading((prev) => ({ ...prev, [category]: false }));
        }
      }, 100); // Reduced delay for better responsiveness
    } catch (error) {
      console.error("Error toggling details:", error);
      setDetailError((prev) => ({
        ...prev,
        [category]: "Terjadi kesalahan saat membuka detail. Silakan coba lagi.",
      }));
      setDetailLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  const refetchSessionData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/test-sessions/${params.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch session");
      }
      const data = await response.json();
      // Merge answers into session object for compatibility
      const sessionWithAnswers = {
        ...data.session,
        answers: data.answers || [],
      };
      setSession(sessionWithAnswers);
      return sessionWithAnswers;
    } catch (error) {
      console.error("Error fetching session:", error);
      throw error;
    }
  };

  const handleRetryDetails = (category: string) => {
    // Prevent retry if already loading
    if (detailLoading[category]) {
      return;
    }

    // Clear the error for this specific category only
    setDetailError((prev) => ({ ...prev, [category]: "" }));

    // If session is null, try to refetch session data first
    if (!session) {
      setDetailError((prev) => ({
        ...prev,
        [category]: "Mencoba memuat ulang data sesi...",
      }));

      refetchSessionData()
        .then(() => {
          setDetailError((prev) => ({ ...prev, [category]: "" }));
          // After refetch, try to toggle again for this specific category
          setTimeout(() => {
            handleToggleDetails(category);
          }, 500);
        })
        .catch(() => {
          setDetailError((prev) => ({
            ...prev,
            [category]: "Data sesi tidak tersedia. Silakan refresh halaman.",
          }));
        });
      return;
    }

    // Small delay to show user that something is happening, then toggle this specific category
    setTimeout(() => {
      handleToggleDetails(category);
    }, 100);
  };

  const calculatePercentage = (score: number, maxScore: number) => {
    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 80) return "Excellent! Anda sangat baik!";
    if (percentage >= 60) return "Good! Anda cukup baik!";
    return "Keep trying! Anda perlu belajar lebih giat!";
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case "TES_VERBAL":
        return "Tes Verbal";
      case "TES_ANGKA":
        return "Tes Angka";
      case "TES_LOGIKA":
        return "Tes Logika";
      case "TES_GAMBAR":
        return "Tes Gambar";
      default:
        return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "TES_VERBAL":
        return "";
      case "TES_ANGKA":
        return "";
      case "TES_LOGIKA":
        return "";
      case "TES_GAMBAR":
        return "";
      default:
        return "";
    }
  };

  // Fungsi untuk menghitung Z-Score
  const calculateZScore = (percentage: number) => {
    // Asumsi rata-rata populasi = 65%, standar deviasi = 15%
    const populationMean = 65;
    const standardDeviation = 15;
    const zScore = (percentage - populationMean) / standardDeviation;
    return zScore.toFixed(2);
  };

  // Fungsi untuk interpretasi Z-Score
  const getZScoreInterpretation = (zScore: number) => {
    if (zScore >= 2.0) return "Sangat Tinggi";
    if (zScore >= 1.0) return "Tinggi";
    if (zScore >= -1.0) return "Normal";
    if (zScore >= -2.0) return "Rendah";
    return "Sangat Rendah";
  };

  // Fungsi untuk rekomendasi keseluruhan
  const getOverallRecommendation = (
    percentage: number,
    categoryBreakdown: any
  ) => {
    const recommendations = [];

    // Rekomendasi berdasarkan skor keseluruhan
    if (percentage >= 85) {
      recommendations.push(
        "🎉 Selamat! Anda memiliki kemampuan TPA yang sangat baik. Pertahankan konsistensi belajar dan terus asah kemampuan di semua aspek."
      );
    } else if (percentage >= 70) {
      recommendations.push(
        "👍 Kemampuan TPA Anda sudah baik. Fokus pada peningkatan di area yang masih lemah untuk mencapai level excellent."
      );
    } else if (percentage >= 55) {
      recommendations.push(
        "📚 Kemampuan TPA Anda cukup, namun masih ada ruang untuk perbaikan. Perbanyak latihan soal dan pelajari strategi penyelesaian."
      );
    } else {
      recommendations.push(
        "💪 Jangan menyerah! Kemampuan TPA dapat ditingkatkan dengan latihan yang konsisten. Mulai dari dasar dan bertahap tingkatkan kesulitan."
      );
    }

    // Fungsi untuk mengkonversi kode kategori menjadi nama
    const getCategoryName = (categoryCode: string): string => {
      const categoryNames: { [key: string]: string } = {
        TES_VERBAL: "Kemampuan Verbal",
        TES_ANGKA: "Kemampuan Numerik",
        TES_LOGIKA: "Penalaran Logis",
        TES_GAMBAR: "Kemampuan Spasial",
      };
      return categoryNames[categoryCode] || categoryCode;
    };

    // Rekomendasi berdasarkan kategori terlemah
    if (categoryBreakdown) {
      const categories = Object.entries(categoryBreakdown) as [string, CategoryBreakdown][];
      const weakestCategory = categories.reduce((prev, current) =>
        prev[1].percentage < current[1].percentage ? prev : current
      );

      const categoryName = getCategoryName(weakestCategory[0]);
      const categoryPercentage = weakestCategory[1].percentage;

      if (categoryPercentage < 60) {
        recommendations.push(
          `🎯 Area yang perlu diprioritaskan: ${categoryName} (${categoryPercentage}%). Alokasikan lebih banyak waktu untuk mempelajari dan berlatih soal-soal di kategori ini.`
        );
      }
    }

    return recommendations;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {autoRetrying
              ? `Mencoba lagi... (${retryCount}/3)`
              : "Memuat detail hasil tes..."}
          </p>
          {autoRetrying && (
            <p className="mt-2 text-sm text-yellow-600">
              🔄 Sedang mencoba memuat ulang data sesi
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-400 text-6xl mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Terjadi Kesalahan
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>

          {retryCount < 3 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">
                🔄 Sistem akan mencoba memuat ulang secara otomatis dalam
                beberapa detik...
              </p>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              <strong>Tips:</strong> Pastikan koneksi internet Anda stabil dan
              sesi masih aktif.
            </p>
          </div>

          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => {
                setRetryCount(0);
                fetchSessionDetail();
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              🔄 Coba Lagi
            </button>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              🔄 Refresh Halaman
            </button>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-gray-400 text-6xl mb-4"></div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Data sesi tidak tersedia
          </h3>
          <p className="text-gray-600 mb-4">
            Sesi tes yang Anda cari tidak ditemukan atau telah kedaluwarsa
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800 text-sm">
              <strong>Tips:</strong> Pastikan Anda mengakses halaman ini melalui
              link yang valid dan sesi Anda masih aktif.
            </p>
          </div>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              🔄 Refresh Halaman
            </button>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ← Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PesertaHeader handleLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Detail Hasil Tes
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Detail lengkap hasil tes Anda
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              ← Kembali
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Informasi Tes - Grid Layout */}
        <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl text-center font-bold text-gray-900 mb-8">
              Informasi Tes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {/* Data Peserta */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-6 py-8 sm:px-8 sm:py-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-6">
                    Data Peserta
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Nama:</span>
                      <span className="ml-2 text-gray-900">
                        {session.user_name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900">
                        {session.user_email || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        ID Peserta:
                      </span>
                      <span className="ml-2 text-gray-900 text-sm font-mono">
                        {session.user_registration_id ||
                          session.userId ||
                          "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Tes */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-6 py-8 sm:px-8 sm:py-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-6">
                    Data Tes
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Tes:</span>
                      <span className="ml-2 text-gray-900">
                        {session.test_name || session.test?.name || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Durasi:</span>
                      <span className="ml-2 text-gray-900">
                        {session.test_duration || session.test?.duration || 0}{" "}
                        menit
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Mulai:</span>
                      <span className="ml-2 text-gray-900">
                        {formatDate(session.startTime)}
                      </span>
                    </div>
                    {session.status === "COMPLETED" && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Selesai:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {formatDate(session.endTime)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Tes */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-6 py-8 sm:px-8 sm:py-8">
                  <h2 className="text-xl font-medium text-gray-900 mb-6">
                    Status Tes
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">Status:</span>
                      <span
                        className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                          session.status === "COMPLETED"
                            ? "bg-gray-100 text-gray-800"
                            : session.status === "ONGOING"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {session.status === "COMPLETED"
                          ? "Selesai"
                          : session.status === "ONGOING"
                          ? "Sedang Berlangsung"
                          : "Ditinggalkan"}
                      </span>
                    </div>
                    {session.status === "COMPLETED" && (
                      <>
                        <div>
                          <span className="font-medium text-gray-700">
                            Skor Total:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {session.score || 0} dari {session.maxScore || 0}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Waktu Pengerjaan:
                          </span>
                          <span className="ml-2 text-gray-900">
                            {session.endTime && session.startTime
                              ? (() => {
                                  const durationMs =
                                    new Date(session.endTime).getTime() -
                                    new Date(session.startTime).getTime();
                                  const hours = Math.floor(
                                    durationMs / (1000 * 60 * 60)
                                  );
                                  const minutes = Math.floor(
                                    (durationMs % (1000 * 60 * 60)) /
                                      (1000 * 60)
                                  );
                                  const seconds = Math.floor(
                                    (durationMs % (1000 * 60)) / 1000
                                  );

                                  if (hours > 0) {
                                    return `${hours} jam ${minutes} menit ${seconds} detik`;
                                  } else if (minutes > 0) {
                                    return `${minutes} menit ${seconds} detik`;
                                  } else {
                                    return `${seconds} detik`;
                                  }
                                })()
                              : "N/A"}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {session.status === "COMPLETED" && (
          <>
            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-xl text-center font-bold text-gray-900 mb-8">
                  Hasil Akhir
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-5">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Nilai</div>
                    <div
                      className={`text-3xl font-bold ${getScoreColor(
                        session.overallPercentage ||
                          calculatePercentage(session.score, session.maxScore)
                      )}`}
                    >
                      {session.score}/{session.maxScore}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Persentase</div>
                    <div
                      className={`text-3xl font-bold ${getScoreColor(
                        session.overallPercentage ||
                          calculatePercentage(session.score, session.maxScore)
                      )}`}
                    >
                      {session.overallPercentage ||
                        calculatePercentage(session.score, session.maxScore)}
                      %
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Status</div>
                    {(session.overallPercentage ||
                      calculatePercentage(session.score, session.maxScore)) >=
                    60 ? (
                      <div className="text-2xl font-bold text-green-600">
                        Lulus
                      </div>
                    ) : (
                      <div className="text-2xl font-bold text-red-600">
                        Gagal
                      </div>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Pesan</div>
                    <div className="text-lg font-bold text-blue-600">
                      {getScoreMessage(
                        session.overallPercentage ||
                          calculatePercentage(session.score, session.maxScore)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-xl text-center font-bold text-gray-900 mb-8">
                  Hasil Tes Potensi Akademik
                </h2>
                {/* Category Breakdown */}
                {session.categoryBreakdown && (
                  <div className="rounded-lg mb-1">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-6">
                        Komponen TPA
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.entries(session.categoryBreakdown)
                          .filter(([category, data]) => data.maxScore > 0)
                          .map(([category, data]) => (
                            <div
                              key={category}
                              className="bg-gray-50 rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center ">
                                  <span className="text-2xl">
                                    {getCategoryIcon(category)}
                                  </span>
                                  <h4 className="font-medium text-gray-900">
                                    {getCategoryName(category)}
                                  </h4>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">
                                    Skor:
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    {data.score}/{data.maxScore}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">
                                    Persentase:
                                  </span>
                                  <span
                                    className={`font-bold ${getScoreColor(
                                      data.percentage
                                    )}`}
                                  >
                                    {data.percentage}%
                                  </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      data.percentage >= 80
                                        ? "bg-green-500"
                                        : data.percentage >= 60
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{
                                      width: `${Math.min(
                                        data.percentage,
                                        100
                                      )}%`,
                                    }}
                                  ></div>
                                </div>

                                <div className="text-xs mt-2">
                                  <span
                                    className={`px-2 py-1 rounded-full ${
                                      data.percentage >= 80
                                        ? "bg-green-100 text-green-800"
                                        : data.percentage >= 60
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {data.percentage >= 80
                                      ? "Sangat Baik"
                                      : data.percentage >= 60
                                      ? "Baik"
                                      : "Perlu Perbaikan"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistik Z-Score & Interpretasi */}
                <div className="rounded-lg mb-6">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {/* Statistik Z-Score */}
                      <div className="bg-blue-50 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Statistik Z-Score
                        </h3>

                        <div className="space-y-3">
                          <div>
                            <span className="font-semibold text-gray-700">
                              Z-Score:
                            </span>
                            <span className="ml-2 text-xl font-bold text-blue-600">
                              {calculateZScore(session.overallPercentage)}
                            </span>
                          </div>

                          <div>
                            <span className="font-semibold text-gray-700">
                              Persentil:
                            </span>
                            <span className="ml-2 text-lg font-medium text-gray-800">
                              {session.overallPercentage}%
                            </span>
                          </div>

                          <div>
                            <span className="font-semibold text-gray-700">
                              Detail:
                            </span>
                            <span className="ml-2 text-sm text-gray-600">
                              Posisi relatif di atas rata-rata populasi
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Interpretasi & Rekomendasi */}
                      <div className="bg-green-50 rounded-lg p-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          Interpretasi & Rekomendasi
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <span className="font-semibold text-gray-700">
                              Interpretasi:
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                              {(() => {
                                const percentage = session.overallPercentage;
                                const categoryBreakdown =
                                  session.categoryBreakdown;

                                // Analisis distribusi kemampuan per kategori - hanya kategori yang ada dalam tes
                                const categories = Object.entries(
                                  categoryBreakdown
                                ).filter(
                                  ([name, data]) => data.maxScore > 0
                                ) as [string, CategoryBreakdown][];
                                const categoryPercentages = categories.map(
                                  ([name, data]) => ({
                                    name: getCategoryName(name),
                                    percentage: data.percentage,
                                  })
                                );

                                const excellentCategories =
                                  categoryPercentages.filter(
                                    (cat) => cat.percentage >= 85
                                  );
                                const goodCategories =
                                  categoryPercentages.filter(
                                    (cat) =>
                                      cat.percentage >= 70 &&
                                      cat.percentage < 85
                                  );
                                const averageCategories =
                                  categoryPercentages.filter(
                                    (cat) =>
                                      cat.percentage >= 55 &&
                                      cat.percentage < 70
                                  );
                                const weakCategories =
                                  categoryPercentages.filter(
                                    (cat) => cat.percentage < 55
                                  );

                                let interpretation = "";

                                if (percentage >= 85) {
                                  interpretation = `Kemampuan TPA Anda sangat excellent! Anda berada di kategori superior dengan kemampuan analisis yang luar biasa. `;
                                  if (excellentCategories.length >= 3) {
                                    interpretation += `Anda menunjukkan konsistensi tinggi di hampir semua aspek TPA dengan ${excellentCategories.length} kategori mencapai level excellent.`;
                                  } else if (excellentCategories.length >= 2) {
                                    interpretation += `Anda memiliki keunggulan di ${excellentCategories
                                      .map((c) => c.name)
                                      .join(
                                        " dan "
                                      )}, dengan potensi besar untuk mengoptimalkan kategori lainnya.`;
                                  } else {
                                    interpretation += `Meskipun skor keseluruhan excellent, masih ada peluang untuk meningkatkan konsistensi di semua kategori.`;
                                  }
                                } else if (percentage >= 75) {
                                  interpretation = `Kemampuan TPA Anda sangat baik dan berada di atas rata-rata populasi. `;
                                  if (excellentCategories.length > 0) {
                                    interpretation += `Anda menunjukkan keunggulan di ${excellentCategories
                                      .map((c) => c.name)
                                      .join(
                                        ", "
                                      )} dengan kemampuan analitis yang kuat. `;
                                  }
                                  if (goodCategories.length > 0) {
                                    interpretation += `Kategori ${goodCategories
                                      .map((c) => c.name)
                                      .join(
                                        ", "
                                      )} juga menunjukkan performa yang baik. `;
                                  }
                                  interpretation += `Dengan sedikit peningkatan, Anda berpotensi mencapai level excellent.`;
                                } else if (percentage >= 65) {
                                  interpretation = `Kemampuan TPA Anda berada pada level yang baik dan sesuai dengan rata-rata populasi. `;
                                  if (goodCategories.length > 0) {
                                    interpretation += `Anda menunjukkan kemampuan yang baik di ${goodCategories
                                      .map((c) => c.name)
                                      .join(", ")}. `;
                                  }
                                  if (averageCategories.length > 0) {
                                    interpretation += `Kategori ${averageCategories
                                      .map((c) => c.name)
                                      .join(
                                        ", "
                                      )} berada pada level rata-rata dengan potensi pengembangan. `;
                                  }
                                  interpretation += `Anda memiliki fondasi yang solid untuk pengembangan lebih lanjut di semua aspek.`;
                                } else if (percentage >= 55) {
                                  interpretation = `Kemampuan TPA Anda cukup namun masih ada ruang signifikan untuk perbaikan. `;
                                  if (averageCategories.length > 0) {
                                    interpretation += `Kategori ${averageCategories
                                      .map((c) => c.name)
                                      .join(
                                        ", "
                                      )} menunjukkan fondasi yang cukup baik. `;
                                  }
                                  if (weakCategories.length > 0) {
                                    interpretation += `Namun, ${weakCategories
                                      .map((c) => c.name)
                                      .join(
                                        ", "
                                      )} memerlukan perhatian khusus. `;
                                  }
                                  interpretation += `Dengan latihan yang tepat dan terstruktur, Anda dapat meningkatkan performa secara substansial.`;
                                } else {
                                  interpretation = `Kemampuan TPA Anda saat ini memerlukan perhatian khusus dan latihan intensif. `;
                                  if (averageCategories.length > 0) {
                                    interpretation += `Meskipun demikian, ${averageCategories
                                      .map((c) => c.name)
                                      .join(
                                        ", "
                                      )} menunjukkan potensi yang dapat dikembangkan. `;
                                  }
                                  if (weakCategories.length > 0) {
                                    interpretation += `Fokus utama perlu diberikan pada ${weakCategories
                                      .map((c) => c.name)
                                      .join(", ")}. `;
                                  }
                                  interpretation += `Jangan berkecil hati, dengan dedikasi dan strategi yang tepat, peningkatan yang signifikan sangat mungkin dicapai.`;
                                }

                                return interpretation;
                              })()}
                            </p>
                          </div>

                          <div>
                            <span className="font-semibold text-gray-700">
                              Rekomendasi:
                            </span>
                            <p className="text-sm text-gray-600 mt-1">
                              {(() => {
                                const percentage = session.overallPercentage;
                                const categoryBreakdown =
                                  session.categoryBreakdown;

                                // Analisis detail per kategori untuk rekomendasi yang lebih spesifik - hanya kategori yang ada dalam tes
                                const categories = Object.entries(
                                  categoryBreakdown
                                ).filter(
                                  ([name, data]) => data.maxScore > 0
                                ) as [string, CategoryBreakdown][];
                                const categoryAnalysis = categories
                                  .map(([name, data]) => ({
                                    name: getCategoryName(name),
                                    key: name,
                                    percentage: data.percentage,
                                    score: data.score,
                                    maxScore: data.maxScore,
                                  }))
                                  .sort((a, b) => a.percentage - b.percentage); // Urutkan dari terlemah

                                const weakestCategory = categoryAnalysis[0];
                                const strongestCategory =
                                  categoryAnalysis[categoryAnalysis.length - 1];
                                const weakCategories = categoryAnalysis.filter(
                                  (cat) => cat.percentage < 60
                                );
                                const strongCategories =
                                  categoryAnalysis.filter(
                                    (cat) => cat.percentage >= 75
                                  );

                                let recommendation = "";

                                if (percentage >= 85) {
                                  recommendation = `Pertahankan konsistensi latihan dan fokus pada fine-tuning di area yang masih bisa ditingkatkan. `;
                                  if (weakestCategory.percentage < 80) {
                                    recommendation += `Khususnya di ${
                                      weakestCategory.name
                                    } (${weakestCategory.percentage.toFixed(
                                      1
                                    )}%) yang masih bisa dioptimalkan untuk mencapai konsistensi excellent di semua kategori. `;
                                  }
                                  if (strongCategories.length >= 3) {
                                    recommendation += `Manfaatkan kekuatan Anda di ${strongCategories
                                      .slice(0, 2)
                                      .map((c) => c.name)
                                      .join(
                                        " dan "
                                      )} untuk membantu meningkatkan kategori lainnya.`;
                                  } else {
                                    recommendation += `Lanjutkan dengan latihan rutin dan tantang diri dengan soal-soal tingkat kompetisi.`;
                                  }
                                } else if (percentage >= 75) {
                                  recommendation = `Fokus pada peningkatan di area yang masih lemah untuk mencapai level excellent. `;
                                  if (weakCategories.length > 0) {
                                    recommendation += `Prioritaskan latihan intensif di ${weakCategories
                                      .map(
                                        (c) =>
                                          `${c.name} (${c.percentage.toFixed(
                                            1
                                          )}%)`
                                      )
                                      .join(
                                        ", "
                                      )} dengan soal-soal yang lebih menantang. `;
                                  }
                                  if (strongCategories.length > 0) {
                                    recommendation += `Manfaatkan kekuatan Anda di ${strongCategories
                                      .map((c) => c.name)
                                      .join(
                                        ", "
                                      )} sebagai fondasi untuk meningkatkan kategori lainnya. `;
                                  }
                                  recommendation += `Alokasikan 60% waktu latihan untuk kategori terlemah dan 40% untuk mempertahankan kategori yang sudah baik.`;
                                } else if (percentage >= 65) {
                                  recommendation = `Perbanyak latihan soal dengan fokus pada pemahaman konsep dasar di semua kategori. `;
                                  if (weakCategories.length > 0) {
                                    recommendation += `Berikan perhatian khusus pada ${weakCategories
                                      .map(
                                        (c) =>
                                          `${c.name} (${c.percentage.toFixed(
                                            1
                                          )}%)`
                                      )
                                      .join(
                                        ", "
                                      )} dengan mempelajari strategi penyelesaian yang tepat. `;
                                  }
                                  if (strongestCategory.percentage >= 70) {
                                    recommendation += `Gunakan kekuatan Anda di ${
                                      strongestCategory.name
                                    } (${strongestCategory.percentage.toFixed(
                                      1
                                    )}%) sebagai motivasi dan model pembelajaran untuk kategori lain. `;
                                  }
                                  recommendation += `Latihan rutin 30-45 menit per hari dengan pembagian waktu yang proporsional untuk setiap kategori akan membantu peningkatan yang stabil.`;
                                } else if (percentage >= 55) {
                                  recommendation = `Mulai dengan memperkuat fondasi di semua area TPA secara sistematis. `;
                                  if (weakestCategory.percentage < 45) {
                                    recommendation += `Prioritaskan ${
                                      weakestCategory.name
                                    } (${weakestCategory.percentage.toFixed(
                                      1
                                    )}%) dengan latihan intensif dan bimbingan tambahan jika diperlukan. `;
                                  }
                                  if (strongestCategory.percentage >= 60) {
                                    recommendation += `Kembangkan kepercayaan diri melalui ${
                                      strongestCategory.name
                                    } (${strongestCategory.percentage.toFixed(
                                      1
                                    )}%) sambil secara bertahap meningkatkan kategori lainnya. `;
                                  }
                                  recommendation += `Ikuti program bimbingan terstruktur dengan jadwal latihan harian yang konsisten, mulai dari level dasar hingga menengah.`;
                                } else {
                                  recommendation = `Disarankan mengikuti program bimbingan intensif dengan pendekatan step-by-step yang disesuaikan dengan kebutuhan individual. `;
                                  if (weakestCategory.percentage < 35) {
                                    recommendation += `Mulai dari penguatan ${
                                      weakestCategory.name
                                    } (${weakestCategory.percentage.toFixed(
                                      1
                                    )}%) dengan materi dasar dan latihan terbimbing. `;
                                  }
                                  if (strongestCategory.percentage >= 45) {
                                    recommendation += `Bangun kepercayaan diri melalui ${
                                      strongestCategory.name
                                    } (${strongestCategory.percentage.toFixed(
                                      1
                                    )}%) sebagai titik awal pembelajaran. `;
                                  }
                                  recommendation += `Fokus pada pemahaman konsep fundamental sebelum berlatih soal-soal kompleks. Pertimbangkan untuk mengikuti kelas persiapan TPA yang terstruktur.`;
                                }

                                return recommendation;
                              })()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analisis Detail Komponen TPA */}
                {session.categoryBreakdown && (
                  <div className="rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-6">
                        Analisis Detail Komponen TPA
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {Object.entries(session.categoryBreakdown)
                          .filter(
                            ([category, data]) => (data as any).maxScore > 0
                          )
                          .map(([category, data]) => {
                            const getCategoryAnalysis = (
                              cat: string,
                              percentage: number,
                              score: number,
                              maxScore: number
                            ) => {
                              // Standar Interpretasi Nasional TPA
                              const getStandardInterpretation = (
                                perc: number
                              ) => {
                                if (perc >= 95)
                                  return {
                                    level: "Superior",
                                    desc: "Kemampuan luar biasa (Top 5%)",
                                    percentile: "95-100",
                                  };
                                if (perc >= 85)
                                  return {
                                    level: "Sangat Tinggi",
                                    desc: "Kemampuan sangat baik (Top 15%)",
                                    percentile: "85-94",
                                  };
                                if (perc >= 75)
                                  return {
                                    level: "Tinggi",
                                    desc: "Kemampuan baik (Top 25%)",
                                    percentile: "75-84",
                                  };
                                if (perc >= 60)
                                  return {
                                    level: "Sedang-Tinggi",
                                    desc: "Kemampuan cukup baik (Top 40%)",
                                    percentile: "60-74",
                                  };
                                if (perc >= 40)
                                  return {
                                    level: "Sedang",
                                    desc: "Kemampuan rata-rata (40-60%)",
                                    percentile: "40-59",
                                  };
                                if (perc >= 25)
                                  return {
                                    level: "Sedang-Rendah",
                                    desc: "Perlu peningkatan (25-40%)",
                                    percentile: "25-39",
                                  };
                                return {
                                  level: "Rendah",
                                  desc: "Perlu perbaikan menyeluruh (Bottom 25%)",
                                  percentile: "0-24",
                                };
                              };

                              // Analisis Perbandingan dengan Rata-rata Nasional
                              const getComparisonAnalysis = (perc: number) => {
                                const nationalAvg = 65; // Asumsi rata-rata nasional
                                const diff = perc - nationalAvg;
                                if (diff >= 20)
                                  return {
                                    status: "Jauh di atas rata-rata",
                                    color: "text-green-700",
                                    icon: "",
                                  };
                                if (diff >= 10)
                                  return {
                                    status: "Di atas rata-rata",
                                    color: "text-green-600",
                                    icon: "",
                                  };
                                if (diff >= -5)
                                  return {
                                    status: "Sekitar rata-rata",
                                    color: "text-yellow-600",
                                    icon: "",
                                  };
                                if (diff >= -15)
                                  return {
                                    status: "Di bawah rata-rata",
                                    color: "text-orange-600",
                                    icon: "",
                                  };
                                return {
                                  status: "Jauh di bawah rata-rata",
                                  color: "text-red-600",
                                  icon: "",
                                };
                              };

                              // Prediksi Potensi Akademik
                              const getAcademicPotential = (perc: number) => {
                                if (perc >= 85)
                                  return "Sangat berpotensi untuk program studi kompetitif (Kedokteran, Teknik, dll)";
                                if (perc >= 75)
                                  return "Berpotensi untuk program studi pilihan dengan persiapan tambahan";
                                if (perc >= 60)
                                  return "Cocok untuk berbagai program studi dengan fokus peningkatan";
                                if (perc >= 40)
                                  return "Perlu persiapan intensif untuk program studi yang diinginkan";
                                return "Disarankan mengikuti program remedial sebelum melanjutkan ke jenjang berikutnya";
                              };

                              const analyses = {
                                TES_VERBAL: {
                                  name: "Kemampuan Verbal",
                                  shortName: "Verbal",
                                  color: "bg-blue-50 border-blue-200",
                                  icon: "",
                                  description:
                                    "Mengukur kemampuan memahami dan menganalisis teks, sinonim, antonim, dan analogi kata",

                                  // Analisis Kekuatan & Kelemahan
                                  strengths:
                                    percentage >= 75
                                      ? "Pemahaman konsep verbal sangat baik, mampu menganalisis hubungan kata dengan tepat, dan memiliki kosakata yang luas"
                                      : percentage >= 60
                                      ? "Pemahaman dasar bahasa baik, dapat menangkap makna teks sederhana dengan cukup baik"
                                      : "Dasar pemahaman bahasa ada, namun perlu pengembangan kosakata dan kemampuan analisis",

                                  weaknesses:
                                    percentage < 60
                                      ? "Perlu peningkatan signifikan dalam analisis teks kompleks, pemahaman sinonim-antonim, dan penguasaan kosakata"
                                      : percentage < 80
                                      ? "Dapat ditingkatkan pada soal analogi yang lebih kompleks dan pemahaman teks akademik"
                                      : "Pertahankan kemampuan dengan tantangan yang lebih tinggi",

                                  // Rekomendasi Spesifik
                                  recommendations:
                                    percentage >= 80
                                      ? [
                                          "Pertahankan dengan membaca literatur akademik",
                                          "Latih soal verbal tingkat olimpiade",
                                          "Pelajari etimologi kata untuk memperdalam pemahaman",
                                        ]
                                      : percentage >= 60
                                      ? [
                                          "Perbanyak membaca artikel ilmiah",
                                          "Latihan sinonim-antonim rutin",
                                          "Belajar analogi kata bertingkat",
                                          "Gunakan aplikasi kosakata harian",
                                        ]
                                      : [
                                          "Mulai dari kosakata dasar 1000 kata",
                                          "Baca artikel sederhana setiap hari",
                                          "Gunakan kamus untuk setiap kata baru",
                                          "Latihan soal verbal dasar",
                                        ],

                                  // Tingkat Kesulitan yang Cocok
                                  difficulty:
                                    percentage >= 85
                                      ? "Siap untuk soal verbal tingkat universitas dan tes masuk PTN"
                                      : percentage >= 70
                                      ? "Cocok untuk soal tingkat SMA dan persiapan UTBK"
                                      : percentage >= 50
                                      ? "Mulai dari soal tingkat SMP-SMA"
                                      : "Fokus pada soal dasar dan penguasaan kosakata",

                                  // Waktu Optimal
                                  timeManagement:
                                    percentage >= 80
                                      ? "Dapat menyelesaikan soal dengan cepat dan akurat"
                                      : percentage >= 60
                                      ? "Perlu latihan kecepatan membaca dan analisis"
                                      : "Fokus pada akurasi terlebih dahulu, kecepatan akan mengikuti",

                                  // Standar Nasional
                                  standardLevel:
                                    getStandardInterpretation(percentage),
                                  comparison: getComparisonAnalysis(percentage),
                                  academicPotential:
                                    getAcademicPotential(percentage),
                                },

                                TES_ANGKA: {
                                  name: "Kemampuan Numerik",
                                  shortName: "Numerik",
                                  color: "bg-green-50 border-green-200",
                                  icon: "",
                                  description:
                                    "Mengukur kemampuan operasi matematika dasar, deret angka, dan pemecahan masalah numerik",

                                  strengths:
                                    percentage >= 75
                                      ? "Kemampuan matematika sangat solid, dapat menyelesaikan deret kompleks dan operasi dengan akurasi tinggi"
                                      : percentage >= 60
                                      ? "Pemahaman konsep dasar matematika baik, dapat menyelesaikan soal standar dengan benar"
                                      : "Pemahaman konsep dasar matematika perlu diperkuat dengan latihan intensif",

                                  weaknesses:
                                    percentage < 60
                                      ? "Perlu peningkatan menyeluruh dalam operasi dasar, deret angka, dan pemecahan masalah matematika"
                                      : percentage < 80
                                      ? "Dapat ditingkatkan pada soal matematika aplikatif dan deret yang lebih kompleks"
                                      : "Tantang diri dengan soal matematika tingkat lanjut",

                                  recommendations:
                                    percentage >= 80
                                      ? [
                                          "Latih soal matematika tingkat olimpiade",
                                          "Pelajari statistik dan probabilitas",
                                          "Fokus pada soal cerita kompleks",
                                        ]
                                      : percentage >= 60
                                      ? [
                                          "Kuatkan operasi dasar (+-×÷)",
                                          "Latihan deret angka rutin",
                                          "Pelajari pola matematika",
                                          "Latih soal cerita sederhana",
                                        ]
                                      : [
                                          "Hafalkan tabel perkalian 1-12",
                                          "Latihan operasi dasar setiap hari",
                                          "Mulai dari soal matematika SD-SMP",
                                          "Gunakan kalkulator untuk verifikasi",
                                        ],

                                  difficulty:
                                    percentage >= 85
                                      ? "Siap untuk matematika tingkat universitas dan tes masuk teknik"
                                      : percentage >= 70
                                      ? "Cocok untuk matematika SMA dan persiapan SAINTEK"
                                      : percentage >= 50
                                      ? "Mulai dari matematika SMP-SMA"
                                      : "Fokus pada operasi dasar dan konsep fundamental",

                                  timeManagement:
                                    percentage >= 80
                                      ? "Dapat menyelesaikan perhitungan dengan cepat dan efisien"
                                      : percentage >= 60
                                      ? "Perlu latihan kecepatan perhitungan mental"
                                      : "Fokus pada akurasi, gunakan strategi step-by-step",

                                  standardLevel:
                                    getStandardInterpretation(percentage),
                                  comparison: getComparisonAnalysis(percentage),
                                  academicPotential:
                                    getAcademicPotential(percentage),
                                },

                                TES_LOGIKA: {
                                  name: "Kemampuan Logika",
                                  shortName: "Logika",
                                  color: "bg-purple-50 border-purple-200",
                                  icon: "",
                                  description:
                                    "Mengukur kemampuan penalaran logis, deduksi, induksi, dan pemecahan masalah sistematis",

                                  strengths:
                                    percentage >= 75
                                      ? "Kemampuan penalaran logis sangat baik, dapat berpikir sistematis dan analitis dengan pola yang kompleks"
                                      : percentage >= 60
                                      ? "Kemampuan penalaran dasar baik, dapat mengikuti alur logika sederhana dengan benar"
                                      : "Dasar penalaran logis ada, namun perlu pengembangan pola pikir sistematis dan terstruktur",

                                  weaknesses:
                                    percentage < 60
                                      ? "Perlu peningkatan signifikan dalam penalaran deduktif, induktif, dan pemecahan masalah kompleks"
                                      : percentage < 80
                                      ? "Dapat ditingkatkan pada soal logika multi-tahap dan penalaran abstrak"
                                      : "Tantang dengan soal logika tingkat kompetisi",

                                  recommendations:
                                    percentage >= 80
                                      ? [
                                          "Latih soal logika tingkat olimpiade",
                                          "Pelajari logika formal dan silogisme",
                                          "Berlatih puzzle kompleks",
                                        ]
                                      : percentage >= 60
                                      ? [
                                          "Latihan soal penalaran rutin",
                                          "Pelajari pola logika dasar",
                                          "Berlatih deduksi-induksi",
                                          "Mainkan game puzzle logika",
                                        ]
                                      : [
                                          "Mulai dari logika sederhana",
                                          "Latihan pola dasar setiap hari",
                                          "Belajar berpikir step-by-step",
                                          "Gunakan diagram untuk membantu",
                                        ],

                                  difficulty:
                                    percentage >= 85
                                      ? "Siap untuk tes logika tingkat universitas dan kompetisi"
                                      : percentage >= 70
                                      ? "Cocok untuk soal logika SMA dan UTBK"
                                      : percentage >= 50
                                      ? "Mulai dari logika SMP-SMA"
                                      : "Fokus pada pola dasar dan penalaran sederhana",

                                  timeManagement:
                                    percentage >= 80
                                      ? "Dapat menganalisis pola dengan cepat dan akurat"
                                      : percentage >= 60
                                      ? "Perlu latihan kecepatan analisis pola"
                                      : "Fokus pada pemahaman konsep, kecepatan akan mengikuti",

                                  standardLevel:
                                    getStandardInterpretation(percentage),
                                  comparison: getComparisonAnalysis(percentage),
                                  academicPotential:
                                    getAcademicPotential(percentage),
                                },

                                TES_GAMBAR: {
                                  name: "Kemampuan Spasial",
                                  shortName: "Gambar",
                                  color: "bg-yellow-50 border-yellow-200",
                                  icon: "",
                                  description:
                                    "Mengukur kemampuan visualisasi spasial, pengenalan pola, dan analisis bentuk geometris",

                                  strengths:
                                    percentage >= 75
                                      ? "Kemampuan visualisasi spasial sangat baik, dapat menganalisis bentuk 3D dan pola kompleks dengan akurat"
                                      : percentage >= 60
                                      ? "Kemampuan visual dasar baik, dapat mengenali pola sederhana dan orientasi spasial"
                                      : "Dasar kemampuan visual ada, namun perlu latihan intensif pengenalan pola dan orientasi spasial",

                                  weaknesses:
                                    percentage < 60
                                      ? "Perlu peningkatan menyeluruh dalam analisis visual, pengenalan pola, dan kemampuan spasial"
                                      : percentage < 80
                                      ? "Dapat ditingkatkan pada soal spasial 3D dan transformasi geometris yang kompleks"
                                      : "Tantang dengan soal spasial tingkat arsitektur dan engineering",

                                  recommendations:
                                    percentage >= 80
                                      ? [
                                          "Latih soal spasial tingkat arsitektur",
                                          "Pelajari geometri 3D lanjut",
                                          "Berlatih dengan software CAD",
                                        ]
                                      : percentage >= 60
                                      ? [
                                          "Latihan pengenalan pola rutin",
                                          "Belajar rotasi dan refleksi",
                                          "Latih visualisasi spasial",
                                          "Mainkan game puzzle 3D",
                                        ]
                                      : [
                                          "Mulai dari pola 2D sederhana",
                                          "Latihan menggambar bentuk dasar",
                                          "Belajar orientasi spasial",
                                          "Gunakan manipulatif fisik",
                                        ],

                                  difficulty:
                                    percentage >= 85
                                      ? "Siap untuk tes spasial tingkat arsitektur dan engineering"
                                      : percentage >= 70
                                      ? "Cocok untuk soal spasial SMA dan tes masuk teknik"
                                      : percentage >= 50
                                      ? "Mulai dari soal visual SMP-SMA"
                                      : "Fokus pada pola dasar dan orientasi sederhana",

                                  timeManagement:
                                    percentage >= 80
                                      ? "Dapat memvisualisasikan dengan cepat dan akurat"
                                      : percentage >= 60
                                      ? "Perlu latihan kecepatan visualisasi"
                                      : "Fokus pada akurasi visualisasi, gunakan bantuan sketsa",

                                  standardLevel:
                                    getStandardInterpretation(percentage),
                                  comparison: getComparisonAnalysis(percentage),
                                  academicPotential:
                                    getAcademicPotential(percentage),
                                },
                              };
                              return (
                                analyses[cat as keyof typeof analyses] ||
                                analyses.TES_VERBAL
                              );
                            };

                            const analysis = getCategoryAnalysis(
                              category,
                              data.percentage,
                              data.score,
                              data.maxScore
                            );

                            // Hitung jumlah soal dari answers
                            const categoryAnswers =
                              session?.answers?.filter(
                                (answer: Answer) =>
                                  answer.question.category === category
                              ) || [];
                            const correctAnswers = categoryAnswers.filter(
                              (answer: Answer) => answer.isCorrect
                            ).length;
                            const totalQuestions = categoryAnswers.length;

                            return (
                              <div
                                key={category}
                                className={`p-4 rounded-lg ${analysis.color} space-y-3`}
                              >
                                {/* Header Section */}
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-2xl">
                                      {analysis.icon}
                                    </span>
                                    <div>
                                      <h4 className="text-base font-bold text-gray-800">
                                        {analysis.shortName}
                                      </h4>
                                      <div className="text-2xl font-bold text-gray-800">
                                        {data.percentage.toFixed(1)}%
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right text-sm text-gray-600">
                                    <div className="text-xs">
                                      {data.score}/{data.maxScore} poin
                                    </div>
                                  </div>
                                </div>

                                {/* Compact Info Grid */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="bg-white/70 p-2 rounded">
                                    <div className="font-medium text-blue-600">
                                      Level
                                    </div>
                                    <div className="text-gray-700">
                                      {analysis.standardLevel.level}
                                    </div>
                                  </div>
                                  <div className="bg-white/70 p-2 rounded">
                                    <div className="font-medium text-gray-600">
                                      Persentil
                                    </div>
                                    <div className="text-gray-700">
                                      {analysis.standardLevel.percentile}
                                    </div>
                                  </div>
                                  <div className="bg-white/70 p-2 rounded col-span-2">
                                    <div className="flex items-center space-x-1">
                                      <span>{analysis.comparison.icon}</span>
                                      <span
                                        className={`font-medium ${analysis.comparison.color}`}
                                      >
                                        {analysis.comparison.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Detail Analisis */}
                                <div>
                                  <div className="text-sm font-medium text-gray-700 mb-3">
                                    <span className="mr-1"></span> Detail
                                    Analisis
                                  </div>

                                  <div className="space-y-3">
                                    {/* Kekuatan & Kelemahan */}
                                    <div className="grid grid-cols-1 gap-2">
                                      <div className="bg-green-50 p-2 rounded text-xs">
                                        <div className="font-medium text-green-700 mb-1">
                                          Kekuatan
                                        </div>
                                        <p className="text-gray-700">
                                          {analysis.strengths}
                                        </p>
                                      </div>
                                      <div className="bg-orange-50 p-2 rounded text-xs">
                                        <div className="font-medium text-orange-600 mb-1">
                                          Area Pengembangan
                                        </div>
                                        <p className="text-gray-700">
                                          {analysis.weaknesses}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Rekomendasi */}
                                    <div className="bg-blue-50 p-2 rounded">
                                      <div className="font-medium text-blue-700 mb-1 text-xs">
                                        Rekomendasi
                                      </div>
                                      <ul className="text-xs text-gray-700 space-y-1">
                                        {analysis.recommendations
                                          .slice(0, 3)
                                          .map((rec, idx) => (
                                            <li
                                              key={idx}
                                              className="flex items-start"
                                            >
                                              <span className="text-blue-500 mr-1 mt-0.5">
                                                •
                                              </span>
                                              <span>{rec}</span>
                                            </li>
                                          ))}
                                      </ul>
                                    </div>

                                    {/* Prediksi Akademik */}
                                    <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
                                      <div className="font-medium text-indigo-700 mb-1 text-xs flex items-center">
                                        <span className="mr-1"></span> Potensi
                                        Akademik
                                      </div>
                                      <p className="text-xs text-gray-700">
                                        {analysis.academicPotential}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Blok 4: Hasil Tes RIASEC */}
            <div className="bg-white shadow rounded-lg mt-8">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Hasil Tes RIASEC
                    </h3>
                    <p className="text-sm text-gray-600">
                      Profil Minat dan Kepribadian Karir
                    </p>
                  </div>
                </div>

                {/* Check if RIASEC data is available */}
                {session.score_realistic !== undefined &&
                session.score_investigative !== undefined &&
                session.score_artistic !== undefined &&
                session.score_social !== undefined &&
                session.score_enterprising !== undefined &&
                session.score_conventional !== undefined ? (
                  <div className="space-y-6">
                    {/* Holland Code */}
                    {session.holland_code && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="text-center">
                          <h4 className="text-lg font-bold text-purple-800 mb-2">
                            Kode Holland Anda
                          </h4>
                          <div className="text-3xl font-bold text-purple-600 mb-2">
                            {session.holland_code}
                          </div>
                          <p className="text-sm text-purple-700">
                            Kombinasi tiga dimensi tertinggi dari profil RIASEC
                            Anda
                          </p>
                        </div>
                      </div>
                    )}

                    {/* RIASEC Scores Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Realistic */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-green-800">
                              Realistic
                            </h4>
                            <p className="text-xs text-green-600">
                              Praktis & Teknis
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-800">
                              {session.score_realistic || 0}
                            </div>
                            <div className="text-xs text-green-600">
                              dari {session.max_score_realistic || 0}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${
                                session.max_score_realistic
                                  ? (session.score_realistic /
                                      session.max_score_realistic) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-green-700 mt-2">
                          {session.max_score_realistic
                            ? `${(
                                (session.score_realistic /
                                  session.max_score_realistic) *
                                100
                              ).toFixed(1)}%`
                            : "0%"}
                        </div>
                      </div>

                      {/* Investigative */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-blue-800">
                              Investigative
                            </h4>
                            <p className="text-xs text-blue-600">
                              Analitis & Ilmiah
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-800">
                              {session.score_investigative || 0}
                            </div>
                            <div className="text-xs text-blue-600">
                              dari {session.max_score_investigative || 0}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                session.max_score_investigative
                                  ? (session.score_investigative /
                                      session.max_score_investigative) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-blue-700 mt-2">
                          {session.max_score_investigative
                            ? `${(
                                (session.score_investigative /
                                  session.max_score_investigative) *
                                100
                              ).toFixed(1)}%`
                            : "0%"}
                        </div>
                      </div>

                      {/* Artistic */}
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-pink-800">
                              Artistic
                            </h4>
                            <p className="text-xs text-pink-600">
                              Kreatif & Ekspresif
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-pink-800">
                              {session.score_artistic || 0}
                            </div>
                            <div className="text-xs text-pink-600">
                              dari {session.max_score_artistic || 0}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-pink-200 rounded-full h-2">
                          <div
                            className="bg-pink-600 h-2 rounded-full"
                            style={{
                              width: `${
                                session.max_score_artistic
                                  ? (session.score_artistic /
                                      session.max_score_artistic) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-pink-700 mt-2">
                          {session.max_score_artistic
                            ? `${(
                                (session.score_artistic /
                                  session.max_score_artistic) *
                                100
                              ).toFixed(1)}%`
                            : "0%"}
                        </div>
                      </div>

                      {/* Social */}
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-orange-800">
                              Social
                            </h4>
                            <p className="text-xs text-orange-600">
                              Membantu & Mengajar
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-800">
                              {session.score_social || 0}
                            </div>
                            <div className="text-xs text-orange-600">
                              dari {session.max_score_social || 0}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-orange-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{
                              width: `${
                                session.max_score_social
                                  ? (session.score_social /
                                      session.max_score_social) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-orange-700 mt-2">
                          {session.max_score_social
                            ? `${(
                                (session.score_social /
                                  session.max_score_social) *
                                100
                              ).toFixed(1)}%`
                            : "0%"}
                        </div>
                      </div>

                      {/* Enterprising */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-red-800">
                              Enterprising
                            </h4>
                            <p className="text-xs text-red-600">
                              Memimpin & Menjual
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-800">
                              {session.score_enterprising || 0}
                            </div>
                            <div className="text-xs text-red-600">
                              dari {session.max_score_enterprising || 0}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-red-200 rounded-full h-2">
                          <div
                            className="bg-red-600 h-2 rounded-full"
                            style={{
                              width: `${
                                session.max_score_enterprising
                                  ? (session.score_enterprising /
                                      session.max_score_enterprising) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-red-700 mt-2">
                          {session.max_score_enterprising
                            ? `${(
                                (session.score_enterprising /
                                  session.max_score_enterprising) *
                                100
                              ).toFixed(1)}%`
                            : "0%"}
                        </div>
                      </div>

                      {/* Conventional */}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-indigo-800">
                              Conventional
                            </h4>
                            <p className="text-xs text-indigo-600">
                              Terorganisir & Detail
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-indigo-800">
                              {session.score_conventional || 0}
                            </div>
                            <div className="text-xs text-indigo-600">
                              dari {session.max_score_conventional || 0}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-indigo-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{
                              width: `${
                                session.max_score_conventional
                                  ? (session.score_conventional /
                                      session.max_score_conventional) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-indigo-700 mt-2">
                          {session.max_score_conventional
                            ? `${(
                                (session.score_conventional /
                                  session.max_score_conventional) *
                                100
                              ).toFixed(1)}%`
                            : "0%"}
                        </div>
                      </div>
                    </div>

                    {/* RIASEC Interpretation */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-800 mb-3">
                        📋 Interpretasi Profil RIASEC
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">
                            Dimensi Tertinggi:
                          </h5>
                          <div className="space-y-1">
                            {(() => {
                              const scores = [
                                {
                                  name: "Realistic",
                                  score: session.score_realistic || 0,
                                  max: session.max_score_realistic || 1,
                                },
                                {
                                  name: "Investigative",
                                  score: session.score_investigative || 0,
                                  max: session.max_score_investigative || 1,
                                },
                                {
                                  name: "Artistic",
                                  score: session.score_artistic || 0,
                                  max: session.max_score_artistic || 1,
                                },
                                {
                                  name: "Social",
                                  score: session.score_social || 0,
                                  max: session.max_score_social || 1,
                                },
                                {
                                  name: "Enterprising",
                                  score: session.score_enterprising || 0,
                                  max: session.max_score_enterprising || 1,
                                },
                                {
                                  name: "Conventional",
                                  score: session.score_conventional || 0,
                                  max: session.max_score_conventional || 1,
                                },
                              ];

                              const sortedScores = scores
                                .map((s) => ({
                                  ...s,
                                  percentage: (s.score / s.max) * 100,
                                }))
                                .sort((a, b) => b.percentage - a.percentage)
                                .slice(0, 3);

                              return sortedScores.map((item, index) => (
                                <div
                                  key={item.name}
                                  className="flex justify-between"
                                >
                                  <span className="text-gray-600">
                                    {index + 1}. {item.name}
                                  </span>
                                  <span className="font-medium text-gray-800">
                                    {item.percentage.toFixed(1)}%
                                  </span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">
                            Rekomendasi Karir:
                          </h5>
                          <div className="text-gray-600 space-y-1">
                            {session.holland_code && (
                              <p>
                                Berdasarkan kode Holland{" "}
                                <strong>{session.holland_code}</strong>, Anda
                                cocok untuk bidang karir yang menggabungkan
                                karakteristik dari dimensi-dimensi tertinggi
                                Anda.
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">
                              Konsultasikan dengan konselor karir untuk panduan
                              lebih detail.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* No RIASEC Data Available */
                  <div className="text-center py-8">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Hasil RIASEC Belum Tersedia
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Tes RIASEC belum dilakukan atau hasil belum diproses.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Answers Detail */}
      {/* {session.answers && session.answers.length > 0 && (
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Detail Jawaban
            </h2>

            <div className="space-y-6">
              {session.answers.map((answer, index) => (
                <div
                  key={answer.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      Soal {index + 1}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          answer.isCorrect
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {answer.isCorrect ? "Benar" : "Salah"}
                      </span>
                      <span className="text-sm text-gray-600">
                        {answer.pointsEarned} poin
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="font-medium text-gray-700">
                        Pertanyaan:
                      </span>
                      <p className="mt-1 text-gray-900">
                        {answer.question.question}
                      </p>
                    </div>

                    {answer.question.type === "MULTIPLE_CHOICE" && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Pilihan Jawaban:
                        </span>
                        <div className="mt-1 space-y-1">
                          {(answer.question.options || []).map(
                            (option: string, optIndex: number) => (
                              <div
                                key={optIndex}
                                className="flex items-center space-x-2"
                              >
                                <span className="text-sm text-gray-600">
                                  {String.fromCharCode(65 + optIndex)}.
                                </span>
                                <span
                                  className={`text-sm ${
                                    option === answer.question.correctAnswer
                                      ? "font-bold text-green-600"
                                      : ""
                                  }`}
                                >
                                  {option}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">
                          Jawaban Anda:
                        </span>
                        <p
                          className={`mt-1 ${
                            answer.selectedAnswer ===
                            answer.question.correctAnswer
                              ? "text-green-600 font-medium"
                              : "text-red-600 font-medium"
                          }`}
                        >
                          {answer.selectedAnswer || "Tidak dijawab"}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">
                          Jawaban Benar:
                        </span>
                        <p className="mt-1 font-medium text-green-600">
                          {answer.question.correctAnswer}
                        </p>
                      </div>
                    </div>

                    {answer.question.explanation && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Penjelasan:
                        </span>
                        <p className="mt-1 text-gray-700">
                          {answer.question.explanation}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      Dijawab pada: {formatDate(answer.answeredAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}

      {/* Tips */}
      {/* <div className="bg-white shadow rounded-lg mt-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tips untuk Meningkatkan Skor
          </h3>
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <ul className="text-sm text-green-700 space-y-2">
              <li>• Perbanyak latihan soal-soal TPA</li>
              <li>• Fokus pada kategori dengan skor rendah</li>
              <li>• Manajemen waktu yang baik saat mengerjakan tes</li>
              <li>• Baca dengan teliti setiap soal dan pilihan jawaban</li>
            </ul>
          </div>
        </div>
      </div> */}
    </div>
  );
}
