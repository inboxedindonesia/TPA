"use client";
import React from "react";
import { getTopMajors } from "@/lib/majorRecommendation";

interface CategoryBreakdownItem {
  score: number;
  maxScore: number;
  percentage: number;
}

interface Props {
  categoryBreakdown: Record<string, CategoryBreakdownItem>;
  aptitude_score_total?: number;
  aptitude_max_score_total?: number;
  aptitude_percentage?: number;
  user_jenjang?: string;
  user_jurusan?: string;
  // Optional RIASEC scores (untuk memperkaya inferensi MI lain jika diinginkan ke depan)
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
}

// Derivasi MI hanya untuk data yang benar-benar diukur.
// Mapping prinsip:
//  - Visual-Spatial  <- TES_GAMBAR
//  - Logical-Math    <- gabungan TES_LOGIKA (60%) + TES_ANGKA (40%) (asumsi penalaran logika sedikit lebih mewakili reasoning abstrak)
//  - Linguistic      <- TES_VERBAL
// MI lain belum diukur -> tidak ditampilkan (bisa ditambah nanti dengan sumber lain / kuesioner khusus).
const deriveMultipleIntelligences = (
  cb: Record<string, CategoryBreakdownItem>
) => {
  const verbal = cb.TES_VERBAL;
  const angka = cb.TES_ANGKA;
  const logika = cb.TES_LOGIKA;
  const gambar = cb.TES_GAMBAR;
  const pct = (v?: CategoryBreakdownItem) => (v ? v.percentage : 0);

  const weightedLogicalMath = (() => {
    const l = pct(logika);
    const a = pct(angka);
    if (l === 0 && a === 0) return 0;
    return Math.round(l * 0.6 + a * 0.4);
  })();

  const arr = [
    gambar &&
      gambar.maxScore > 0 && {
        key: "visual_spatial",
        name: "Visual-Spatial Intelligence",
        percentage: pct(gambar),
        score: gambar.score,
        max: gambar.maxScore,
        color: "bg-emerald-50 border-emerald-200",
        bar: "bg-emerald-600",
        desc: "Kemampuan memproses informasi visual & pola spasial",
      },
    (logika?.maxScore || 0) + (angka?.maxScore || 0) > 0 && {
      key: "logical_mathematical",
      name: "Logical-Mathematical Intelligence",
      percentage: weightedLogicalMath,
      score: (logika?.score || 0) + (angka?.score || 0),
      max: (logika?.maxScore || 0) + (angka?.maxScore || 0),
      color: "bg-blue-50 border-blue-200",
      bar: "bg-blue-600",
      desc: "Penalaran abstrak, pola, numerik & struktur logis",
    },
    verbal &&
      verbal.maxScore > 0 && {
        key: "linguistic",
        name: "Linguistic Intelligence",
        percentage: pct(verbal),
        score: verbal.score,
        max: verbal.maxScore,
        color: "bg-sky-50 border-sky-200",
        bar: "bg-sky-600",
        desc: "Pemahaman teks, kosakata, relasi antar kata",
      },
  ].filter(Boolean) as any[];

  return arr;
};

const levelFromPct = (p: number) => {
  if (p >= 85) return "Dominan";
  if (p >= 70) return "Tinggi";
  if (p >= 55) return "Sedang";
  if (p >= 40) return "Dasar";
  return "Rendah";
};

const AptitudeMultipleIntelligences: React.FC<Props> = (props) => {
  const {
    categoryBreakdown,
    aptitude_percentage,
    aptitude_score_total,
    aptitude_max_score_total,
  } = props;
  if (!categoryBreakdown) return null;
  const mi = deriveMultipleIntelligences(categoryBreakdown);
  if (mi.length === 0) return null;

  const THRESHOLD_MIN = 15; // minimal persen untuk layak interpretasi
  const sorted = [...mi].sort((a, b) => b.percentage - a.percentage);
  const allZero = mi.every((m) => m.percentage <= 0);
  const allBelowThreshold = mi.every((m) => m.percentage < THRESHOLD_MIN);
  const dominant = !allZero && !allBelowThreshold ? sorted[0] : undefined;
  const second = dominant
    ? sorted.find((m) => m.key !== dominant.key)
    : undefined;
  const delta =
    second && dominant ? dominant.percentage - second.percentage : null;

  const interpretation = (() => {
    if (!dominant) {
      if (allZero) return "Belum ada data untuk dianalisis (semua komponen 0).";
      if (allBelowThreshold)
        return `Skor masih di bawah ambang interpretasi (< ${THRESHOLD_MIN}%). Lanjutkan latihan untuk memunculkan pola dominan.`;
      return "Belum cukup data.";
    }
    let base = "";
    switch (dominant.key) {
      case "visual_spatial":
        base =
          "Dominasi pada pemrosesan visual-spasial: kuat dalam mengenali pola, bentuk, rotasi dan hubungan ruang.";
        break;
      case "logical_mathematical":
        base =
          "Dominasi penalaran logis & numerik: cepat dalam analisis pola, struktur dan pemecahan masalah sistematis.";
        break;
      case "linguistic":
        base =
          "Dominasi kecerdasan linguistik: kuat dalam pemahaman teks, pemilihan kata, dan relasi semantik.";
        break;
      default:
        base = "Profil umum tanpa dominasi jelas.";
    }
    if (delta !== null && delta <= 5 && second) {
      base += ` (Nyaris seimbang dengan ${second.name.toLowerCase()})`;
    }
    return base;
  })();

  const detail = (() => {
    if (!dominant) return "";
    if (second && delta !== null && delta <= 8) {
      return `Kombinasi kuat: ${dominant.name} & ${second.name}`;
    }
    return `Fokus utama pada ${dominant.name}`;
  })();

  const bidang = (() => {
    // Top-3 jurusan berdasarkan MI + jenjang
    const miScores = {
      visual_spatial: mi.find((x) => x.key === "visual_spatial")?.percentage || 0,
      logical_mathematical:
        mi.find((x) => x.key === "logical_mathematical")?.percentage || 0,
      linguistic: mi.find((x) => x.key === "linguistic")?.percentage || 0,
    };
    const top = getTopMajors(miScores, props.user_jenjang, props.user_jurusan);
    return top.map((t) => t.label);
  })();

  return (
    <div className="px-4 py-5 sm:p-6">
      {/* Padding diatur oleh parent card */}
      <h2 className="text-xl font-medium text-gray-900 mb-8">
        Hasil Tes Bakat/Aptitude
      </h2>
      <div className="flex flex-col items-center mb-6">
        <div className="text-3xl font-bold text-blue-700">
          {aptitude_percentage ?? 0}
        </div>
        <div className="text-sm text-gray-600 mt-1">Skor Total Aptitude</div>
        <div className="text-xs text-gray-500 mt-1">
          {aptitude_score_total ?? 0}/{aptitude_max_score_total ?? 0} poin
        </div>
        <div className="text-sm text-gray-700 mt-2 font-medium text-center">
          {dominant ? dominant.name : "-"}
          {dominant && second && delta !== null && delta <= 8 && (
            <span className="block text-[11px] text-gray-500 font-normal mt-1">
              Didukung {second.name}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Left: Interpretasi */}
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
          <h4 className="font-semibold text-amber-800 mb-2 text-sm">
            Interpretasi & Peta Kekuatan
          </h4>
          <div className="space-y-2 text-xs text-gray-800 leading-relaxed">
            {dominant ? (
              <>
                <p>
                  <span className="font-semibold">Interpretasi:</span> {interpretation}
                </p>
                <p>
                  <span className="font-semibold">Kekuatan Utama:</span> {dominant?.name || "-"}
                </p>
                <p>
                  <span className="font-semibold">Detail:</span> {detail}
                </p>
              </>
            ) : (
              <p className="italic text-gray-600">
                {interpretation || "Belum cukup data untuk analisis."}
              </p>
            )}
          </div>
        </div>

        {/* Right: Rekomendasi Bidang (Top-3 Jurusan) */}
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
          <h4 className="font-semibold text-emerald-800 mb-2 text-sm">
            Rekomendasi Bidang
          </h4>
          {(() => {
            if (!props.user_jenjang) {
              return (
                <p className="text-xs text-gray-600 italic">
                  Belum ada rekomendasi karena jenjang belum dipilih.
                </p>
              );
            }
            if (bidang.length === 0) {
              return (
                <p className="text-xs text-gray-600 italic">
                  Belum ada rekomendasi karena profil MI belum memadai.
                </p>
              );
            }
            return (
              <ul className="text-xs text-gray-800 space-y-1 list-disc list-inside">
                {bidang.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            );
          })()}
        </div>
      </div>

      <h4 className="font-semibold text-gray-800 mb-3 text-sm">
        Analisis Detail Multiple Intelligences
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {mi.map((m) => (
          <div
            key={m.key}
            className={`rounded-md p-3 border ${m.color}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-semibold text-gray-800 leading-snug">
                {m.name}
              </div>
              <div className="text-[10px] font-medium text-gray-500">
                {levelFromPct(m.percentage)}
              </div>
            </div>
            <div className="text-[11px] text-gray-700 mb-1">
              Skor: {m.score} / {m.max}
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded">
              <div
                className={`h-1.5 rounded ${m.bar}`}
                style={{ width: `${Math.min(m.percentage, 100)}%` }}
              ></div>
            </div>
            <div className="mt-1 text-[10px] text-gray-500 line-clamp-2">
              {m.desc}
            </div>
          </div>
        ))}
      </div>

      {/* <div className="mt-6 bg-gray-50 border border-gray-200 rounded p-3">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          Catatan: Hanya kecerdasan yang memiliki dasar pengukuran dari komponen
          TPA yang ditampilkan. Kecerdasan lain (Musical, Bodily-Kinesthetic,
          Interpersonal, Intrapersonal, Naturalistic) tidak dihitung karena
          belum ada instrumen khusus. Tambahkan modul atau kuesioner terpisah
          untuk mengaktifkannya.
        </p>
      </div> */}
    </div>
  );
};

export default AptitudeMultipleIntelligences;
