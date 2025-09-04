"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const CameraMonitor = dynamic(() => import("@/app/components/CameraMonitor"), {
  ssr: false,
});

interface Question {
  id: string;
  question: string;
  type: string;
  category: string;
  difficulty: string;
  points: number;
  options: string[];
  order: number;
  section?: { id: number; name: string; order: number; duration: number };
}

interface Test {
  id: string;
  name: string;
  description: string;
  duration: number;
  totalQuestions: number;
  tabLeaveLimit?: number;
}
interface TestSession {
  id: string;
  status: string;
  startTime: string;
  currentQuestionIndex: number;
}

export default function TakeTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [activeInstructionTab, setActiveInstructionTab] = useState<
    "umum" | "tpa"
  >("umum");
  const [agreed, setAgreed] = useState(false);
  const [showInstruction, setShowInstruction] = useState(true);

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [session, setSession] = useState<TestSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attemptCount, setAttemptCount] = useState<number | null>(null);

  const [showTabWarning, setShowTabWarning] = useState(false);
  const [tabLeaveCount, setTabLeaveCount] = useState(0);
  const [mouseLeaveCount, setMouseLeaveCount] = useState(0);
  const [tabLeaveLimit, setTabLeaveLimit] = useState<number>(3);

  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [dataLoading, setDataLoading] = useState(true); // loading test & questions in background

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const isExitingRef = useRef(false);
  const hasAutoSubmitted = useRef(false);

  // Camera stats mirrored from component
  const [facesCount, setFacesCount] = useState(0);
  const [awayEvents, setAwayEvents] = useState(0);
  const [multiFaceEvents, setMultiFaceEvents] = useState(0);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectorType, setDetectorType] = useState<string>("none");
  const cameraEnabled = false; // disable camera temporarily

  // Start camera permission during instruction via hidden monitor and mirror stats
  const handleCameraStats = (s: any) => {
    setFacesCount(s.faces);
    setAwayEvents(s.awayEvents);
    setMultiFaceEvents(s.multiFaceEvents);
    setIsCameraOn(s.isCameraOn);
    setCameraError(s.cameraError);
    setDetectorType(s.detectorType);
  };

  // Leave/tab monitoring
  useEffect(() => {
    if (showInstruction) return;
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (
          hasAutoSubmitted.current ||
          hasSubmitted ||
          tabLeaveCount >= tabLeaveLimit
        )
          return;
        setTabLeaveCount((prev) => {
          const next = prev + 1;
          if (
            next >= tabLeaveLimit &&
            !hasAutoSubmitted.current &&
            !hasSubmitted
          ) {
            const tryAutoSubmit = () => {
              if (session?.id) {
                isExitingRef.current = true;
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
          } else if (next < tabLeaveLimit) {
            setShowTabWarning(true);
          }
          return next;
        });
      }
    };
    const handleMouseLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) {
        if (
          hasAutoSubmitted.current ||
          hasSubmitted ||
          mouseLeaveCount >= tabLeaveLimit
        )
          return;
        setMouseLeaveCount((prev) => {
          const next = prev + 1;
          if (
            next >= tabLeaveLimit &&
            !hasAutoSubmitted.current &&
            !hasSubmitted
          ) {
            const tryAutoSubmit = () => {
              if (session?.id) {
                isExitingRef.current = true;
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
          } else if (next < tabLeaveLimit) {
            setShowTabWarning(true);
          }
          return next;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("mouseout", handleMouseLeave);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("mouseout", handleMouseLeave);
    };
  }, [
    showInstruction,
    hasSubmitted,
    tabLeaveCount,
    tabLeaveLimit,
    session,
    answers,
    mouseLeaveCount,
  ]);

  // Countdown timer based on session start time and test duration
  useEffect(() => {
    if (showInstruction) return;
    if (!test) return;
    const durationMs = (Number(test.duration) || 0) * 60 * 1000;
    if (durationMs <= 0) {
      setTimeLeft(0);
      return;
    }
    const startMs = session?.startTime
      ? new Date(session.startTime).getTime()
      : Date.now();
    const endMs = startMs + durationMs;
    let stopped = false;
    const tick = () => {
      if (stopped) return;
      const remaining = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        stopped = true;
        if (!hasSubmitted && !submitting) {
          isExitingRef.current = true; // controlled exit
          handleSubmitTest(true);
        }
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [showInstruction, test, session, hasSubmitted, submitting]);

  // Background-load test & questions while on instruction for faster start
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;
        const [testRes, qRes] = await Promise.all([
          fetch(`/api/tests/${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`/api/questions?testId=${testId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (!cancelled && testRes.ok) {
          const t = await testRes.json();
          setTest(t);
          if (typeof t.tabLeaveLimit === "number")
            setTabLeaveLimit(t.tabLeaveLimit);
        }
        if (!cancelled && qRes.ok) {
          const body = await qRes.json();
          const arr = Array.isArray(body)
            ? body
            : Array.isArray(body?.questions)
            ? body.questions
            : [];
          setQuestions(arr || []);
          if ((!Array.isArray(arr) || arr.length === 0) && !error) {
            setError("Soal tidak ditemukan pada response API.");
          }
        } else if (!cancelled) {
          setError("Gagal mengambil soal dari server.");
        }
      } catch (e) {
        if (!cancelled) setError("Terjadi kesalahan saat memuat data tes.");
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [testId]);

  // Intersep upaya keluar: back button, klik link internal, dan refresh/close tab
  useEffect(() => {
    if (showInstruction) return;
    if (hasSubmitted) return;

    const pushState = () => {
      try {
        window.history.pushState(null, "", window.location.href);
      } catch {}
    };

    // Dorong state agar popstate bisa ditangkap tanpa benar-benar keluar
    pushState();

    const onPopState = (e: PopStateEvent) => {
      if (isExitingRef.current || hasSubmitted) return;
      // Kembalikan state supaya tetap di halaman lalu tampilkan modal
      pushState();
      setPendingHref(null);
      setShowExitConfirm(true);
    };

    const onDocumentClick = (e: MouseEvent) => {
      if (isExitingRef.current || hasSubmitted) return;
      const target = e.target as HTMLElement | null;
      const anchor =
        target?.closest && (target.closest("a") as HTMLAnchorElement | null);
      if (!anchor) return;
      // Abaikan anchor yang tidak melakukan navigasi
      if (
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        anchor.getAttribute("rel")?.includes("external")
      )
        return;
      const href = anchor.getAttribute("href") || anchor.href;
      if (!href) return;
      // Jika href adalah anchor dalam halaman, abaikan
      if (href.startsWith("#")) return;
      // Tahan navigasi dan tampilkan konfirmasi
      e.preventDefault();
      setPendingHref(href);
      setShowExitConfirm(true);
    };

    const submitOnBeforeUnload = (e: BeforeUnloadEvent) => {
      // Jika sedang exit terkontrol (auto-submit) jangan munculkan prompt native
      if (isExitingRef.current || hasSubmitted) return;
      if (!session?.id) return;
      // Tampilkan prompt native browser hanya jika bukan exit terkontrol
      e.preventDefault();
      e.returnValue = "";
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;
        // Coba submit dengan fetch keepalive agar tetap terkirim saat unload
        const payload = JSON.stringify({ answers });
        fetch(`/api/test-sessions/${session.id}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: payload,
          keepalive: true,
        }).catch(() => {});
        // Simpan flag agar jika kembali ke halaman, akan redirect
        localStorage.setItem("autoSubmitted", "1");
        localStorage.setItem("autoSessionId", session.id);
        localStorage.setItem("autoAnswers", payload);
      } catch {}
    };

    window.addEventListener("popstate", onPopState);
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("beforeunload", submitOnBeforeUnload);

    return () => {
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("beforeunload", submitOnBeforeUnload);
    };
  }, [showInstruction, hasSubmitted, session, answers]);

  const confirmExitAndSubmit = async () => {
    if (submitting || hasSubmitted) return;
    isExitingRef.current = true;
    setShowExitConfirm(false);
    // Auto submit lalu arahkan ke dashboard
    await handleSubmitTest(true);
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
    setPendingHref(null);
  };

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
        if (typeof testData.tabLeaveLimit === "number") {
          setTabLeaveLimit(testData.tabLeaveLimit);
        }
      }

      // Fetch questions
      const questionsResponse = await fetch(`/api/questions?testId=${testId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        // Debug log untuk response API
        if (typeof window !== "undefined") {
          // eslint-disable-next-line no-console
          console.log("[DEBUG] questionsData:", questionsData);
        }
        // Cek beberapa kemungkinan struktur response
        if (Array.isArray(questionsData)) {
          setQuestions(questionsData);
        } else if (Array.isArray(questionsData.questions)) {
          setQuestions(questionsData.questions);
        } else {
          setQuestions([]);
          setError("Soal tidak ditemukan pada response API.");
        }
      } else {
        setQuestions([]);
        setError("Gagal mengambil soal dari server.");
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
          window.location.replace("/peserta/dashboard");
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

  if (loading && !showInstruction) {
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

  if (!showInstruction && (!test || questions.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tes tidak ditemukan
          </h3>
          <p className="text-gray-600 mb-4">
            {error
              ? error
              : "Tes yang Anda cari tidak ditemukan atau belum memiliki soal"}
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

  const currentQuestion = questions[currentQuestionIndex];

  // Jika showInstruction true, tampilkan instruksi saja
  if (showInstruction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
        <div className="min-h-screen flex items-center justify-center px-2 py-8 w-full">
          <div
            className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 border border-blue-100 w-full max-w-lg md:max-w-xl lg:max-w-2xl mx-auto overflow-x-auto"
            style={{ boxSizing: "border-box" }}
          >
            {/* Tab instruksi disembunyikan */}
            {activeInstructionTab === "umum" && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-blue-900 uppercase">
                  Mohon dibaca dan dipahami
                </h2>
                <h3 className="font-semibold mt-4 mb-2 text-gray-800">
                  Persiapan Teknis
                </h3>
                <ul className="mb-4 list-disc pl-5 text-gray-700 text-sm">
                  <li>
                    Pastikan perangkat Anda (laptop/PC) memiliki koneksi
                    internet stabil.
                  </li>
                  <li>
                    Gunakan browser yang direkomendasikan (misalnya
                    Chrome/Edge/Firefox/Safari versi terbaru).
                  </li>
                  <li>
                    Matikan aplikasi lain yang tidak diperlukan agar tes
                    berjalan lancar.
                  </li>
                </ul>
                <h3 className="font-semibold mt-4 mb-2 text-gray-800">
                  Tata Tertib
                </h3>
                <ul className="mb-4 list-disc pl-5 text-gray-700 text-sm">
                  <li>
                    Dilarang membuka tab lain, menggunakan kalkulator, atau
                    berkomunikasi dengan orang lain selama tes, jika anda
                    meninggalkan halaman tes lebih dari{" "}
                    <b>{tabLeaveLimit} kali.</b> Jika melebihi batas tes akan
                    otomatis <b>DIAKHIRI</b>
                  </li>
                  <li>
                    Tes akan diawasi dan tercatat selama masa tes by sistem.
                  </li>
                  <li>
                    Pelanggaran seperti berpindah layar, mematikan kamera, atau
                    berusaha menyontek dapat menyebabkan <b>DISKUALIFIKASI</b>.
                  </li>
                </ul>
                <h3 className="font-semibold mt-4 mb-2 text-gray-800">
                  Durasi Tes
                </h3>
                <ul className="mb-4 list-disc pl-5 text-gray-700 text-sm">
                  <li>
                    Total waktu tes adalah <b>{test?.duration} menit.</b>
                  </li>
                  <li>
                    Waktu akan mulai dihitung setelah Anda menekan tombol{" "}
                    <b>MULAI</b>.
                  </li>
                  <li>
                    Sistem akan otomatis mengakhiri tes jika waktu telah habis.
                  </li>
                </ul>
                <h3 className="font-semibold mt-4 mb-2 text-gray-800">
                  Gangguan Teknis
                </h3>
                <ul className="mb-4 list-disc pl-5 text-gray-700 text-sm">
                  <li>
                    Jika terjadi kendala teknis (internet terputus atau sistem
                    error), segera laporkan melalui kontak bantuan yang
                    tersedia.
                  </li>
                  <li>
                    Jangan menutup jendela browser kecuali sudah menyelesaikan
                    tes yang dilakukan.
                  </li>
                </ul>
                <button
                  type="button"
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all mt-6"
                  onClick={() => setActiveInstructionTab("tpa")}
                >
                  Next
                </button>
              </div>
            )}
            {activeInstructionTab === "tpa" && (
              <div>
                <h2 className="text-xl font-bold mb-2 text-blue-900">
                  Instruksi Pengerjaan Soal TPA Online
                </h2>
                <ul className="mb-4 list-disc pl-5 text-gray-700 text-sm">
                  <li>
                    Tes Potensi Akademik ini terbagi menjadi 3 section (
                    <b>Verbal</b>, <b>Kuantitatif</b>, <b>Spatial</b>).
                  </li>
                  <li>
                    Bacalah petunjuk di layar dengan seksama sebelum memulai.
                  </li>
                  <li>
                    Klik tombol <b>Mulai</b> untuk memulai tes dan membuka soal.
                  </li>
                  <li>
                    Kerjakan soal secara berurutan, anda tidak dapat mengerjakan
                    soal secara acak.
                  </li>
                  <li>
                    Pilih jawaban dengan mengklik opsi bullet (A, B, C, D).
                  </li>
                  <li>
                    Pastikan semua soal sudah terjawab sebelum waktu habis.
                  </li>
                  <li>Sistem akan memberi peringatan saat tersisa 10 menit.</li>
                  <li>
                    Klik <b>Selesai</b> jika Anda sudah yakin dengan semua
                    jawaban.
                  </li>
                  <li>
                    Setelah submit, sistem akan menampilkan konfirmasi. Pastikan
                    Anda memilih <b>Ya</b> sebelum keluar.
                  </li>
                </ul>
                {/* Warm up camera permission in instruction (no preview) */}
                <CameraMonitor
                  enabled={cameraEnabled}
                  isInstruction={true}
                  showPreview={false}
                  onStatsChange={handleCameraStats}
                />
                <div className="mt-4">
                  <div className="font-semibold mb-1 text-sm">
                    Contoh pengerjaan
                  </div>
                  <div className="bg-white rounded-xl shadow p-3 border border-blue-100 transition-all w-full text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                      <h2 className="text-base font-semibold text-blue-900 flex items-center gap-2">
                        <span className="flex w-6 h-6 rounded-full bg-blue-100 text-blue-700 items-center justify-center font-bold shadow-sm text-xs">
                          1
                        </span>
                        <span>Soal</span>
                      </h2>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Matematika
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                          SEDANG
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          1 poin
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <p className="text-gray-900 text-xs leading-relaxed whitespace-pre-line">
                        Berapakah hasil dari 12 + 15?
                      </p>
                    </div>
                    <div className="space-y-2">
                      {["25", "26", "27", "28"].map((option, idx) => (
                        <label
                          key={option}
                          className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-all shadow-sm ${
                            option === "27"
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <span className="relative flex items-center">
                            <input
                              type="radio"
                              name="contoh-soal"
                              value={option}
                              checked={option === "27"}
                              readOnly
                              disabled
                              className="peer appearance-none h-4 w-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                            />
                            <span
                              className={`pointer-events-none absolute left-0 top-0 h-4 w-4 flex items-center justify-center rounded-full transition ${
                                option === "27" ? "bg-blue-600" : ""
                              }`}
                            ></span>
                          </span>
                          <span className="text-gray-900">
                            <span className="font-semibold mr-2">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            {option}
                            {option === "27" && (
                              <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                                Jawaban Benar
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center mt-6 mb-2">
                  <input
                    type="checkbox"
                    id="agreeInstruction"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mr-2"
                  />
                  <label
                    htmlFor="agreeInstruction"
                    className="text-sm text-gray-700"
                  >
                    Saya telah membaca, mengerti dan menyetujui informasi ini
                  </label>
                </div>
              </div>
            )}
            {activeInstructionTab === "tpa" && (
              <button
                onClick={async () => {
                  if (!agreed) return;
                  setShowInstruction(false);
                  if (typeof window !== "undefined") {
                    localStorage.setItem(
                      `tpa_instruction_shown_${testId}`,
                      "1"
                    );
                  }
                  // Start session baru setelah klik Mulai
                  setLoading(true);
                  setLoading(false);
                  const token =
                    typeof window !== "undefined"
                      ? localStorage.getItem("token")
                      : null;
                  if (!token) {
                    router.push("/login");
                    return;
                  }
                  try {
                    const sessionRes = await fetch(
                      `/api/test-sessions/start/${testId}`,
                      {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    );
                    if (sessionRes.ok) {
                      const sessionData = await sessionRes.json();
                      setSession(sessionData.session);
                      setCurrentQuestionIndex(
                        sessionData.session.currentQuestionIndex || 0
                      );
                    }
                  } finally {
                    setLoading(false);
                  }
                }}
                className={`w-full py-3 rounded-lg font-semibold text-lg transition-all mt-6 ${
                  agreed
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-400 cursor-not-allowed"
                }`}
                disabled={!agreed}
              >
                Mulai
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render seluruh konten tes jika instruksi sudah selesai
  return (
    <>
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md text-center border border-gray-200">
            <h3 className="text-xl font-semibold mb-3">
              Apakah Anda yakin ingin keluar?
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              Jika Anda keluar sekarang, sistem akan otomatis mengakhiri dan
              mengirim jawaban Anda.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={cancelExit}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
              >
                Batal
              </button>
              <button
                onClick={confirmExitAndSubmit}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
      {showTabWarning &&
        (tabLeaveCount < tabLeaveLimit || mouseLeaveCount < tabLeaveLimit) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full text-center">
              <div className="text-yellow-500 text-4xl mb-2">⚠️</div>
              <h2 className="text-lg font-bold mb-2">Peringatan!</h2>
              <p className="mb-4 text-gray-700">
                Anda telah meninggalkan tab tes atau mengarahkan kursor keluar
                dari window. Kesempatan meninggalkan tab/jendela hanya{" "}
                <b>{tabLeaveLimit} kali</b>.<br />
                Sisa kesempatan:{" "}
                <span className="font-bold text-red-600">
                  {tabLeaveLimit - Math.max(tabLeaveCount, mouseLeaveCount)}
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
                {test?.name || "Memuat..."}
              </h1>
              <span className="hidden sm:inline mx-2 text-gray-300">|</span>
              <p className="text-sm text-gray-600">
                Soal{" "}
                <span className="font-semibold text-blue-700">
                  {currentQuestionIndex + 1}
                </span>{" "}
                dari <span className="font-semibold">{questions.length}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Camera status badges moved below Progress */}
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
          {/* Camera Monitor (disabled when cameraEnabled is false) */}
          <CameraMonitor
            enabled={cameraEnabled && !hasSubmitted}
            isInstruction={false}
            showPreview={cameraEnabled && !hasSubmitted}
            onStatsChange={handleCameraStats}
          />
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
          {/* Camera monitoring badges under Progress (hidden when camera disabled) */}
          {cameraEnabled && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                  isCameraOn
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}
              >
                {isCameraOn
                  ? "Kamera aktif (live)"
                  : cameraError
                  ? "Kamera off"
                  : "Mengaktifkan kamera..."}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Wajah: {facesCount}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                Menoleh: {awayEvents}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                &gt;1 Orang: {multiFaceEvents}
              </span>
            </div>
          )}
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
