"use client";

import { display } from "html2canvas/dist/types/css/property-descriptors/display";
import React from "react";

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
  minimum_score?: number;
  categoryBreakdown: {
    TES_VERBAL: CategoryBreakdown;
    TES_ANGKA: CategoryBreakdown;
    TES_LOGIKA: CategoryBreakdown;
    TES_GAMBAR: CategoryBreakdown;
  };
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
  // Optional Aptitude fields
  aptitude_score_total?: number;
  aptitude_max_score_total?: number;
  // Optional Multiple Intelligences breakdown (0-100)
  mi_visual_spatial?: number;
  mi_logical_mathematical?: number;
  mi_linguistic?: number;
  mi_interpersonal?: number;
  mi_musical?: number;
  mi_bodily_kinesthetic?: number;
  mi_intrapersonal?: number;
  mi_naturalistic?: number;
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

interface PDFResultTemplateProps {
  session: TestSession;
}

const PDFResultTemplate: React.FC<PDFResultTemplateProps> = ({ session }) => {
  // Hitung jumlah kolom grid untuk Analisis Detail Komponen TPA
  const categoryCount = Object.entries(session.categoryBreakdown).filter(
    ([category, data]) => (data as any).maxScore > 0
  ).length;
  let gridColumns = "1fr";
  if (categoryCount === 2) gridColumns = "1fr 1fr";
  else if (categoryCount === 3) gridColumns = "1fr 1fr 1fr";
  else if (categoryCount >= 4) gridColumns = "1fr 1fr 1fr 1fr";
  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate current date for footer
  const getCurrentDateTime = () => {
    return new Date().toLocaleString("id-ID", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const calculatePercentage = (score: number, maxScore: number) => {
    if (!maxScore || maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
  };

  const getScoreMessage = (percentage: number, minimumScore?: number) => {
    const threshold = minimumScore || 60;
    if (percentage >= threshold) {
      return "Selamat! Anda telah lulus tes ini.";
    } else {
      return "Maaf, Anda belum mencapai nilai minimum.";
    }
  };

  const getScoreColor = (percentage: number, minimumScore?: number) => {
    const threshold = minimumScore || 60;
    if (percentage >= 90) return "#059669";
    if (percentage >= 80) return "#16a34a";
    if (percentage >= threshold) return "#ca8a04";
    if (percentage >= 50) return "#ea580c";
    return "#dc2626";
  };

  const getCategoryName = (category: string) => {
    const names = {
      TES_VERBAL: "Verbal",
      TES_ANGKA: "Numerik",
      TES_LOGIKA: "Logika",
      TES_GAMBAR: "Spasial",
    };
    return names[category as keyof typeof names] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      TES_VERBAL: "📝",
      TES_ANGKA: "🔢",
      TES_LOGIKA: "🧠",
      TES_GAMBAR: "🎨",
    };
    return icons[category as keyof typeof icons] || "📊";
  };

  const getThresholds = (minimumScore?: number) => {
    const base = minimumScore || 60;
    return {
      excellent: Math.min(90, base + 30),
      good: Math.min(80, base + 20),
      average: Math.min(70, base + 10),
      poor: Math.max(40, base - 20),
    };
  };

  const calculateZScore = (percentage: number) => {
    const mean = 65;
    const stdDev = 15;
    return ((percentage - mean) / stdDev).toFixed(2);
  };

  const getZScoreInterpretation = (zScore: number) => {
    if (zScore >= 2) return "Sangat Tinggi (Top 2.5%)";
    if (zScore >= 1.5) return "Tinggi (Top 7%)";
    if (zScore >= 1) return "Di Atas Rata-rata (Top 16%)";
    if (zScore >= 0.5) return "Sedikit Di Atas Rata-rata (Top 31%)";
    if (zScore >= -0.5) return "Rata-rata (31-69%)";
    if (zScore >= -1) return "Sedikit Di Bawah Rata-rata (Bottom 31%)";
    if (zScore >= -1.5) return "Rendah (Bottom 16%)";
    return "Sangat Rendah (Bottom 7%)";
  };

  const getOverallRecommendation = (
    overallPercentage: number,
    categoryBreakdown: any
  ) => {
    let recommendation = "";
    const thresholds = getThresholds(session.minimum_score);

    if (overallPercentage >= thresholds.excellent) {
      recommendation =
        "Hasil yang sangat baik! Pertahankan kemampuan dengan terus berlatih soal-soal yang lebih menantang. ";
    } else if (overallPercentage >= thresholds.good) {
      recommendation =
        "Hasil yang baik! Tingkatkan kemampuan dengan latihan rutin dan fokus pada area yang masih lemah. ";
    } else if (overallPercentage >= thresholds.average) {
      recommendation =
        "Hasil cukup baik. Perbanyak latihan dan pelajari strategi penyelesaian soal yang lebih efektif. ";
    } else {
      recommendation =
        "Perlu peningkatan yang signifikan. Disarankan untuk mengikuti bimbingan belajar atau kursus persiapan. ";
    }

    if (categoryBreakdown) {
      const weakCategories = Object.entries(categoryBreakdown)
        .filter(([_, data]: [string, any]) => data.maxScore > 0)
        .map(([category, data]: [string, any]) => [
          category,
          data.percentage || calculatePercentage(data.score, data.maxScore),
        ])
        .filter(
          ([_, percentage]) => (percentage as number) < thresholds.average
        )
        .sort((a, b) => (a[1] as number) - (b[1] as number));

      if (weakCategories.length > 0) {
        recommendation += `Prioritaskan ${weakCategories
          .map(([name]) => getCategoryName(name as string))
          .join(", ")}.`;
      }
    }

    return recommendation;
  };

  // Derived helpers for new sections
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const getRiasecTotal = () => {
    const scores = [
      session.score_realistic || 0,
      session.score_investigative || 0,
      session.score_artistic || 0,
      session.score_social || 0,
      session.score_enterprising || 0,
      session.score_conventional || 0,
    ];
    const maxes = [
      session.max_score_realistic || 0,
      session.max_score_investigative || 0,
      session.max_score_artistic || 0,
      session.max_score_social || 0,
      session.max_score_enterprising || 0,
      session.max_score_conventional || 0,
    ];
    const totalMax = sum(maxes);
    return {
      score: sum(scores),
      max: totalMax,
      percent: totalMax > 0 ? Math.round((sum(scores) / totalMax) * 100) : 0,
    };
  };

  const getAptitudePercent = () => {
    const total = session.aptitude_score_total || 0;
    const max = session.aptitude_max_score_total || 0;
    return max > 0 ? Math.round((total / max) * 100) : 0;
  };

  const getTopHolland = () => {
    const pairs: Array<[string, number]> = [
      ["R", session.score_realistic || 0],
      ["I", session.score_investigative || 0],
      ["A", session.score_artistic || 0],
      ["S", session.score_social || 0],
      ["E", session.score_enterprising || 0],
      ["C", session.score_conventional || 0],
    ];
    const top = pairs
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((p) => p[0])
      .join("-");
    return session.holland_code || top;
  };

  return (
    <>
      <style jsx>{`
        @page {
          size: A4;
          margin: 22mm 22mm 18mm 14mm;
        }

        @media print {
          .pdf-container {
            margin: 0 !important;
            padding: 0 !important;
          }

          .pdf-section {
            page-break-inside: avoid;
            break-inside: avoid;
            margin: 0 0 40mm 0;
          }

          .pdf-section-large {
            page-break-before: auto;
            page-break-after: auto;
            page-break-inside: avoid;
            break-inside: avoid;
            min-height: 180px;
            margin: 0 0 12mm 0;
          }

          /* removed auto page break on subsequent large sections */

          /* force new page before this section */
          .pdf-break-before {
            page-break-before: always;
            break-before: page;
            margin-top: 0;
          }

          /* unified spacing at the top of a new page for any section */
          .pdf-page-top {
            padding-top: 14mm; /* ensure clear separation from page edge */
            margin-top: 0 !important;
          }

          /* force page break after this section */
          .pdf-break-after {
            page-break-after: always;
            break-after: page;
          }

          .pdf-footer {
            position: fixed;
            bottom: 12mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #6b7280;
            background: white;
            z-index: 1000;
          }
        }
      `}</style>
      <div
        className="pdf-container"
        style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "12px",
          lineHeight: "1.5",
          color: "#111827",
          backgroundColor: "#ffffff",
          padding: "32px",
          maxWidth: "210mm",
          margin: "0 auto",
          boxSizing: "border-box",
          minHeight: "auto",
          height: "auto",
          overflow: "visible",
          paddingBottom: "96px", // reserve space for footer when printing
        }}
      >
        {/* Header */}
        <div
          className="pdf-section"
          style={{
            textAlign: "center",
            marginBottom: "16px",
            backgroundColor: "#ffffff",
            color: "#111827",
            borderRadius: "8px",
            padding: "20px",
          }}
        >
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "700",
              margin: "0",
              letterSpacing: "0.02em",
            }}
          >
            LAPORAN HASIL TES PSIKOLOGI
          </h1>
          <p
            style={{
              fontSize: "12px",
              margin: "6px 0 0 0",
              fontWeight: 500,
              opacity: 0.8,
            }}
          >
            Platform Tes Psikologi Terpadu
          </p>
        </div>

        <div
          style={{
            marginBottom: "24px",
            backgroundColor: "#ffffff",
            color: "#111827",
            borderRadius: "8px",
            padding: "16px 4px",
          }}
        >
          <h2>Tanggal: {formatDate(new Date().toISOString())}</h2>
        </div>

        {/* Disclaimer */}
        {/* <div
          className="pdf-section"
          style={{
            backgroundColor: "#FEF3C7",
            border: "1px solid #FDE68A",
            color: "#92400E",
            borderRadius: "4px",
            padding: "16px",
            marginBottom: "24px",
            fontSize: "11px",
            pageBreakInside: "avoid",
            breakInside: "avoid",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "6px" }}>
            DISCLAIMER SIMULASI
          </div>
          <div>
            Laporan ini merupakan hasil simulasi dan demonstrasi platform tes
            psikologi. Data yang ditampilkan adalah contoh untuk tujuan edukasi.
          </div>
        </div> */}

        {/* informasi tes */}
        <div
          style={{
            padding: "8px 4px",
          }}
        >
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              textAlign: "left",
              color: "#111827",
              margin: "0 0 16px 0",
              paddingBottom: "8px",
            }}
          >
            I. Informasi Tes
          </h2>
          <div
            style={{
              marginTop: "16px",
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
            }}
          ></div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: "16px",
            }}
          >
            {" "}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                alignItems: "stretch",
              }}
            >
              <p>Nama: {session.user_name || "N/A"}</p>
              <p>Email: {session.user_email || "N/A"}</p>
              <p>
                ID Peserta:{" "}
                {session.user_registration_id || session.userId || "N/A"}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                alignItems: "stretch",
              }}
            >
              <p>Tes: {session.test_name || session.test?.name || "N/A"}</p>
              <p>
                Durasi: {session.test_duration || session.test?.duration || 0}{" "}
                menit
              </p>
              <p>Mulai: {formatDate(session.startTime)}</p>
              <p>
                Selesai: {session.endTime ? formatDate(session.endTime) : "-"}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                alignItems: "stretch",
              }}
            >
              <p>Status: {session.status || "N/A"}</p>
              <p>
                Skor Total: {session.score || 0}/{session.maxScore || 0}
              </p>
              <p>
                Waktu Pengerjaan:{""}
                {session.endTime && session.startTime
                  ? (() => {
                      const durationMs =
                        new Date(session.endTime).getTime() -
                        new Date(session.startTime).getTime();
                      const hours = Math.floor(durationMs / (1000 * 60 * 60));
                      const minutes = Math.floor(
                        (durationMs % (1000 * 60 * 60)) / (1000 * 60)
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
              </p>
            </div>
          </div>
        </div>

        {/* ringkasan hasil tes */}
        <div
          style={{
            padding: "44px 4px",
          }}
        >
          <h2
            style={{
              fontSize: "22px",
              fontWeight: "bold",
              textAlign: "left",
              color: "#111827",
              margin: "0 0 16px 0",
              paddingBottom: "8px",
            }}
          >
            II. Ringkasan Hasil Tes
          </h2>
          <div
            style={{
              marginTop: "16px",
              backgroundColor: "#ffffff",
              border: "1px solid #d1d5db",
            }}
          ></div>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
              marginTop: "16px",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                border: "0.5px solid #1D4CD6",
                backgroundColor: "#DBE8FE",
                borderRadius: "8px",
                display: "flex",
                flex: "1 1 0",
                height: "110px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "0 16px",
                  gap: "6px",
                  width: "100%",
                  height: "100%",
                  color: "#1D4CD6",
                }}
              >
                <p
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    lineHeight: 1,
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  {calculatePercentage(session.score, session.maxScore)}
                </p>
                <p style={{ margin: 0, textAlign: "center" }}>TPA</p>
              </div>
            </div>
            <div
              style={{
                border: "0.5px solid #1F822F",
                backgroundColor: "#DAFCE4",
                borderRadius: "8px",
                display: "flex",
                flex: "1 1 0",
                height: "110px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "0 16px",
                  gap: "6px",
                  width: "100%",
                  height: "100%",
                  color: "#1F822F",
                }}
              >
                <p
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    lineHeight: 1,
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  {calculatePercentage(session.score, session.maxScore)}
                </p>
                <p style={{ margin: 0, textAlign: "center" }}>RIASEC</p>
              </div>
            </div>
            <div
              style={{
                border: "0.5px solid #DA7B17",
                backgroundColor: "#FEF2C7",
                borderRadius: "8px",
                display: "flex",
                flex: "1 1 0",
                height: "110px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "0 16px",
                  gap: "6px",
                  width: "100%",
                  height: "100%",
                  color: "#DA7B17",
                }}
              >
                <p
                  style={{
                    fontSize: "32px",
                    fontWeight: "bold",
                    lineHeight: 1,
                    margin: 0,
                    textAlign: "center",
                  }}
                >
                  {calculatePercentage(session.score, session.maxScore)}
                </p>
                <p style={{ margin: 0, textAlign: "center" }}>APTITUDE</p>
              </div>
            </div>
          </div>
        </div>

        {/* TPA */}
        {session.categoryBreakdown && (
          <div
            style={{
              padding: "44px 4px",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                fontWeight: "bold",
                textAlign: "left",
                color: "#111827",
                margin: "0 0 16px 0",
                paddingBottom: "8px",
              }}
            >
              III. Hasil Tes Potensi Akademik
            </h2>
            <div
              style={{
                marginTop: "16px",
                backgroundColor: "#ffffff",
                border: "1px solid #d1d5db",
              }}
            ></div>
            <h3 style={{ fontWeight: "bold", marginTop: "16px" }}>
              Komponen TPA
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "10px",
                marginBottom: "24px",
                marginTop: "24px",
              }}
            >
              {Object.entries(session.categoryBreakdown)
                .filter(([_, data]) => data.maxScore > 0)
                .map(([category, data]) => {
                  const percentage =
                    data.percentage ||
                    calculatePercentage(data.score, data.maxScore);
                  return (
                    <div
                      key={category}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "120px 1fr 48px",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {getCategoryName(category)}
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "14px",
                          background: "#E5E7EB",
                          borderRadius: "9999px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, percentage))}%`,
                            height: "100%",
                            background: "#2563EB",
                            borderRadius: "9999px",
                          }}
                        ></div>
                      </div>
                      <div
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {percentage}%
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        {/* Statistik & Interpretasi */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
            marginBottom: "24px",
            paddingTop: "250px",
            justifyContent: "space-between",
          }}
        >
          {/* Z-Score */}
          <div
            style={{
              borderRadius: "8px",
              backgroundColor: "#DBE8FE",
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              height: "350px",
              padding: "32px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                width: "100%",
              }}
            >
              <h3>Statistik Z-score</h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <p>
                  <b>Z-Score :</b>{" "}
                  {calculateZScore(
                    session.overallPercentage ||
                      calculatePercentage(session.score, session.maxScore)
                  )}
                </p>
                <p>
                  <b>Persentil :</b> {session.overallPercentage}%
                </p>
                <p>
                  <b>Detail :</b>{" "}
                  {getZScoreInterpretation(
                    parseFloat(
                      calculateZScore(
                        session.overallPercentage ||
                          calculatePercentage(session.score, session.maxScore)
                      )
                    )
                  )}
                </p>
              </div>
            </div>
          </div>
          {/* Interpretasi & Rekomendasi */}
          <div
            style={{
              borderRadius: "8px",
              backgroundColor: "#DCFCE5",
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              height: "350px",
              padding: "32px 16px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                width: "100%",
              }}
            >
              <h3>Interpretasi & Rekomendasi</h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <p>
                  <b>Interpretasi :</b>{" "}
                  {(() => {
                    const percentage = session.overallPercentage;
                    const categoryBreakdown = session.categoryBreakdown;

                    // Analisis distribusi kemampuan per kategori - hanya kategori yang ada dalam tes
                    const categories = Object.entries(categoryBreakdown).filter(
                      ([name, data]) => data.maxScore > 0
                    ) as [string, CategoryBreakdown][];
                    const categoryPercentages = categories.map(
                      ([name, data]) => ({
                        name: getCategoryName(name),
                        percentage: data.percentage,
                      })
                    );

                    const excellentCategories = categoryPercentages.filter(
                      (cat) => cat.percentage >= 85
                    );
                    const goodCategories = categoryPercentages.filter(
                      (cat) => cat.percentage >= 70 && cat.percentage < 85
                    );
                    const averageCategories = categoryPercentages.filter(
                      (cat) => cat.percentage >= 55 && cat.percentage < 70
                    );
                    const weakCategories = categoryPercentages.filter(
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
                          .join(", ")} dengan kemampuan analitis yang kuat. `;
                      }
                      if (goodCategories.length > 0) {
                        interpretation += `Kategori ${goodCategories
                          .map((c) => c.name)
                          .join(", ")} juga menunjukkan performa yang baik. `;
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
                          .join(", ")} menunjukkan fondasi yang cukup baik. `;
                      }
                      if (weakCategories.length > 0) {
                        interpretation += `Namun, ${weakCategories
                          .map((c) => c.name)
                          .join(", ")} memerlukan perhatian khusus. `;
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
                <p>
                  <b>Rekomendasi :</b>{" "}
                  {(() => {
                    const percentage = session.overallPercentage;
                    const categoryBreakdown = session.categoryBreakdown;

                    // Analisis detail per kategori untuk rekomendasi yang lebih spesifik - hanya kategori yang ada dalam tes
                    const categories = Object.entries(categoryBreakdown).filter(
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
                    const strongCategories = categoryAnalysis.filter(
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
                          .map((c) => `${c.name} (${c.percentage.toFixed(1)}%)`)
                          .join(", ")} dengan soal-soal yang lebih menantang. `;
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
                          .map((c) => `${c.name} (${c.percentage.toFixed(1)}%)`)
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

        <div>
          <h3 style={{ fontWeight: "bold", marginTop: "16px" }}>
            Analisis Detail Komponen TPA
          </h3>
          {/* Hitung jumlah kolom grid sebelum return */}
          {/* di atas return, tambahkan: */}
          {/*
          const categoryCount = Object.entries(session.categoryBreakdown).filter(([category, data]) => (data as any).maxScore > 0).length;
          let gridColumns = "1fr";
          if (categoryCount === 2) gridColumns = "1fr 1fr";
          else if (categoryCount === 3) gridColumns = "1fr 1fr 1fr";
          else if (categoryCount >= 4) gridColumns = "1fr 1fr 1fr 1fr";
          */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: gridColumns,
              gap: "10px",
              marginTop: "24px",
            }}
          >
            {Object.entries(session.categoryBreakdown)
              .filter(([category, data]) => (data as any).maxScore > 0)
              .map(([category, data]) => {
                const getCategoryAnalysis = (
                  cat: string,
                  percentage: number,
                  score: number,
                  maxScore: number
                ) => {
                  // Standar Interpretasi Nasional TPA
                  const getStandardInterpretation = (perc: number) => {
                    const thresholds = getThresholds(session.minimum_score);
                    if (perc >= 95)
                      return {
                        level: "Superior",
                        desc: "Kemampuan luar biasa (Top 5%)",
                        percentile: "95-100",
                      };
                    if (perc >= thresholds.excellent + 5)
                      return {
                        level: "Sangat Tinggi",
                        desc: "Kemampuan sangat baik (Top 15%)",
                        percentile: "85-94",
                      };
                    if (perc >= thresholds.good + 15)
                      return {
                        level: "Tinggi",
                        desc: "Kemampuan baik (Top 25%)",
                        percentile: "75-84",
                      };
                    if (perc >= thresholds.average)
                      return {
                        level: "Sedang-Tinggi",
                        desc: "Kemampuan cukup baik (Top 40%)",
                        percentile: "60-74",
                      };
                    if (perc >= thresholds.poor + 20)
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
                    const thresholds = getThresholds(session.minimum_score);
                    if (perc >= thresholds.excellent)
                      return "Sangat berpotensi untuk program studi kompetitif (Kedokteran, Teknik, dll)";
                    if (perc >= thresholds.good + 15)
                      return "Berpotensi untuk program studi pilihan dengan persiapan tambahan";
                    if (perc >= thresholds.average)
                      return "Cocok untuk berbagai program studi dengan fokus peningkatan";
                    if (perc >= thresholds.poor + 20)
                      return "Perlu persiapan intensif untuk program studi yang diinginkan";
                    return "Disarankan mengikuti program remedial sebelum melanjutkan ke jenjang berikutnya";
                  };

                  const thresholds = getThresholds(session.minimum_score);
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
                        percentage >= thresholds.good + 15
                          ? "Pemahaman konsep verbal sangat baik, mampu menganalisis hubungan kata dengan tepat, dan memiliki kosakata yang luas"
                          : percentage >= thresholds.average
                          ? "Pemahaman dasar bahasa baik, dapat menangkap makna teks sederhana dengan cukup baik"
                          : "Dasar pemahaman bahasa ada, namun perlu pengembangan kosakata dan kemampuan analisis",

                      weaknesses:
                        percentage < thresholds.average
                          ? "Perlu peningkatan signifikan dalam analisis teks kompleks, pemahaman sinonim-antonim, dan penguasaan kosakata"
                          : percentage < thresholds.excellent
                          ? "Dapat ditingkatkan pada soal analogi yang lebih kompleks dan pemahaman teks akademik"
                          : "Pertahankan kemampuan dengan tantangan yang lebih tinggi",

                      // Rekomendasi Spesifik
                      recommendations:
                        percentage >= thresholds.excellent
                          ? [
                              "Pertahankan dengan membaca literatur akademik",
                              "Latih soal verbal tingkat olimpiade",
                              "Pelajari etimologi kata untuk memperdalam pemahaman",
                            ]
                          : percentage >= thresholds.average
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
                        percentage >= thresholds.excellent + 5
                          ? "Siap untuk soal verbal tingkat universitas dan tes masuk PTN"
                          : percentage >= thresholds.good + 10
                          ? "Cocok untuk soal tingkat SMA dan persiapan UTBK"
                          : percentage >= thresholds.average - 10
                          ? "Mulai dari soal tingkat SMP-SMA"
                          : "Fokus pada soal dasar dan penguasaan kosakata",

                      // Waktu Optimal
                      timeManagement:
                        percentage >= thresholds.excellent
                          ? "Dapat menyelesaikan soal dengan cepat dan akurat"
                          : percentage >= thresholds.average
                          ? "Perlu latihan kecepatan membaca dan analisis"
                          : "Fokus pada akurasi terlebih dahulu, kecepatan akan mengikuti",

                      // Standar Nasional
                      standardLevel: getStandardInterpretation(percentage),
                      comparison: getComparisonAnalysis(percentage),
                      academicPotential: getAcademicPotential(percentage),
                    },

                    TES_ANGKA: {
                      name: "Kemampuan Numerik",
                      shortName: "Numerik",
                      color: "bg-green-50 border-green-200",
                      icon: "",
                      description:
                        "Mengukur kemampuan operasi matematika dasar, deret angka, dan pemecahan masalah numerik",

                      strengths:
                        percentage >= thresholds.good + 15
                          ? "Kemampuan matematika sangat solid, dapat menyelesaikan deret kompleks dan operasi dengan akurasi tinggi"
                          : percentage >= thresholds.average
                          ? "Pemahaman konsep dasar matematika baik, dapat menyelesaikan soal standar dengan benar"
                          : "Pemahaman konsep dasar matematika perlu diperkuat dengan latihan intensif",

                      weaknesses:
                        percentage < thresholds.average
                          ? "Perlu peningkatan menyeluruh dalam operasi dasar, deret angka, dan pemecahan masalah matematika"
                          : percentage < thresholds.excellent
                          ? "Dapat ditingkatkan pada soal matematika aplikatif dan deret yang lebih kompleks"
                          : "Tantang diri dengan soal matematika tingkat lanjut",

                      recommendations:
                        percentage >= thresholds.excellent
                          ? [
                              "Latih soal matematika tingkat olimpiade",
                              "Pelajari statistik dan probabilitas",
                              "Fokus pada soal cerita kompleks",
                            ]
                          : percentage >= thresholds.average
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
                        percentage >= thresholds.excellent + 5
                          ? "Siap untuk matematika tingkat universitas dan tes masuk teknik"
                          : percentage >= thresholds.good + 10
                          ? "Cocok untuk matematika SMA dan persiapan SAINTEK"
                          : percentage >= thresholds.average - 10
                          ? "Mulai dari matematika SMP-SMA"
                          : "Fokus pada operasi dasar dan konsep fundamental",

                      timeManagement:
                        percentage >= thresholds.excellent
                          ? "Dapat menyelesaikan perhitungan dengan cepat dan efisien"
                          : percentage >= thresholds.average
                          ? "Perlu latihan kecepatan perhitungan mental"
                          : "Fokus pada akurasi, gunakan strategi step-by-step",

                      standardLevel: getStandardInterpretation(percentage),
                      comparison: getComparisonAnalysis(percentage),
                      academicPotential: getAcademicPotential(percentage),
                    },

                    TES_LOGIKA: {
                      name: "Kemampuan Logika",
                      shortName: "Logika",
                      color: "bg-purple-50 border-purple-200",
                      icon: "",
                      description:
                        "Mengukur kemampuan penalaran logis, deduksi, induksi, dan pemecahan masalah sistematis",

                      strengths:
                        percentage >= thresholds.good + 15
                          ? "Kemampuan penalaran logis sangat baik, dapat berpikir sistematis dan analitis dengan pola yang kompleks"
                          : percentage >= thresholds.average
                          ? "Kemampuan penalaran dasar baik, dapat mengikuti alur logika sederhana dengan benar"
                          : "Dasar penalaran logis ada, namun perlu pengembangan pola pikir sistematis dan terstruktur",

                      weaknesses:
                        percentage < thresholds.average
                          ? "Perlu peningkatan signifikan dalam penalaran deduktif, induktif, dan pemecahan masalah kompleks"
                          : percentage < thresholds.excellent
                          ? "Dapat ditingkatkan pada soal logika multi-tahap dan penalaran abstrak"
                          : "Tantang dengan soal logika tingkat kompetisi",

                      recommendations:
                        percentage >= thresholds.excellent
                          ? [
                              "Latih soal logika tingkat olimpiade",
                              "Pelajari logika formal dan silogisme",
                              "Berlatih puzzle kompleks",
                            ]
                          : percentage >= thresholds.average
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
                        percentage >= thresholds.excellent + 5
                          ? "Siap untuk tes logika tingkat universitas dan kompetisi"
                          : percentage >= thresholds.good + 10
                          ? "Cocok untuk soal logika SMA dan UTBK"
                          : percentage >= thresholds.average - 10
                          ? "Mulai dari logika SMP-SMA"
                          : "Fokus pada pola dasar dan penalaran sederhana",

                      timeManagement:
                        percentage >= thresholds.excellent
                          ? "Dapat menganalisis pola dengan cepat dan akurat"
                          : percentage >= thresholds.average
                          ? "Perlu latihan kecepatan analisis pola"
                          : "Fokus pada pemahaman konsep, kecepatan akan mengikuti",

                      standardLevel: getStandardInterpretation(percentage),
                      comparison: getComparisonAnalysis(percentage),
                      academicPotential: getAcademicPotential(percentage),
                    },

                    TES_GAMBAR: {
                      name: "Kemampuan Spasial",
                      shortName: "Gambar",
                      color: "bg-yellow-50 border-yellow-200",
                      icon: "",
                      description:
                        "Mengukur kemampuan visualisasi spasial, pengenalan pola, dan analisis bentuk geometris",

                      strengths:
                        percentage >= thresholds.good + 15
                          ? "Kemampuan visualisasi spasial sangat baik, dapat menganalisis bentuk 3D dan pola kompleks dengan akurat"
                          : percentage >= thresholds.average
                          ? "Kemampuan visual dasar baik, dapat mengenali pola sederhana dan orientasi spasial"
                          : "Dasar kemampuan visual ada, namun perlu latihan intensif pengenalan pola dan orientasi spasial",

                      weaknesses:
                        percentage < thresholds.average
                          ? "Perlu peningkatan menyeluruh dalam analisis visual, pengenalan pola, dan kemampuan spasial"
                          : percentage < thresholds.excellent
                          ? "Dapat ditingkatkan pada soal spasial 3D dan transformasi geometris yang kompleks"
                          : "Tantang dengan soal spasial tingkat arsitektur dan engineering",

                      recommendations:
                        percentage >= thresholds.excellent
                          ? [
                              "Latih soal spasial tingkat arsitektur",
                              "Pelajari geometri 3D lanjut",
                              "Berlatih dengan software CAD",
                            ]
                          : percentage >= thresholds.average
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
                        percentage >= thresholds.excellent + 5
                          ? "Siap untuk tes spasial tingkat arsitektur dan engineering"
                          : percentage >= thresholds.good + 10
                          ? "Cocok untuk soal spasial SMA dan tes masuk teknik"
                          : percentage >= thresholds.average - 10
                          ? "Mulai dari soal visual SMP-SMA"
                          : "Fokus pada pola dasar dan orientasi sederhana",

                      timeManagement:
                        percentage >= thresholds.excellent
                          ? "Dapat memvisualisasikan dengan cepat dan akurat"
                          : percentage >= thresholds.average
                          ? "Perlu latihan kecepatan visualisasi"
                          : "Fokus pada akurasi visualisasi, gunakan bantuan sketsa",

                      standardLevel: getStandardInterpretation(percentage),
                      comparison: getComparisonAnalysis(percentage),
                      academicPotential: getAcademicPotential(percentage),
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
                    (answer: Answer) => answer.question.category === category
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "justifyStart",
                        justifyContent: "spaceBetween",
                        marginBottom: "8px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span>{analysis.icon}</span>
                        <div>
                          <h4 style={{ marginBottom: "8px" }}>
                            {analysis.shortName}
                          </h4>
                          <div>
                            <b>Skor:</b> {data.percentage.toFixed(1)}%
                          </div>
                          <div>
                            <b>Level:</b> {analysis.standardLevel.level}
                          </div>
                          <div>
                            <p
                              style={{
                                display: "flex",
                                gap: "12px",
                                fontSize: "14px",
                                marginTop: "12px",
                                marginBottom: "12px",
                              }}
                            >
                              <b>Detail Analisis</b>
                            </p>
                          </div>
                          <div>
                            <b>Kekuatan:</b> {analysis.strengths}
                          </div>
                          <div>
                            <b>Area Pengembangan:</b> {analysis.weaknesses}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Hasil Tes */}
        {session.status === "COMPLETED" && (
          <>
            {/* Section Heading: Ringkasan Hasil Tes */}
            <div
              className="pdf-section"
              style={{
                padding: "12px 16px",
                marginBottom: "12px",
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  textAlign: "left",
                  color: "#111827",
                  margin: "0",
                  paddingBottom: "6px",
                }}
              >
                II. RINGKASAN HASIL TES
              </h2>
            </div>

            {/* Hasil Akhir */}
            <div
              className="pdf-section-large"
              style={{
                borderRadius: "12px",
                padding: "32px",
                marginBottom: "24px",
                breakInside: "avoid",
                pageBreakInside: "avoid",
                boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  textAlign: "center",
                  color: "#111827",
                  margin: "0 0 24px 0",
                }}
              >
                Ringkasan Hasil Tes
              </h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "24px",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    padding: "20px 16px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "8px",
                      fontWeight: "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Skor
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: "#111827",
                      lineHeight: "1.2",
                    }}
                  >
                    {session.score || 0}/{session.maxScore || 0}
                  </div>
                </div>

                <div
                  style={{
                    padding: "20px 16px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "8px",
                      fontWeight: "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Persentase
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      fontWeight: "bold",
                      color: getScoreColor(
                        session.overallPercentage ||
                          calculatePercentage(session.score, session.maxScore),
                        session.minimum_score
                      ),
                      lineHeight: "1.2",
                    }}
                  >
                    {session.overallPercentage ||
                      calculatePercentage(session.score, session.maxScore)}
                    %
                  </div>
                </div>

                <div
                  style={{
                    padding: "20px 16px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "8px",
                      fontWeight: "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Status
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color:
                        (session.overallPercentage ||
                          calculatePercentage(
                            session.score,
                            session.maxScore
                          )) >= (session.minimum_score || 60)
                          ? "#16a34a"
                          : "#dc2626",
                      lineHeight: "1.2",
                    }}
                  >
                    {(session.overallPercentage ||
                      calculatePercentage(session.score, session.maxScore)) >=
                    (session.minimum_score || 60)
                      ? "LULUS"
                      : "TIDAK LULUS"}
                  </div>
                </div>

                <div
                  style={{
                    padding: "20px 16px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#64748b",
                      marginBottom: "8px",
                      fontWeight: "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Pesan
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color:
                        (session.overallPercentage ||
                          calculatePercentage(
                            session.score,
                            session.maxScore
                          )) >= (session.minimum_score || 60)
                          ? "#16a34a"
                          : "#dc2626",
                      lineHeight: "1.2",
                    }}
                  >
                    {getScoreMessage(
                      session.overallPercentage ||
                        calculatePercentage(session.score, session.maxScore),
                      session.minimum_score
                    )}
                  </div>
                </div>
              </div>

              {/* Secondary summary row: TPA, RIASEC, Aptitude badges */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "16px",
                  marginTop: "24px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "14px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#374151",
                      fontWeight: 600,
                    }}
                  >
                    TPA
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    {calculatePercentage(session.score, session.maxScore)}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                    Skor total
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "14px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#374151",
                      fontWeight: 600,
                    }}
                  >
                    RIASEC
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    {getRiasecTotal().percent}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                    {getTopHolland()}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "14px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#374151",
                      fontWeight: 600,
                    }}
                  >
                    Aptitude
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#111827",
                    }}
                  >
                    {getAptitudePercent()}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>
                    Skor Total
                  </div>
                </div>
              </div>
            </div>

            {/* Hasil Tes Potensi Akademik */}
            {session.categoryBreakdown && (
              <div
                className="pdf-section-large pdf-break-before pdf-page-top"
                style={{
                  borderRadius: "8px",
                  padding: "24px",
                  marginBottom: "24px",
                  paddingTop: "64px",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    textAlign: "center",
                    color: "#111827",
                    marginBottom: "32px",
                  }}
                >
                  Hasil Tes Potensi Akademik
                </h2>

                {/* Komponen TPA - Level Bars */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "10px",
                    marginBottom: "24px",
                  }}
                >
                  {Object.entries(session.categoryBreakdown)
                    .filter(([_, data]) => data.maxScore > 0)
                    .map(([category, data]) => {
                      const percentage =
                        data.percentage ||
                        calculatePercentage(data.score, data.maxScore);
                      return (
                        <div
                          key={category}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "120px 1fr 48px",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {getCategoryName(category)}
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "14px",
                              background: "#E5E7EB",
                              borderRadius: "9999px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(0, percentage)
                                )}%`,
                                height: "100%",
                                background: "#2563EB",
                                borderRadius: "9999px",
                              }}
                            ></div>
                          </div>
                          <div
                            style={{
                              textAlign: "right",
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {percentage}%
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "24px",
                    marginBottom: "24px",
                    pageBreakInside: "avoid",
                    breakInside: "avoid",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <h3>Statistik Z-score</h3>
                  </div>
                </div>

                {/* Statistik Z-Score & Interpretasi */}
                {/* <div
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "24px",
                    marginBottom: "24px",
                    pageBreakInside: "avoid",
                    breakInside: "avoid",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#111827",
                      marginBottom: "20px",
                      textAlign: "center",
                    }}
                  >
                    Statistik Z-Score & Interpretasi
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "20px",
                      marginBottom: "24px",
                      pageBreakInside: "avoid",
                      breakInside: "avoid",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        padding: "16px",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #e5e7eb",
                        pageBreakInside: "avoid",
                        breakInside: "avoid",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "4px",
                        }}
                      >
                        Z-Score
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#111827",
                        }}
                      >
                        {calculateZScore(
                          session.overallPercentage ||
                            calculatePercentage(session.score, session.maxScore)
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        padding: "16px",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #e5e7eb",
                        pageBreakInside: "avoid",
                        breakInside: "avoid",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "4px",
                        }}
                      >
                        Persentil
                      </div>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#111827",
                        }}
                      >
                        {Math.round(
                          (1 -
                            Math.exp(
                              -0.07056 *
                                Math.pow(
                                  parseFloat(
                                    calculateZScore(
                                      session.overallPercentage ||
                                        calculatePercentage(
                                          session.score,
                                          session.maxScore
                                        )
                                    )
                                  ),
                                  3
                                ) -
                                0.75006 *
                                  parseFloat(
                                    calculateZScore(
                                      session.overallPercentage ||
                                        calculatePercentage(
                                          session.score,
                                          session.maxScore
                                        )
                                    )
                                  )
                            )) *
                            100
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        padding: "16px",
                        borderRadius: "6px",
                        textAlign: "center",
                        border: "1px solid #e5e7eb",
                        pageBreakInside: "avoid",
                        breakInside: "avoid",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginBottom: "4px",
                        }}
                      >
                        Detail
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "#111827",
                        }}
                      >
                        {getZScoreInterpretation(
                          parseFloat(
                            calculateZScore(
                              session.overallPercentage ||
                                calculatePercentage(
                                  session.score,
                                  session.maxScore
                                )
                            )
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "20px",
                        marginBottom: "16px",
                        display: "flex",
                        flexDirection: "row",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: "12px",
                        }}
                      >
                        Interpretasi & Rekomendasi
                      </h4>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#374151",
                          lineHeight: "1.6",
                          margin: "0",
                        }}
                      >
                        {getOverallRecommendation(
                          session.overallPercentage ||
                            calculatePercentage(
                              session.score,
                              session.maxScore
                            ),
                          session.categoryBreakdown
                        )}
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "20px",
                        pageBreakInside: "avoid",
                        breakInside: "avoid",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: "#111827",
                          marginBottom: "12px",
                        }}
                      >
                        Rekomendasi Pengembangan
                      </h4>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#374151",
                          lineHeight: "1.6",
                        }}
                      >
                        <p style={{ margin: "0 0 8px 0" }}>
                          Berdasarkan hasil tes Anda, berikut adalah rekomendasi
                          untuk pengembangan lebih lanjut:
                        </p>
                        <ul style={{ margin: "0", paddingLeft: "20px" }}>
                          <li>
                            Fokus pada peningkatan kemampuan di area yang masih
                            lemah
                          </li>
                          <li>
                            Lakukan latihan rutin untuk mempertahankan kemampuan
                            yang sudah baik
                          </li>
                          <li>
                            Ikuti program pengembangan yang sesuai dengan profil
                            kemampuan Anda
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            )}

            {/* RIASEC Results */}
            {(session.score_realistic ||
              session.score_investigative ||
              session.score_artistic ||
              session.score_social ||
              session.score_enterprising ||
              session.score_conventional) && (
              <div
                className="pdf-section-large pdf-break-before pdf-page-top"
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    textAlign: "center",
                    color: "#111827",
                    marginBottom: "12px",
                  }}
                >
                  IV. HASIL TES MINAT RIASEC
                </h2>
                <div
                  style={{
                    textAlign: "center",
                    color: "#0ea5e9",
                    fontWeight: 800,
                    marginBottom: "20px",
                  }}
                >
                  {getTopHolland()}
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                      marginTop: "4px",
                    }}
                  >
                    Kombinasi 3 dimensi tertinggi
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "16px",
                  }}
                >
                  {/* Realistic */}
                  <div
                    style={{
                      backgroundColor: "#fef3c7",
                      border: "1px solid #f59e0b",
                      borderRadius: "8px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#92400e",
                            margin: "0 0 4px 0",
                          }}
                        >
                          Realistic
                        </h4>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#d97706",
                            margin: "0",
                          }}
                        >
                          Praktis & Teknis
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#92400e",
                          }}
                        >
                          {session.score_realistic || 0}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#d97706",
                          }}
                        >
                          dari {session.max_score_realistic || 0}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#fbbf24",
                        borderRadius: "4px",
                        height: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            ((session.score_realistic || 0) /
                              (session.max_score_realistic || 1)) *
                              100,
                            100
                          )}%`,
                          backgroundColor: "#f59e0b",
                          height: "100%",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Investigative */}
                  <div
                    style={{
                      backgroundColor: "#dbeafe",
                      border: "1px solid #3b82f6",
                      borderRadius: "8px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#1d4ed8",
                            margin: "0 0 4px 0",
                          }}
                        >
                          Investigative
                        </h4>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#2563eb",
                            margin: "0",
                          }}
                        >
                          Analitis & Ilmiah
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#1d4ed8",
                          }}
                        >
                          {session.score_investigative || 0}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#2563eb",
                          }}
                        >
                          dari {session.max_score_investigative || 0}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#93c5fd",
                        borderRadius: "4px",
                        height: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            ((session.score_investigative || 0) /
                              (session.max_score_investigative || 1)) *
                              100,
                            100
                          )}%`,
                          backgroundColor: "#3b82f6",
                          height: "100%",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Artistic */}
                  <div
                    style={{
                      backgroundColor: "#fce7f3",
                      border: "1px solid #ec4899",
                      borderRadius: "8px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#be185d",
                            margin: "0 0 4px 0",
                          }}
                        >
                          Artistic
                        </h4>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#db2777",
                            margin: "0",
                          }}
                        >
                          Kreatif & Ekspresif
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#be185d",
                          }}
                        >
                          {session.score_artistic || 0}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#db2777",
                          }}
                        >
                          dari {session.max_score_artistic || 0}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#f9a8d4",
                        borderRadius: "4px",
                        height: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            ((session.score_artistic || 0) /
                              (session.max_score_artistic || 1)) *
                              100,
                            100
                          )}%`,
                          backgroundColor: "#ec4899",
                          height: "100%",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Social */}
                  <div
                    style={{
                      backgroundColor: "#dcfce7",
                      border: "1px solid #22c55e",
                      borderRadius: "8px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#15803d",
                            margin: "0 0 4px 0",
                          }}
                        >
                          Social
                        </h4>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#16a34a",
                            margin: "0",
                          }}
                        >
                          Sosial & Membantu
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#15803d",
                          }}
                        >
                          {session.score_social || 0}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#16a34a",
                          }}
                        >
                          dari {session.max_score_social || 0}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#86efac",
                        borderRadius: "4px",
                        height: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            ((session.score_social || 0) /
                              (session.max_score_social || 1)) *
                              100,
                            100
                          )}%`,
                          backgroundColor: "#22c55e",
                          height: "100%",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Enterprising */}
                  <div
                    style={{
                      backgroundColor: "#fef2f2",
                      border: "1px solid #ef4444",
                      borderRadius: "8px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#dc2626",
                            margin: "0 0 4px 0",
                          }}
                        >
                          Enterprising
                        </h4>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#ef4444",
                            margin: "0",
                          }}
                        >
                          Kepemimpinan & Bisnis
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#dc2626",
                          }}
                        >
                          {session.score_enterprising || 0}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#ef4444",
                          }}
                        >
                          dari {session.max_score_enterprising || 0}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#fca5a5",
                        borderRadius: "4px",
                        height: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            ((session.score_enterprising || 0) /
                              (session.max_score_enterprising || 1)) *
                              100,
                            100
                          )}%`,
                          backgroundColor: "#ef4444",
                          height: "100%",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Conventional */}
                  <div
                    style={{
                      backgroundColor: "#f3e8ff",
                      border: "1px solid #8b5cf6",
                      borderRadius: "8px",
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <div>
                        <h4
                          style={{
                            fontSize: "16px",
                            fontWeight: "bold",
                            color: "#7c3aed",
                            margin: "0 0 4px 0",
                          }}
                        >
                          Conventional
                        </h4>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#8b5cf6",
                            margin: "0",
                          }}
                        >
                          Terorganisir & Detail
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "18px",
                            fontWeight: "bold",
                            color: "#7c3aed",
                          }}
                        >
                          {session.score_conventional || 0}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#8b5cf6",
                          }}
                        >
                          dari {session.max_score_conventional || 0}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        backgroundColor: "#c4b5fd",
                        borderRadius: "4px",
                        height: "8px",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            ((session.score_conventional || 0) /
                              (session.max_score_conventional || 1)) *
                              100,
                            100
                          )}%`,
                          backgroundColor: "#8b5cf6",
                          height: "100%",
                          borderRadius: "4px",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                    marginTop: "20px",
                  }}
                >
                  <div
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#065f46",
                        marginBottom: 8,
                      }}
                    >
                      Rekomendasi Jurusan
                    </div>
                    <div style={{ fontSize: 12, color: "#065f46" }}>
                      <div>Teknik Informatika</div>
                      <div>Sistem Informasi</div>
                      <div>Matematika</div>
                      <div>Fisika</div>
                      <div>Statistika</div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#f5f3ff",
                      border: "1px solid #ddd6fe",
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#5b21b6",
                        marginBottom: 8,
                      }}
                    >
                      Rekomendasi Karir
                    </div>
                    <div style={{ fontSize: 12, color: "#5b21b6" }}>
                      <div>Software Engineer</div>
                      <div>Data Scientist</div>
                      <div>Research Analyst</div>
                      <div>System Analyst</div>
                      <div>Mathematician</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Aptitude Section */}
            {(session.aptitude_score_total ||
              session.mi_visual_spatial ||
              session.mi_logical_mathematical) && (
              <div
                className="pdf-section-large pdf-break-before pdf-page-top"
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "24px",
                  marginBottom: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    textAlign: "center",
                    color: "#111827",
                    marginBottom: 12,
                  }}
                >
                  V. HASIL TES BAKAT/APTITUDE
                </h2>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#1e293b",
                    marginBottom: 8,
                  }}
                >
                  {getAptitudePercent()}
                </div>
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: "#64748b",
                    marginBottom: 20,
                  }}
                >
                  Skor Total Aptitude
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#92400e",
                        marginBottom: 8,
                      }}
                    >
                      Interpretasi & Peta Kekuatan
                    </div>
                    <div style={{ fontSize: 12, color: "#92400e" }}>
                      Kemampuan bakat yang seimbang dengan kekuatan di
                      visual-spatial dan penalaran logis.
                    </div>
                  </div>
                  <div
                    style={{
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#065f46",
                        marginBottom: 8,
                      }}
                    >
                      Rekomendasi Bidang
                    </div>
                    <div style={{ fontSize: 12, color: "#065f46" }}>
                      <div>Computer Science & Engineering</div>
                      <div>Data Science & Analytics</div>
                      <div>Design & Architecture</div>
                      <div>Research & Development</div>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {[
                    {
                      label: "Visual-Spatial Intelligence",
                      key: "mi_visual_spatial",
                      colorBg: "#dcfce7",
                      colorBar: "#16a34a",
                    },
                    {
                      label: "Logical-Mathematical Intelligence",
                      key: "mi_logical_mathematical",
                      colorBg: "#e0e7ff",
                      colorBar: "#6366f1",
                    },
                    {
                      label: "Linguistic Intelligence",
                      key: "mi_linguistic",
                      colorBg: "#e0f2fe",
                      colorBar: "#3b82f6",
                    },
                    {
                      label: "Interpersonal Intelligence",
                      key: "mi_interpersonal",
                      colorBg: "#fffbeb",
                      colorBar: "#f59e0b",
                    },
                    {
                      label: "Musical Intelligence",
                      key: "mi_musical",
                      colorBg: "#fce7f3",
                      colorBar: "#ec4899",
                    },
                    {
                      label: "Bodily-Kinesthetic Intelligence",
                      key: "mi_bodily_kinesthetic",
                      colorBg: "#f1f5f9",
                      colorBar: "#64748b",
                    },
                    {
                      label: "Intrapersonal Intelligence",
                      key: "mi_intrapersonal",
                      colorBg: "#fff7ed",
                      colorBar: "#fb923c",
                    },
                    {
                      label: "Naturalistic Intelligence",
                      key: "mi_naturalistic",
                      colorBg: "#f0fdf4",
                      colorBar: "#22c55e",
                    },
                  ].map((item, idx) => {
                    const value = (session as any)[item.key] ?? null;
                    if (value === null || value === undefined) return null;
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 8,
                          padding: 12,
                        }}
                      >
                        <div style={{ fontSize: 12, marginBottom: 8 }}>
                          {item.label}
                        </div>
                        <div
                          style={{
                            width: "100%",
                            height: 8,
                            background: item.colorBg,
                            borderRadius: 4,
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, value))}%`,
                              height: "100%",
                              background: item.colorBar,
                              borderRadius: 4,
                            }}
                          ></div>
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#64748b",
                            marginTop: 6,
                          }}
                        >
                          Skor: {value}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Session Info, Answer Summary, and Comprehensive Recommendations */}
            {/* <div
              className="pdf-section-large pdf-break-before pdf-page-top"
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#111827",
                  marginBottom: 16,
                }}
              >
                VI. INFORMASI SESSION TES
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Waktu Mulai
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {formatDate(session.startTime)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Waktu Selesai
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {session.endTime ? formatDate(session.endTime) : "-"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Tingkat Penyelesaian
                  </div>
                  <div style={{ fontWeight: 700 }}>
                    {session.status === "COMPLETED" ? "100%" : "-"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    Lingkungan
                  </div>
                  <div style={{ fontWeight: 700 }}>Online Platform</div>
                </div>
              </div>

              <h2
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#111827",
                  margin: "8px 0 12px",
                }}
              >
                VII. RINGKASAN JAWABAN TES
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>
                    Tes Potensi Akademik (TPA) - Total
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Skor: {session.score || 0} dari {session.maxScore || 0}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Akurasi:{" "}
                    {calculatePercentage(session.score, session.maxScore)}%
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>
                    Tes Minat RIASEC
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Kode: {getTopHolland()}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Persentase total: {getRiasecTotal().percent}%
                  </div>
                </div>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>
                    Tes Bakat/Aptitude
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    Skor Total: {getAptitudePercent()}%
                  </div>
                </div>
              </div>

              <h2
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#111827",
                  margin: "8px 0 12px",
                }}
              >
                VIII. REKOMENDASI KOMPREHENSIF
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#1d4ed8",
                      marginBottom: 8,
                    }}
                  >
                    Rekomendasi Akademis
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      fontSize: 12,
                      color: "#1e3a8a",
                    }}
                  >
                    <li>
                      Fokus pada pengembangan kemampuan verbal dan numerik
                    </li>
                    <li>Ikuti program pengembangan akademik</li>
                    <li>Latihan soal TPA secara rutin</li>
                  </ul>
                </div>
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#065f46",
                      marginBottom: 8,
                    }}
                  >
                    Rekomendasi Karir
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      fontSize: 12,
                      color: "#064e3b",
                    }}
                  >
                    <li>Pertimbangkan karir di bidang teknologi informasi</li>
                    <li>Kembangkan kemampuan analisis data</li>
                    <li>Bangun portfolio proyek-proyek praktis</li>
                  </ul>
                </div>
                <div
                  style={{
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      color: "#92400e",
                      marginBottom: 8,
                    }}
                  >
                    Rekomendasi Personal
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      fontSize: 12,
                      color: "#7c2d12",
                    }}
                  >
                    <li>Kembangkan kemampuan komunikasi interpersonal</li>
                    <li>Tingkatkan kemampuan kerja tim</li>
                    <li>Bangun networking di bidang yang diminati</li>
                  </ul>
                </div>
              </div>
            </div> */}
          </>
        )}

        {/* Footer */}
        <div
          className="pdf-footer"
          style={{
            marginTop: "50px",
            textAlign: "center",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "20px",
            pageBreakInside: "avoid",
            breakInside: "avoid",
          }}
        >
          <p style={{ margin: "10px 0", fontSize: "10px", color: "#6b7280" }}>
            Dokumen ini digenerate secara otomatis pada {getCurrentDateTime()}
          </p>
          <p style={{ margin: "10px 0", fontSize: "10px", color: "#6b7280" }}>
            ©2024 Sistem Tes Potensi Akademik - Semua hak dilindungi
          </p>
        </div>
      </div>
    </>
  );
};

export default PDFResultTemplate;
