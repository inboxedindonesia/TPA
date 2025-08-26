"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

interface Question {
  id: string;
  question: string;
  type: string;
  category: string;
  difficulty: string;
  points: number;
  options: string[];
  order: number;
  section?: {
    id: number;
    name: string;
    order: number;
    duration: number;
  };
}

interface Test {
  id: string;
  name: string;
  description: string;
  duration: number;
  totalQuestions: number;
}

interface TestSession {
  id: string;
  status: string;
  startTime: string;
  currentQuestionIndex: number;
}

export default function TakeTestPage() {
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [tabLeaveCount, setTabLeaveCount] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [session, setSession] = useState<TestSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const hasAutoSubmitted = useRef(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [attemptCount, setAttemptCount] = useState<number | null>(null);

  // Redirect ke dashboard jika sudah auto-submit (flag di localStorage), dan submit ulang jika perlu
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("autoSubmitted")
    ) {
      // Reset tabLeaveCount agar tidak muncul warning setelah reload auto-submit
      setTabLeaveCount(3);
      const sessionId = localStorage.getItem("autoSessionId");
      const answersStr = localStorage.getItem("autoAnswers");
      if (sessionId && answersStr) {
        fetch(`/api/test-sessions/${sessionId}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ answers: JSON.parse(answersStr) }),
        }).finally(() => {
          localStorage.removeItem("autoSubmitted");
          localStorage.removeItem("autoSessionId");
          localStorage.removeItem("autoAnswers");
          window.location.replace("http://localhost:3000/peserta/dashboard");
        });
      } else {
        localStorage.removeItem("autoSubmitted");
        window.location.replace("http://localhost:3000/peserta/dashboard");
      }
    }
  }, []);

  useEffect(() => {
    fetchTestAndStartSession();
    fetchAttemptCount();
  }, [testId]);

  // Ambil jumlah attempt user untuk test ini
  const fetchAttemptCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch(
        `/api/test-sessions?userId=${encodeURIComponent(
          localStorage.getItem("userId") || ""
        )}&testId=${testId}`
      );
      if (res.ok) {
        const data = await res.json();
        setAttemptCount(Array.isArray(data) ? data.length : 0);
      } else {
        setAttemptCount(null);
      }
    } catch {
      setAttemptCount(null);
    }
  };

  // Hitung sisa waktu berdasarkan startTime dari session agar tidak reset saat refresh
  useEffect(() => {
    if (session && test) {
      const start = new Date(session.startTime).getTime();
      const now = Date.now();
      const durationMs = test.duration * 60 * 1000;
      const elapsed = now - start;
      const left = Math.max(0, Math.floor((durationMs - elapsed) / 1000));
      setTimeLeft(left);
    }
  }, [session, test]);

  // Timer countdown, auto-submit jika habis
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Warning popup sebelum keluar, auto-submit jika benar-benar keluar
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        // Jangan lakukan apapun jika sudah auto-submit
        if (hasAutoSubmitted.current || hasSubmitted || tabLeaveCount >= 3)
          return;
        setTabLeaveCount((prev) => {
          const next = prev + 1;
          if (next >= 3 && !hasAutoSubmitted.current && !hasSubmitted) {
            const tryAutoSubmit = () => {
              if (session?.id) {
                hasAutoSubmitted.current = true;
                localStorage.setItem("autoSubmitted", "1");
                localStorage.setItem("autoSessionId", session.id);
                localStorage.setItem("autoAnswers", JSON.stringify(answers));
                handleSubmitTest(true);
              } else {
                setTimeout(tryAutoSubmit, 200);
              }
            };
            tryAutoSubmit();
          } else if (next < 3) {
            setShowTabWarning(true);
          }
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [hasSubmitted, tabLeaveCount, session, answers]);

  const fetchTestAndStartSession = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch test details
      const testResponse = await fetch(`/api/tests/${testId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (testResponse.ok) {
        const testData = await testResponse.json();
        setTest(testData);
      }

      // Fetch questions
      const questionsResponse = await fetch(`/api/questions?testId=${testId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions || []);
      }

      // Start or continue test session
      const sessionResponse = await fetch(
        `/api/test-sessions/start/${testId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        setSession(sessionData.session);
        setCurrentQuestionIndex(sessionData.session.currentQuestionIndex || 0);
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitTest = async (auto = false) => {
    if (submitting || hasSubmitted) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      // Ambil jawaban terakhir dari localStorage jika auto-submit (untuk reload case)
      let submitAnswers = answers;
      if (auto && localStorage.getItem("autoAnswers")) {
        try {
          submitAnswers =
            JSON.parse(localStorage.getItem("autoAnswers") || "{}") || answers;
        } catch {}
      }
      const response = await fetch(`/api/test-sessions/${session?.id}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: submitAnswers }),
      });
      if (response.ok) {
        setHasSubmitted(true);
        if (auto) {
          window.location.replace("http://localhost:3000/peserta/dashboard");
        } else {
          alert("Tes berhasil diselesaikan!");
          router.replace(`/peserta/dashboard`);
        }
      } else {
        if (!auto) alert("Gagal menyelesaikan tes");
      }
    } catch (error) {
      if (!auto) alert("Terjadi kesalahan server");
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Tutup warning jika user klik OK
  const handleCloseWarning = () => setShowTabWarning(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat tes...</p>
        </div>
      </div>
    );
  }

  // Jika sesi sudah tidak ONGOING, blokir akses
  if (session && session.status !== "ONGOING") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h2 className="text-xl font-bold mb-2">Tes sudah selesai</h2>
          <p className="mb-4 text-gray-700">
            Anda tidak dapat mengerjakan tes ini lagi.
          </p>
          <button
            onClick={() => router.push("/peserta/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tes tidak ditemukan
          </h3>
          <p className="text-gray-600 mb-4">
            Tes yang Anda cari tidak ditemukan atau belum memiliki soal
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

  // Jika sudah pernah mencoba 1 kali, sembunyikan tombol mulai tes dan tambahkan deskripsi
  // (Untuk halaman detail tes, logika ini harus diterapkan di komponen card daftar tes, bukan di halaman ini)

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      {showTabWarning && tabLeaveCount < 3 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
            <div className="text-yellow-500 text-4xl mb-2">⚠️</div>
            <h2 className="text-lg font-bold mb-2">Peringatan!</h2>
            <p className="mb-4 text-gray-700">
              Anda telah meninggalkan tab tes. Kesempatan meninggalkan tab hanya{" "}
              <b>3 kali</b>.<br />
              Sisa kesempatan:{" "}
              <span className="font-bold text-red-600">
                {3 - tabLeaveCount}
              </span>
            </p>
            <button
              onClick={handleCloseWarning}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur shadow-md border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {test.name}
              </h1>
              <span className="hidden sm:inline mx-2 text-gray-300">|</span>
              <p className="text-sm text-gray-600">
                Soal{" "}
                <span className="font-semibold text-blue-700">
                  {currentQuestionIndex + 1}
                </span>{" "}
                dari <span className="font-semibold">{questions.length}</span>
              </p>
              {/* Section info di header dihapus, dipindah ke dalam card soal */}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs font-medium text-gray-700">
                  Waktu Tersisa
                </div>
                <div
                  className={`text-lg font-bold tracking-widest ${
                    timeLeft < 300
                      ? "text-red-600 animate-pulse"
                      : "text-gray-900"
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
              </div>
              <button
                onClick={() => handleSubmitTest()}
                disabled={submitting}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg shadow hover:from-red-600 hover:to-red-800 disabled:opacity-50 transition-all font-semibold"
              >
                {submitting ? "Menyimpan..." : "Selesai"}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          </div>
        )}

        {/* Main Content */}

        <div className="max-w-4xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
          {/* Section Card */}
          {questions.length > 0 && questions[currentQuestionIndex]?.section && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 shadow flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg shadow-sm">
                {questions[currentQuestionIndex].section.order}
              </div>
              <div>
                <div className="text-sm font-bold text-blue-800">
                  Section: {questions[currentQuestionIndex].section.name}
                </div>
                <div className="text-xs text-blue-700">
                  Bagian ke-{questions[currentQuestionIndex].section.order}{" "}
                  &bull; Durasi:{" "}
                  {questions[currentQuestionIndex].section.duration} menit
                </div>
              </div>
            </div>
          )}
          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border border-blue-100 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="text-lg sm:text-xl font-semibold text-blue-900 flex items-center gap-2">
                <span className="flex w-8 h-8 rounded-full bg-blue-100 text-blue-700 items-center justify-center font-bold shadow-sm">
                  {currentQuestionIndex + 1}
                </span>
                <span>Soal</span>
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {currentQuestion.category.replace("_", " ")}
                </span>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                  {currentQuestion.difficulty}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  {currentQuestion.points} poin
                </span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-900 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                {currentQuestion.question}
              </p>
            </div>

            {/* Answer Options */}
            {(currentQuestion.type === "MULTIPLE_CHOICE" ||
              (Array.isArray(currentQuestion.options) &&
                currentQuestion.options.length > 0)) && (
              <div className="space-y-3">
                {Array.isArray(currentQuestion.options) &&
                currentQuestion.options.length > 0 ? (
                  currentQuestion.options.map(
                    (option: string, index: number) => (
                      <label
                        key={index}
                        className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all shadow-sm ${
                          answers[currentQuestion.id] === option
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span className="relative flex items-center">
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option}
                            checked={answers[currentQuestion.id] === option}
                            onChange={(e) =>
                              handleAnswerChange(
                                currentQuestion.id,
                                e.target.value
                              )
                            }
                            className="peer appearance-none h-5 w-5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                          />
                          <span
                            className={`pointer-events-none absolute left-0 top-0 h-5 w-5 flex items-center justify-center rounded-full transition ${
                              answers[currentQuestion.id] === option
                                ? "bg-blue-600 "
                                : ""
                            }`}
                          ></span>
                        </span>
                        <span className="text-gray-900">
                          <span className="font-semibold mr-2">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {option}
                        </span>
                      </label>
                    )
                  )
                ) : (
                  <div className="text-red-500 text-sm">
                    Opsi jawaban tidak tersedia.
                  </div>
                )}
              </div>
            )}

            {currentQuestion.type === "TRUE_FALSE" && (
              <div className="space-y-3">
                <label
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all shadow-sm ${
                    answers[currentQuestion.id] === "true"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value="true"
                    checked={answers[currentQuestion.id] === "true"}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, e.target.value)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-900 font-medium">Benar</span>
                </label>
                <label
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all shadow-sm ${
                    answers[currentQuestion.id] === "false"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value="false"
                    checked={answers[currentQuestion.id] === "false"}
                    onChange={(e) =>
                      handleAnswerChange(currentQuestion.id, e.target.value)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-900 font-medium">Salah</span>
                </label>
              </div>
            )}

            {currentQuestion.type === "ESSAY" && (
              <div>
                <textarea
                  value={answers[currentQuestion.id] || ""}
                  onChange={(e) =>
                    handleAnswerChange(currentQuestion.id, e.target.value)
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  placeholder="Tulis jawaban Anda di sini..."
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <button
              onClick={handleNextQuestion}
              disabled={
                currentQuestionIndex === questions.length - 1 ||
                !answers[questions[currentQuestionIndex].id]
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              Selanjutnya →
            </button>
          </div>

          {/* Progress */}
          <div className="mt-8 bg-white rounded-xl shadow p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Progress
              </span>
              <span className="text-sm text-gray-600">
                <span className="font-bold text-blue-700">
                  {Object.keys(answers).length}
                </span>{" "}
                dari {questions.length} soal terjawab
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (Object.keys(answers).length / questions.length) * 100
                  }%`,
                }}
              ></div>
            </div>
          </div>

          {/* Warning */}
          {timeLeft < 300 && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-red-400 text-xl mr-2">⚠️</div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Waktu hampir habis!
                  </h3>
                  <p className="text-sm text-red-700">
                    Segera selesaikan tes Anda sebelum waktu habis.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
