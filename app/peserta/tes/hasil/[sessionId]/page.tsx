"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PesertaHeader from "../../../../components/PesertaHeader";

interface Answer {
  id: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  answeredAt: string;
  question: string;
  type: string;
  category: string;
  difficulty: string;
  options: string;
  correctAnswer: string;
  explanation?: string;
  points?: number;
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
  minimum_score?: number;
  categoryBreakdown: {
    TES_VERBAL: CategoryBreakdown;
    TES_ANGKA: CategoryBreakdown;
    TES_LOGIKA: CategoryBreakdown;
    TES_GAMBAR: CategoryBreakdown;
  };
  test: {
    name: string;
    description: string;
    duration: number;
  };
  answers: Answer[];
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

export default function TestResultsPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAnswerDetails, setShowAnswerDetails] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    fetchSessionDetail();
  }, [sessionId]);

  const fetchSessionDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`/api/test-sessions/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data);
        console.log("Answers:", data.answers);
        console.log("Answers length:", data.answers?.length);

        // API returns {session: {...}, answers: [...]}
        // Data answers sudah dalam format yang benar, tidak perlu transformasi nested
        const sessionData = {
          ...data.session,
          test: {
            name: data.session.test_name,
            description: data.session.test_description,
            duration: data.session.test_duration,
          },
          answers: data.answers || [],
        };
        console.log("Session Data:", sessionData);
        setSession(sessionData);
      } else {
        setError("Gagal mengambil hasil tes");
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (percentage: number, minimumScore?: number) => {
    const threshold = minimumScore || 60;
    if (percentage >= threshold + 20) return "text-green-600";
    if (percentage >= threshold + 10) return "text-blue-600";
    if (percentage >= threshold) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreLabel = (percentage: number, minimumScore?: number) => {
    const threshold = minimumScore || 60;
    if (percentage >= threshold + 20) return "Sangat Baik";
    if (percentage >= threshold + 10) return "Baik";
    if (percentage >= threshold) return "Cukup";
    return "Perlu Perbaikan";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PesertaHeader handleLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat hasil tes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PesertaHeader handleLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Hasil tes tidak ditemukan
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push("/peserta/dashboard")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add null check for session
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PesertaHeader handleLogout={handleLogout} />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-gray-600">Data sesi tidak ditemukan</p>
            <button
              onClick={() => router.push("/peserta/dashboard")}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PesertaHeader handleLogout={handleLogout} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selamat! Tes Selesai
          </h1>
          <p className="text-gray-600">
            Berikut adalah hasil tes Anda untuk:{" "}
            <strong>{session.test?.name || "Tes TPA"}</strong>
          </p>
        </div>

        {/* Overall Score Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Skor Total
            </h2>
            <div className="flex items-center justify-center space-x-8">
              <div>
                <div
                  className={`text-4xl font-bold ${getScoreColor(
                    session.overallPercentage,
                    session.minimum_score
                  )}`}
                >
                  {session.score}/{session.maxScore}
                </div>
                <div
                  className={`text-2xl font-semibold ${getScoreColor(
                    session.overallPercentage,
                    session.minimum_score
                  )}`}
                >
                  {session.overallPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div
                  className={`text-lg font-semibold ${getScoreColor(
                    session.overallPercentage,
                    session.minimum_score
                  )}`}
                >
                  {getScoreLabel(
                    session.overallPercentage,
                    session.minimum_score
                  )}
                </div>
                {session.minimum_score && (
                  <div className="text-sm text-gray-500 mt-1">
                    Minimum: {session.minimum_score}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown - Only show categories with data */}
        {session.categoryBreakdown &&
          Object.entries(session.categoryBreakdown).some(
            ([_, breakdown]) => breakdown.maxScore > 0
          ) && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Breakdown per Kategori
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(session.categoryBreakdown)
                  .filter(([_, breakdown]) => breakdown.maxScore > 0)
                  .map(([category, breakdown]) => (
                    <div
                      key={category}
                      className="border rounded-lg p-4"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {formatCategoryName(category)}
                      </h4>
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${getScoreColor(
                            breakdown.percentage
                          )}`}
                        >
                          {breakdown.score}/{breakdown.maxScore}
                        </div>
                        <div
                          className={`text-lg font-semibold ${getScoreColor(
                            breakdown.percentage
                          )}`}
                        >
                          {breakdown.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Answer Review Toggle */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Review Jawaban</h3>
            <button
              onClick={() => setShowAnswerDetails(!showAnswerDetails)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {showAnswerDetails ? "Sembunyikan" : "Tampilkan"} Detail Jawaban
            </button>
          </div>

          {/* Always show summary */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">
              Ringkasan Jawaban:
            </h4>
            {session.answers && session.answers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {session.answers.filter((a) => a.isCorrect).length}
                  </div>
                  <div className="text-gray-600">Benar</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {
                      session.answers.filter(
                        (a) => !a.isCorrect && a.selectedAnswer
                      ).length
                    }
                  </div>
                  <div className="text-gray-600">Salah</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {session.answers.filter((a) => !a.selectedAnswer).length}
                  </div>
                  <div className="text-gray-600">Tidak Dijawab</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {session.answers.length}
                  </div>
                  <div className="text-gray-600">Total Soal</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-gray-500">
                  Tidak ada data jawaban yang ditemukan
                </div>
                <div className="text-sm text-gray-400 mt-2">
                  Session ID: {sessionId}
                </div>
              </div>
            )}
          </div>

          {showAnswerDetails &&
            session.answers &&
            session.answers.length > 0 && (
              <div className="space-y-6">
                {session.answers.map((answer, index) => (
                  <div
                    key={answer.id}
                    className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                      <h2 className="text-lg sm:text-xl font-semibold text-blue-900 flex items-center gap-2">
                        <span className="flex w-8 h-8 rounded-full bg-blue-100 text-blue-700 items-center justify-center font-bold shadow-sm">
                          {index + 1}
                        </span>
                        <span>Soal</span>
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {formatCategoryName(answer.category)}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                          {answer.difficulty}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            answer.isCorrect
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {answer.isCorrect ? "✓ Benar" : "✗ Salah"}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 font-medium">
                          {answer.pointsEarned}/{answer.points || 1} poin
                        </span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-gray-900 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                        {answer.question}
                      </p>
                    </div>

                    {/* Jawaban yang dipilih dan jawaban yang benar */}
                    <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-semibold text-blue-900">
                            Jawaban Anda:{" "}
                          </span>
                          <span
                            className={`font-bold ${
                              answer.isCorrect
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {answer.selectedAnswer
                              ? (() => {
                                  try {
                                    const selectedAnswerArray = JSON.parse(
                                      answer.selectedAnswer
                                    );
                                    const optionsArray = JSON.parse(
                                      answer.options
                                    );
                                    return `${String.fromCharCode(
                                      65 +
                                        optionsArray.indexOf(
                                          selectedAnswerArray[0]
                                        )
                                    )} - ${selectedAnswerArray[0]}`;
                                  } catch (e) {
                                    // Fallback jika bukan JSON valid
                                    const optionsArray = JSON.parse(
                                      answer.options
                                    );
                                    return `${String.fromCharCode(
                                      65 +
                                        optionsArray.indexOf(
                                          answer.selectedAnswer
                                        )
                                    )} - ${answer.selectedAnswer}`;
                                  }
                                })()
                              : "Tidak dijawab"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-blue-900">
                            Jawaban Benar:{" "}
                          </span>
                          <span className="font-bold text-green-600">
                            {(() => {
                              try {
                                const correctAnswerArray = JSON.parse(
                                  answer.correctAnswer
                                );
                                const optionsArray = JSON.parse(answer.options);
                                return `${String.fromCharCode(
                                  65 +
                                    optionsArray.indexOf(correctAnswerArray[0])
                                )} - ${correctAnswerArray[0]}`;
                              } catch (e) {
                                // Fallback jika bukan JSON valid
                                const optionsArray = JSON.parse(answer.options);
                                return `${String.fromCharCode(
                                  65 +
                                    optionsArray.indexOf(answer.correctAnswer)
                                )} - ${answer.correctAnswer}`;
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mb-6">
                      {(() => {
                        try {
                          const optionsArray = JSON.parse(answer.options);
                          return Array.isArray(optionsArray)
                            ? optionsArray.map(
                                (option: string, optIndex: number) => {
                                  const selectedAnswerArray =
                                    answer.selectedAnswer
                                      ? (() => {
                                          try {
                                            return JSON.parse(
                                              answer.selectedAnswer
                                            );
                                          } catch (e) {
                                            return [answer.selectedAnswer];
                                          }
                                        })()
                                      : [];
                                  const correctAnswerArray = (() => {
                                    try {
                                      return JSON.parse(answer.correctAnswer);
                                    } catch (e) {
                                      return [answer.correctAnswer];
                                    }
                                  })();
                                  const isSelected =
                                    selectedAnswerArray.includes(option);
                                  const isCorrect =
                                    correctAnswerArray.includes(option);

                                  let bgColor = "bg-white hover:bg-blue-50";
                                  let textColor = "text-gray-900";
                                  let icon = "";
                                  let borderColor = "border-gray-200";

                                  if (isCorrect) {
                                    bgColor = "bg-green-50 hover:bg-green-100";
                                    textColor = "text-green-900";
                                    borderColor = "border-green-300";
                                    icon = "✓ ";
                                  } else if (isSelected && !isCorrect) {
                                    bgColor = "bg-red-50 hover:bg-red-100";
                                    textColor = "text-red-900";
                                    borderColor = "border-red-300";
                                    icon = "✗ ";
                                  }

                                  return (
                                    <div
                                      key={optIndex}
                                      className={`p-4 rounded-xl border-2 transition-all cursor-default ${bgColor} ${textColor} ${borderColor} shadow-sm`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <span className="flex w-6 h-6 rounded-full bg-blue-100 text-blue-700 items-center justify-center font-bold text-sm flex-shrink-0">
                                          {String.fromCharCode(65 + optIndex)}
                                        </span>
                                        <span className="text-base leading-relaxed">
                                          {icon}
                                          {option}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }
                              )
                            : [];
                        } catch (e) {
                          return [];
                        }
                      })()}
                    </div>

                    {answer.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3">
                        <h5 className="font-semibold text-blue-900 mb-1">
                          Penjelasan:
                        </h5>
                        <p className="text-blue-800 text-sm">
                          {answer.explanation}
                        </p>
                      </div>
                    )}

                    <div className="text-sm text-gray-500 mt-2">
                      Poin: {answer.pointsEarned}/{answer.points || 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push(`/peserta/hasil-tes/${sessionId}`)}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-semibold"
          >
            Lihat Hasil Lengkap & Download PDF
          </button>
          <button
            onClick={() => router.push("/peserta/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-semibold"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
