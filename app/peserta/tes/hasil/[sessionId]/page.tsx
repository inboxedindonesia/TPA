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
  test: { name: string; description: string; duration: number };
  answers: Answer[];
}

const formatCategoryName = (c: string) => {
  const map: Record<string, string> = {
    TES_VERBAL: "Tes Verbal",
    TES_ANGKA: "Tes Angka",
    TES_LOGIKA: "Tes Logika",
    TES_GAMBAR: "Tes Gambar",
  };
  return (
    map[c] || c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
  );
};

export default function TestResultsPage() {
  const router = useRouter();
  const { sessionId } = useParams() as { sessionId: string };
  const [session, setSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        const r = await fetch(`/api/test-sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (r.ok) {
          const data = await r.json();
          const s: TestSession = {
            ...data.session,
            test: {
              name: data.session.test_name,
              description: data.session.test_description,
              duration: data.session.test_duration,
            },
            answers: data.answers || [],
          };
          setSession(s);
          // Fetch all questions for this test to include unanswered
          if (s.testId) {
            try {
              const qRes = await fetch(`/api/questions?testId=${s.testId}`);
              if (qRes.ok) {
                const qData = await qRes.json();
                const rawQuestions = qData.questions || [];
                const answerMap = new Map<string, Answer>();
                (s.answers || []).forEach((a: any) => {
                  answerMap.set(a.questionId, a);
                });
                const merged: Answer[] = rawQuestions.map(
                  (q: any, idx: number) => {
                    const existing = answerMap.get(q.id);
                    if (existing) {
                      // Normalize options if needed
                      if (Array.isArray(existing.options)) {
                        existing.options = JSON.stringify(existing.options);
                      }
                      return existing as Answer;
                    }
                    return {
                      id: `placeholder-${q.id}`,
                      questionId: q.id,
                      selectedAnswer: "",
                      isCorrect: false,
                      pointsEarned: 0,
                      answeredAt: "",
                      question: q.question,
                      type: q.type,
                      category: q.category,
                      difficulty: q.difficulty,
                      options: JSON.stringify(q.options || []),
                      correctAnswer:
                        typeof q.correctAnswer === "string"
                          ? q.correctAnswer
                          : JSON.stringify(q.correctAnswer),
                      points: q.points,
                    } as Answer;
                  }
                );
                // Ensure ordering if order field exists
                merged.sort((a: any, b: any) => {
                  const qa = rawQuestions.find(
                    (q: any) => q.id === a.questionId
                  );
                  const qb = rawQuestions.find(
                    (q: any) => q.id === b.questionId
                  );
                  return (qa?.order || 0) - (qb?.order || 0);
                });
                setAllAnswers(merged);
              } else {
                setAllAnswers(s.answers as any);
              }
            } catch {
              setAllAnswers(s.answers as any);
            }
          } else {
            setAllAnswers(s.answers as any);
          }
        } else setError("Gagal mengambil hasil tes");
      } catch {
        setError("Terjadi kesalahan server");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, router]);

  const getColor = (p: number, m?: number) => {
    const t = m || 60;
    if (p >= t + 20) return "text-green-600";
    if (p >= t + 10) return "text-blue-600";
    if (p >= t) return "text-yellow-600";
    return "text-red-600";
  };
  const getLabel = (p: number, m?: number) => {
    const t = m || 60;
    if (p >= t + 20) return "Sangat Baik";
    if (p >= t + 10) return "Baik";
    if (p >= t) return "Cukup";
    return "Perlu Perbaikan";
  };
  const getScoreMessage = (percentage: number, minimumScore?: number) => {
    const threshold = minimumScore || 60;
    if (percentage >= threshold) return "Selamat! Anda telah lulus!";
    if (percentage >= threshold * 0.8) return "Hampir lulus! Tingkatkan lagi!";
    return "Belum lulus. Terus belajar dan coba lagi!";
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <PesertaHeader handleLogout={handleLogout} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Memuat hasil tes...</p>
          </div>
        </div>
      </div>
    );
  if (error || !session)
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

  const total = allAnswers.length;
  const correct = allAnswers.filter((a) => a.isCorrect).length;
  const wrong = allAnswers.filter(
    (a) => !a.isCorrect && a.selectedAnswer
  ).length;
  const unanswered = allAnswers.filter((a) => !a.selectedAnswer).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <PesertaHeader handleLogout={handleLogout} />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tes Selesai</h1>
          <p className="text-gray-600">
            Berikut ringkasan hasil tes:{" "}
            <strong>{session.test?.name || "Tes TPA"}</strong>
          </p>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-xl text-center font-bold text-gray-900 mb-8">
              Skor Total
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-2">
              <div className="text-center">
                <div className="text-sm text-gray-600">Nilai</div>
                <div
                  className={`text-3xl font-bold ${getColor(
                    session.overallPercentage,
                    session.minimum_score
                  )}`}
                >
                  {session.score}/{session.maxScore}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Persentase</div>
                <div
                  className={`text-3xl font-bold ${getColor(
                    session.overallPercentage,
                    session.minimum_score
                  )}`}
                >
                  {session.overallPercentage.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Status</div>
                {session.overallPercentage >= (session.minimum_score || 60) ? (
                  <div className="text-2xl font-bold text-green-600">Lulus</div>
                ) : (
                  <div className="text-2xl font-bold text-red-600">Gagal</div>
                )}
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Pesan</div>
                <div
                  className={`text-lg font-bold ${
                    session.overallPercentage >= (session.minimum_score || 60)
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {getScoreMessage(
                    session.overallPercentage,
                    session.minimum_score
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            Ringkasan Jawaban
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Stat
              label="Benar"
              value={correct}
              color="text-green-600"
            />
            <Stat
              label="Salah"
              value={wrong}
              color="text-red-600"
            />
            <Stat
              label="Tidak Dijawab"
              value={unanswered}
              color="text-gray-600"
            />
            <Stat
              label="Total Soal"
              value={total}
              color="text-blue-600"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Detail Per Soal
            </h3>
            <button
              onClick={() => setShowDetails((v) => !v)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {showDetails ? "Sembunyikan ▲" : "Tampilkan ▼"}
            </button>
          </div>
          {showDetails && (
            <div className="space-y-6 text-left">
              {allAnswers.map((answer, idx) => {
                const optionsArray = (() => {
                  try {
                    return JSON.parse(answer.options);
                  } catch {
                    return [];
                  }
                })();
                let selectedArray: string[] = [];
                try {
                  selectedArray = answer.selectedAnswer
                    ? JSON.parse(answer.selectedAnswer)
                    : [];
                } catch {
                  if (answer.selectedAnswer)
                    selectedArray = [answer.selectedAnswer];
                }
                let correctArray: string[] = [];
                try {
                  correctArray = answer.correctAnswer
                    ? JSON.parse(answer.correctAnswer)
                    : [];
                } catch {
                  if (answer.correctAnswer)
                    correctArray = [answer.correctAnswer];
                }
                const unanswered = !selectedArray.length;
                return (
                  <div
                    key={answer.id || idx}
                    className="bg-white rounded-2xl shadow-xl p-5 border border-blue-100 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                      <h2 className="text-base sm:text-lg font-semibold text-blue-900 flex items-center gap-2">
                        <span
                          className={`flex w-8 h-8 rounded-full items-center justify-center font-bold shadow-sm text-sm ${
                            answer.isCorrect
                              ? "bg-green-100 text-green-700"
                              : unanswered
                              ? "bg-gray-100 text-gray-600"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span>Soal</span>
                        {unanswered && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gray-200 text-gray-700">
                            Tidak Dijawab
                          </span>
                        )}
                        {answer.isCorrect && !unanswered && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700 border border-green-200">
                            Benar
                          </span>
                        )}
                        {!answer.isCorrect && !unanswered && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 border border-red-200">
                            Salah
                          </span>
                        )}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        {answer.category && (
                          <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            {answer.category}
                          </span>
                        )}
                        {answer.difficulty && (
                          <span className="px-2 py-1 text-[10px] font-semibold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                            {answer.difficulty}
                          </span>
                        )}
                        {answer.points !== undefined && (
                          <span className="text-[10px] text-gray-500 font-medium">
                            {answer.points} poin
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mb-5">
                      <p className="text-gray-900 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                        {answer.question || "Pertanyaan tidak tersedia."}
                      </p>
                    </div>
                    {Array.isArray(optionsArray) && optionsArray.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {optionsArray.map((opt: string, optIdx: number) => {
                          const isSelected = selectedArray.includes(opt);
                          const isCorrect = correctArray.includes(opt);
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center space-x-3 p-3 border rounded-lg transition-all shadow-sm text-sm ${
                                isCorrect
                                  ? "border-green-500 bg-green-50"
                                  : isSelected
                                  ? "border-red-400 bg-red-50"
                                  : "border-gray-200"
                              } ${
                                !isCorrect && !isSelected
                                  ? "hover:bg-gray-50"
                                  : ""
                              }`}
                            >
                              <span className="flex w-6 h-6 rounded-full bg-blue-100 text-blue-700 items-center justify-center font-bold text-xs">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="text-gray-900 flex-1">
                                {opt}
                              </span>
                              {isCorrect && (
                                <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                  Jawaban Benar
                                </span>
                              )}
                              {!isCorrect && isSelected && (
                                <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                                  Dipilih
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <div className="mt-3 text-xs sm:text-sm flex flex-col gap-1">
                      <div>
                        <span className="font-semibold text-gray-700">
                          Jawaban Anda:{" "}
                        </span>
                        <span
                          className={
                            answer.isCorrect
                              ? "text-green-600 font-medium"
                              : selectedArray.length
                              ? "text-red-600 font-medium"
                              : "text-gray-500 font-medium"
                          }
                        >
                          {selectedArray.length
                            ? selectedArray
                                .map((sa) => {
                                  const idxOpt = optionsArray.indexOf(sa);
                                  return `${
                                    idxOpt >= 0
                                      ? String.fromCharCode(65 + idxOpt) + ". "
                                      : ""
                                  }${sa}`;
                                })
                                .join(", ")
                            : "Tidak dijawab"}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">
                          Jawaban Benar:{" "}
                        </span>
                        <span className="text-green-600 font-medium">
                          {correctArray
                            .map((ca) => {
                              const idxOpt = optionsArray.indexOf(ca);
                              return `${
                                idxOpt >= 0
                                  ? String.fromCharCode(65 + idxOpt) + ". "
                                  : ""
                              }${ca}`;
                            })
                            .join(", ")}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1">
                        Poin: {answer.pointsEarned}/{answer.points || 1}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="mt-4 mb-12 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push(`/peserta/hasil-tes/${sessionId}`)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Lihat Detail Lengkap & PDF →
          </button>
          <button
            onClick={() => router.push("/peserta/dashboard")}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <p className="mt-1 text-gray-600 text-sm font-medium">{label}</p>
    </div>
  );
}
