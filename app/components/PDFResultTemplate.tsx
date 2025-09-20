"use client";

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
    return Math.round((score / maxScore) * 100);
  };

  const getScoreMessage = (percentage: number, minimumScore?: number) => {
    const threshold = minimumScore || 60;
    if (percentage >= threshold + 20) return "Sangat Baik";
    if (percentage >= threshold + 10) return "Baik";
    if (percentage >= threshold) return "Cukup";
    return "Perlu Perbaikan";
  };

  const getScoreColor = (percentage: number, minimumScore?: number) => {
    const threshold = minimumScore || 60;
    if (percentage >= threshold + 20) return "#16a34a"; // green-600
    if (percentage >= threshold) return "#2563eb"; // blue-600
    return "#dc2626"; // red-600
  };

  const getCategoryName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      'TES_VERBAL': 'Tes Verbal',
      'TES_ANGKA': 'Tes Angka',
      'TES_LOGIKA': 'Tes Logika',
      'TES_GAMBAR': 'Tes Gambar'
    };
    return categoryNames[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'TES_VERBAL': '📝',
      'TES_ANGKA': '🔢',
      'TES_LOGIKA': '🧠',
      'TES_GAMBAR': '🖼️'
    };
    return icons[category] || '📊';
  };

  const getThresholds = (minimumScore?: number) => {
    const base = minimumScore || 60;
    return {
      excellent: base + 20,
      good: base + 10,
      average: base
    };
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      fontSize: '12px', 
      lineHeight: '1.4',
      color: '#111827',
      backgroundColor: '#fff',
      padding: '20px',
      maxWidth: '210mm',
      margin: '0 auto',
      boxSizing: 'border-box',
      minHeight: 'auto',
      height: 'auto',
      overflow: 'visible'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '30px',
        borderBottom: '2px solid #374151',
        paddingBottom: '20px'
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          margin: '0 0 10px 0',
          color: '#111827'
        }}>
          Detail Hasil Tes
        </h1>
        <p style={{ 
          fontSize: '14px', 
          margin: '0',
          color: '#6b7280'
        }}>
          Detail lengkap hasil tes Anda
        </p>
      </div>

      {/* Informasi Tes - Grid Layout */}
      <div style={{ 
        backgroundColor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          textAlign: 'center',
          color: '#111827',
          marginBottom: '32px'
        }}>
          Informasi Tes
        </h2>
        
        <div style={{ 
          display: 'block', 
          marginBottom: '24px'
        }}>
          {/* Data Peserta */}
          <div style={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '32px 24px',
            marginBottom: '16px'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '500', 
              color: '#111827',
              marginBottom: '24px'
            }}>
              Data Peserta
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>Nama:</span>
                <span style={{ marginLeft: '8px', color: '#111827' }}>
                  {session.user_name || "N/A"}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>Email:</span>
                <span style={{ marginLeft: '8px', color: '#111827' }}>
                  {session.user_email || "N/A"}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>ID Peserta:</span>
                <span style={{ 
                  marginLeft: '8px', 
                  color: '#111827',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}>
                  {session.user_registration_id || session.userId || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Data Tes */}
          <div style={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '32px 24px',
            marginBottom: '16px'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '500', 
              color: '#111827',
              marginBottom: '24px'
            }}>
              Data Tes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>Tes:</span>
                <span style={{ marginLeft: '8px', color: '#111827' }}>
                  {session.test_name || session.test?.name || "N/A"}
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>Durasi:</span>
                <span style={{ marginLeft: '8px', color: '#111827' }}>
                  {session.test_duration || session.test?.duration || 0} menit
                </span>
              </div>
              <div>
                <span style={{ fontWeight: '500', color: '#374151' }}>Mulai:</span>
                <span style={{ marginLeft: '8px', color: '#111827' }}>
                  {formatDate(session.startTime)}
                </span>
              </div>
              {session.status === "COMPLETED" && session.endTime && (
                <div>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Selesai:</span>
                  <span style={{ marginLeft: '8px', color: '#111827' }}>
                    {formatDate(session.endTime)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Status Tes */}
          <div style={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '32px 24px',
            marginBottom: '16px'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '500', 
              color: '#111827',
              marginBottom: '24px'
            }}>
              Status Tes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontWeight: '500', color: '#374151', display: 'block', marginBottom: '4px' }}>Status:</span>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: session.status === "COMPLETED" ? '#dcfce7' : '#fee2e2',
                  color: session.status === "COMPLETED" ? '#166534' : '#991b1b'
                }}>
                  {session.status === "COMPLETED" ? "✅ Selesai" : "❌ Belum Selesai"}
                </div>
              </div>
              
              {session.status === "COMPLETED" && (
                <>
                  <div>
                    <span style={{ fontWeight: '500', color: '#374151' }}>Skor:</span>
                    <span style={{ 
                      marginLeft: '8px',
                      fontWeight: '700',
                      color: '#111827'
                    }}>
                      {session.score || 0} / {session.maxScore || 0}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: '500', color: '#374151' }}>Persentase:</span>
                    <span style={{ 
                      marginLeft: '8px',
                      fontWeight: '700',
                      color: '#111827'
                    }}>
                      {session.overallPercentage || calculatePercentage(session.score, session.maxScore)}%
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hasil Tes */}
      {session.status === "COMPLETED" && (
        <>
          {/* Hasil Akhir */}
          <div style={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              textAlign: 'center',
              color: '#111827',
              marginBottom: '32px'
            }}>
              Hasil Akhir
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr 1fr', 
              gap: '24px',
              marginBottom: '20px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Nilai</div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: getScoreColor(
                    session.overallPercentage || calculatePercentage(session.score, session.maxScore),
                    session.minimum_score
                  )
                }}>
                  {session.score}/{session.maxScore}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Persentase</div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: getScoreColor(
                    session.overallPercentage || calculatePercentage(session.score, session.maxScore),
                    session.minimum_score
                  )
                }}>
                  {session.overallPercentage || calculatePercentage(session.score, session.maxScore)}%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Status</div>
                {(session.overallPercentage || calculatePercentage(session.score, session.maxScore)) >= (session.minimum_score || 60) ? (
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#16a34a' }}>
                    Lulus
                  </div>
                ) : (
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc2626' }}>
                    Gagal
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Pesan</div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: (session.overallPercentage || calculatePercentage(session.score, session.maxScore)) >= (session.minimum_score || 60) ? '#16a34a' : '#dc2626'
                }}>
                  {getScoreMessage(
                    session.overallPercentage || calculatePercentage(session.score, session.maxScore),
                    session.minimum_score
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hasil Tes Potensi Akademik */}
          <div style={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '24px',
            pageBreakBefore: 'always',
            breakBefore: 'page'
          }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              textAlign: 'center',
              color: '#111827',
              marginBottom: '32px'
            }}>
              Hasil Tes Potensi Akademik
            </h2>
            
            {/* Category Breakdown */}
            {session.categoryBreakdown && (
              <div style={{ marginBottom: '4px' }}>
                <div style={{ padding: '24px' }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '500', 
                    color: '#111827',
                    marginBottom: '24px'
                  }}>
                    Komponen TPA
                  </h3>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '12px'
                  }}>
                    {Object.entries(session.categoryBreakdown)
                      .filter(([category, data]) => data.maxScore > 0)
                      .map(([category, data]) => {
                        const percentage = data.percentage || calculatePercentage(data.score, data.maxScore);
                        const thresholds = getThresholds(session.minimum_score);
                        
                        return (
                          <div
                            key={category}
                            style={{
                              backgroundColor: '#f9fafb',
                              borderRadius: '8px',
                              padding: '16px'
                            }}
                          >
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'space-between',
                              marginBottom: '12px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ fontSize: '16px', marginRight: '8px' }}>
                                  {getCategoryIcon(category)}
                                </span>
                                <h4 style={{ 
                                  fontWeight: '500', 
                                  color: '#111827',
                                  margin: '0'
                                }}>
                                  {getCategoryName(category)}
                                </h4>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                                  Skor:
                                </span>
                                <span style={{ fontWeight: '600', color: '#111827' }}>
                                  {data.score}/{data.maxScore}
                                </span>
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                                  Persentase:
                                </span>
                                <span style={{
                                  fontWeight: 'bold',
                                  color: getScoreColor(percentage, session.minimum_score)
                                }}>
                                  {percentage}%
                                </span>
                              </div>

                              {/* Progress Bar */}
                              <div style={{ 
                                width: '100%', 
                                backgroundColor: '#e5e7eb', 
                                borderRadius: '4px', 
                                height: '8px',
                                marginTop: '12px'
                              }}>
                                <div style={{
                                  height: '8px',
                                  borderRadius: '4px',
                                  width: `${Math.min(percentage, 100)}%`,
                                  backgroundColor: percentage >= thresholds.excellent
                                    ? '#10b981'
                                    : percentage >= thresholds.average
                                    ? '#f59e0b'
                                    : '#ef4444'
                                }}></div>
                              </div>

                              <div style={{ marginTop: '8px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  borderRadius: '20px',
                                  fontSize: '12px',
                                  backgroundColor: percentage >= thresholds.excellent
                                    ? '#d1fae5'
                                    : percentage >= thresholds.average
                                    ? '#fef3c7'
                                    : '#fee2e2',
                                  color: percentage >= thresholds.excellent
                                    ? '#065f46'
                                    : percentage >= thresholds.average
                                    ? '#92400e'
                                    : '#991b1b'
                                }}>
                                  {percentage >= thresholds.excellent
                                    ? "Sangat Baik"
                                    : percentage >= thresholds.average
                                    ? "Baik"
                                    : "Perlu Perbaikan"}
                                </span>
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

          {/* RIASEC Results */}
          {(session.score_realistic !== undefined || session.score_investigative !== undefined || 
            session.score_artistic !== undefined || session.score_social !== undefined ||
            session.score_enterprising !== undefined || session.score_conventional !== undefined) && (
            <>
              <div style={{ 
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '24px',
                marginBottom: '24px',
                pageBreakBefore: 'always',
                breakBefore: 'page'
              }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                marginBottom: '24px'
              }}>
                <div>
                  <h3 style={{ 
                    fontSize: '18px', 
                    fontWeight: '500', 
                    color: '#111827',
                    margin: '0 0 4px 0'
                  }}>
                    Hasil Tes RIASEC
                  </h3>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    margin: '0'
                  }}>
                    Profil Minat dan Kepribadian Karir
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Holland Code */}
                {session.holland_code && (
                  <div style={{ 
                    backgroundColor: '#faf5ff',
                    border: '1px solid #e9d5ff',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <h4 style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: '#6b21a8',
                        margin: '0 0 8px 0'
                      }}>
                        Kode Holland Anda
                      </h4>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold', 
                        color: '#7c3aed',
                        margin: '0 0 8px 0'
                      }}>
                        {session.holland_code}
                      </div>
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#7c2d12',
                        margin: '0'
                      }}>
                        Kombinasi tiga dimensi tertinggi dari profil RIASEC Anda
                      </p>
                    </div>
                  </div>
                )}

                {/* RIASEC Scores Grid */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr', 
                  gap: '16px'
                }}>
                  {/* Realistic */}
                  <div style={{ 
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: 'bold', 
                          color: '#166534',
                          margin: '0 0 4px 0'
                        }}>
                          Realistic
                        </h4>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#15803d',
                          margin: '0'
                        }}>
                          Praktis & Teknis
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: 'bold', 
                          color: '#166534'
                        }}>
                          {session.score_realistic || 0}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#16a34a'
                        }}>
                          dari {session.max_score_realistic || 0}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      backgroundColor: '#bbf7d0', 
                      borderRadius: '4px', 
                      height: '8px'
                    }}>
                      <div style={{
                        width: `${Math.min(((session.score_realistic || 0) / (session.max_score_realistic || 1)) * 100, 100)}%`,
                        backgroundColor: '#16a34a',
                        height: '100%',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                  </div>

                  {/* Add other RIASEC categories similarly... */}
                  {/* For brevity, I'll add just one more example */}
                  
                  {/* Investigative */}
                  <div style={{ 
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px'
                    }}>
                      <div>
                        <h4 style={{ 
                          fontSize: '16px', 
                          fontWeight: 'bold', 
                          color: '#1e40af',
                          margin: '0 0 4px 0'
                        }}>
                          Investigative
                        </h4>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#2563eb',
                          margin: '0'
                        }}>
                          Analitis & Ilmiah
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '18px', 
                          fontWeight: 'bold', 
                          color: '#1e40af'
                        }}>
                          {session.score_investigative || 0}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#2563eb'
                        }}>
                          dari {session.max_score_investigative || 0}
                        </div>
                      </div>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      backgroundColor: '#bfdbfe', 
                      borderRadius: '4px', 
                      height: '8px'
                    }}>
                      <div style={{
                        width: `${Math.min(((session.score_investigative || 0) / (session.max_score_investigative || 1)) * 100, 100)}%`,
                        backgroundColor: '#2563eb',
                        height: '100%',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                  </div>

                  {/* Artistic */}
                   <div style={{ 
                     backgroundColor: '#fefce8',
                     border: '1px solid #fde68a',
                     borderRadius: '8px',
                     padding: '16px'
                   }}>
                     <div style={{ 
                       display: 'flex', 
                       justifyContent: 'space-between', 
                       alignItems: 'center',
                       marginBottom: '12px'
                     }}>
                       <div>
                         <h4 style={{ 
                           fontSize: '16px', 
                           fontWeight: 'bold', 
                           color: '#a16207',
                           margin: '0 0 4px 0'
                         }}>
                           Artistic
                         </h4>
                         <p style={{ 
                           fontSize: '12px', 
                           color: '#ca8a04',
                           margin: '0'
                         }}>
                           Kreatif & Ekspresif
                         </p>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                         <div style={{ 
                           fontSize: '18px', 
                           fontWeight: 'bold', 
                           color: '#a16207'
                         }}>
                           {session.score_artistic || 0}
                         </div>
                         <div style={{ 
                           fontSize: '12px', 
                           color: '#ca8a04'
                         }}>
                           dari {session.max_score_artistic || 0}
                         </div>
                       </div>
                     </div>
                     <div style={{ 
                       width: '100%', 
                       backgroundColor: '#fde68a', 
                       borderRadius: '4px', 
                       height: '8px'
                     }}>
                       <div style={{
                         width: `${Math.min(((session.score_artistic || 0) / (session.max_score_artistic || 1)) * 100, 100)}%`,
                         backgroundColor: '#eab308',
                         height: '100%',
                         borderRadius: '4px'
                       }}></div>
                     </div>
                   </div>

                   {/* Social */}
                   <div style={{ 
                     backgroundColor: '#fef2f2',
                     border: '1px solid #fecaca',
                     borderRadius: '8px',
                     padding: '16px'
                   }}>
                     <div style={{ 
                       display: 'flex', 
                       justifyContent: 'space-between', 
                       alignItems: 'center',
                       marginBottom: '12px'
                     }}>
                       <div>
                         <h4 style={{ 
                           fontSize: '16px', 
                           fontWeight: 'bold', 
                           color: '#dc2626',
                           margin: '0 0 4px 0'
                         }}>
                           Social
                         </h4>
                         <p style={{ 
                           fontSize: '12px', 
                           color: '#ef4444',
                           margin: '0'
                         }}>
                           Sosial & Membantu
                         </p>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                         <div style={{ 
                           fontSize: '18px', 
                           fontWeight: 'bold', 
                           color: '#dc2626'
                         }}>
                           {session.score_social || 0}
                         </div>
                         <div style={{ 
                           fontSize: '12px', 
                           color: '#ef4444'
                         }}>
                           dari {session.max_score_social || 0}
                         </div>
                       </div>
                     </div>
                     <div style={{ 
                       width: '100%', 
                       backgroundColor: '#fecaca', 
                       borderRadius: '4px', 
                       height: '8px'
                     }}>
                       <div style={{
                         width: `${Math.min(((session.score_social || 0) / (session.max_score_social || 1)) * 100, 100)}%`,
                         backgroundColor: '#ef4444',
                         height: '100%',
                         borderRadius: '4px'
                       }}></div>
                     </div>
                   </div>

                   {/* Enterprising */}
                   <div style={{ 
                     backgroundColor: '#f0f9ff',
                     border: '1px solid #bae6fd',
                     borderRadius: '8px',
                     padding: '16px'
                   }}>
                     <div style={{ 
                       display: 'flex', 
                       justifyContent: 'space-between', 
                       alignItems: 'center',
                       marginBottom: '12px'
                     }}>
                       <div>
                         <h4 style={{ 
                           fontSize: '16px', 
                           fontWeight: 'bold', 
                           color: '#0369a1',
                           margin: '0 0 4px 0'
                         }}>
                           Enterprising
                         </h4>
                         <p style={{ 
                           fontSize: '12px', 
                           color: '#0284c7',
                           margin: '0'
                         }}>
                           Kepemimpinan & Bisnis
                         </p>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                         <div style={{ 
                           fontSize: '18px', 
                           fontWeight: 'bold', 
                           color: '#0369a1'
                         }}>
                           {session.score_enterprising || 0}
                         </div>
                         <div style={{ 
                           fontSize: '12px', 
                           color: '#0284c7'
                         }}>
                           dari {session.max_score_enterprising || 0}
                         </div>
                       </div>
                     </div>
                     <div style={{ 
                       width: '100%', 
                       backgroundColor: '#bae6fd', 
                       borderRadius: '4px', 
                       height: '8px'
                     }}>
                       <div style={{
                         width: `${Math.min(((session.score_enterprising || 0) / (session.max_score_enterprising || 1)) * 100, 100)}%`,
                         backgroundColor: '#0284c7',
                         height: '100%',
                         borderRadius: '4px'
                       }}></div>
                     </div>
                   </div>

                   {/* Conventional */}
                   <div style={{ 
                     backgroundColor: '#f5f3ff',
                     border: '1px solid #c4b5fd',
                     borderRadius: '8px',
                     padding: '16px'
                   }}>
                     <div style={{ 
                       display: 'flex', 
                       justifyContent: 'space-between', 
                       alignItems: 'center',
                       marginBottom: '12px'
                     }}>
                       <div>
                         <h4 style={{ 
                           fontSize: '16px', 
                           fontWeight: 'bold', 
                           color: '#7c3aed',
                           margin: '0 0 4px 0'
                         }}>
                           Conventional
                         </h4>
                         <p style={{ 
                           fontSize: '12px', 
                           color: '#8b5cf6',
                           margin: '0'
                         }}>
                           Terorganisir & Detail
                         </p>
                       </div>
                       <div style={{ textAlign: 'right' }}>
                         <div style={{ 
                           fontSize: '18px', 
                           fontWeight: 'bold', 
                           color: '#7c3aed'
                         }}>
                           {session.score_conventional || 0}
                         </div>
                         <div style={{ 
                           fontSize: '12px', 
                           color: '#8b5cf6'
                         }}>
                           dari {session.max_score_conventional || 0}
                         </div>
                       </div>
                     </div>
                     <div style={{ 
                       width: '100%', 
                       backgroundColor: '#c4b5fd', 
                       borderRadius: '4px', 
                       height: '8px'
                     }}>
                       <div style={{
                         width: `${Math.min(((session.score_conventional || 0) / (session.max_score_conventional || 1)) * 100, 100)}%`,
                         backgroundColor: '#8b5cf6',
                         height: '100%',
                         borderRadius: '4px'
                       }}></div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
          </>
        )}
      </>
      )}

      {/* Footer */}
      <div style={{ 
        marginTop: '50px',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb',
        paddingTop: '20px'
      }}>
        <p style={{ margin: '10px 0', fontSize: '12px', color: '#6b7280' }}>
          Dokumen ini digenerate secara otomatis pada {new Date().toLocaleString('id-ID')}
        </p>
        <p style={{ margin: '10px 0', fontSize: '12px', color: '#6b7280' }}>
          © 2024 Sistem Tes Potensi Akademik - Semua hak dilindungi
        </p>
      </div>
    </div>
  );
};

export default PDFResultTemplate;