"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

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

interface TestSession {
  id: string;
  testId: string;
  status: string;
  score: number;
  maxScore: number;
  startTime: string;
  endTime: string;
  test: {
    name: string;
    description: string;
    duration: number;
  };
  answers: Answer[];
}

export default function DetailHasilTesPesertaPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        setSession(data.session);
      } else {
        setError("Gagal memuat detail hasil tes");
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat detail hasil tes...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Data tidak ditemukan
          </h3>
          <p className="text-gray-600 mb-4">
            Sesi tes yang Anda cari tidak ditemukan
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Detail Hasil Tes
              </h1>
              <p className="mt-2 text-gray-600">
                Detail lengkap hasil tes Anda
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
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

        {/* Session Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Informasi Tes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Data Tes
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Tes:</span>
                  <span className="ml-2 text-gray-900">
                    {session.test?.name || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Durasi:</span>
                  <span className="ml-2 text-gray-900">
                    {session.test?.duration || 0} menit
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
                    <span className="font-medium text-gray-700">Selesai:</span>
                    <span className="ml-2 text-gray-900">
                      {formatDate(session.endTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Status Tes
              </h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                      session.status === "COMPLETED"
                        ? "bg-green-100 text-green-800"
                        : session.status === "ONGOING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
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
                        Jawaban Benar:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {session.answers?.filter((a) => a.isCorrect).length ||
                          0}{" "}
                        dari {session.answers?.length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Waktu Pengerjaan:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {Math.round(
                          (new Date(session.endTime).getTime() -
                            new Date(session.startTime).getTime()) /
                            60000
                        )}{" "}
                        menit
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {session.status === "COMPLETED" && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">
                Hasil Akhir
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${getScoreColor(
                      calculatePercentage(session.score, session.maxScore)
                    )}`}
                  >
                    {session.score}/{session.maxScore}
                  </div>
                  <div className="text-sm text-gray-600">Nilai</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold ${getScoreColor(
                      calculatePercentage(session.score, session.maxScore)
                    )}`}
                  >
                    {calculatePercentage(session.score, session.maxScore)}%
                  </div>
                  <div className="text-sm text-gray-600">Persentase</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {getScoreMessage(
                      calculatePercentage(session.score, session.maxScore)
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Pesan</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Answers Detail */}
        {session.answers && session.answers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Detail Jawaban
            </h2>

            <div className="space-y-4">
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
        )}

        {(!session.answers || session.answers.length === 0) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada jawaban
              </h3>
              <p className="text-gray-600">
                Anda belum menjawab soal atau tes masih berlangsung
              </p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-green-900 mb-2">
            💡 Tips Belajar
          </h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Perhatikan soal yang salah untuk belajar</li>
            <li>• Baca penjelasan untuk memahami konsep</li>
            <li>• Latih soal serupa untuk meningkatkan kemampuan</li>
            <li>• Ikuti tes lain untuk mengasah skill</li>
            <li>• Jangan ragu untuk bertanya jika ada yang kurang jelas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
