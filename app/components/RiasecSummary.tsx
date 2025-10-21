"use client";
import React from "react";
import { getTopMajorsByRiasec } from "@/lib/majorRecommendation";

interface Props {
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
  user_jenjang?: string;
  user_jurusan?: string;
}

const RiasecSummary: React.FC<Props> = (p) => {
  const dims = [
    {
      key: "R",
      label: "Realistic",
      score: p.score_realistic || 0,
      max: p.max_score_realistic || 0,
      color: "green",
      tagline: "Praktis & Teknis",
      desc: "Menyukai aktivitas fisik, alat, mesin, lingkungan nyata",
    },
    {
      key: "I",
      label: "Investigative",
      score: p.score_investigative || 0,
      max: p.max_score_investigative || 0,
      color: "blue",
      tagline: "Analitis & Ilmiah",
      desc: "Menyelidiki, menganalisis, riset, pemecahan masalah teoritis",
    },
    {
      key: "A",
      label: "Artistic",
      score: p.score_artistic || 0,
      max: p.max_score_artistic || 0,
      color: "pink",
      tagline: "Kreatif & Ekspresif",
      desc: "Kebebasan ekspresi, desain, estetika, imajinasi",
    },
    {
      key: "S",
      label: "Social",
      score: p.score_social || 0,
      max: p.max_score_social || 0,
      color: "orange",
      tagline: "Membantu & Mengajar",
      desc: "Interaksi manusia, edukasi, layanan, empati",
    },
    {
      key: "E",
      label: "Enterprising",
      score: p.score_enterprising || 0,
      max: p.max_score_enterprising || 0,
      color: "red",
      tagline: "Memimpin & Persuasi",
      desc: "Kepemimpinan, bisnis, negosiasi, mengambil keputusan",
    },
    {
      key: "C",
      label: "Conventional",
      score: p.score_conventional || 0,
      max: p.max_score_conventional || 0,
      color: "indigo",
      tagline: "Terstruktur & Detail",
      desc: "Administrasi, akurasi data, organisasi, ketelitian",
    },
  ];

  const withPct = dims.map((d) => ({
    ...d,
    pct: d.max > 0 ? Math.round((d.score / d.max) * 100) : 0,
  }));

  const anyData = withPct.some((d) => d.max > 0);
  const topSorted = [...withPct]
    .sort((a, b) => b.pct - a.pct)
    .filter((d) => d.pct > 0)
    .slice(0, 3);
  const rawHolland = p.holland_code || topSorted.map((d) => d.key).join("-");
  const holland = /^(?:[RIASEC]{3})$/.test(rawHolland)
    ? rawHolland.split("").join("-")
    : rawHolland;

  const colorMap: Record<string, string> = {
    green: "bg-green-50 border-green-200 text-green-800",
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    pink: "bg-pink-50 border-pink-200 text-pink-800",
    orange: "bg-orange-50 border-orange-200 text-orange-800",
    red: "bg-red-50 border-red-200 text-red-800",
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-800",
  };
  const barColor: Record<string, string> = {
    green: "bg-green-600",
    blue: "bg-blue-600",
    pink: "bg-pink-600",
    orange: "bg-orange-600",
    red: "bg-red-600",
    indigo: "bg-indigo-600",
  };

  return (
    <div className="px-4 py-5 sm:p-6">
      <h2 className="text-xl font-medium text-gray-900 mb-8">
        Hasil Tes RIASEC
      </h2>
      {!anyData && (
        <div className="mb-6 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded p-4">
          Data detail RIASEC belum tersedia (skor masih 0 atau modul belum
          aktif). Profil tetap ditampilkan untuk konsistensi format laporan.
        </div>
      )}

      <div className="flex flex-col items-center mb-8">
        <div className="text-3xl font-bold text-purple-700">
          {topSorted.length > 0 ? holland : "-"}
        </div>
        <div className="text-sm text-gray-600 mt-1">Kode Holland</div>
        <div className="text-xs text-gray-500 mt-1">
          {topSorted.length > 0
            ? topSorted.map((t) => t.label).join(" / ")
            : "Belum ada dimensi dominan"}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {withPct.map((d) => (
          <div
            key={d.key}
            className={`rounded-lg p-4 border ${colorMap[d.color]} bg-white/50`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="font-bold text-gray-800">{d.label}</h4>
                <p className="text-[11px] text-gray-500">{d.tagline}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-800">{d.score}</div>
                <div className="text-[10px] text-gray-500">dari {d.max}</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${barColor[d.color]}`}
                style={{ width: `${Math.min(d.pct, 100)}%` }}
              ></div>
            </div>
            <div className="text-[11px] text-gray-600 mt-1">{d.pct}%</div>
            <div className="text-[11px] text-gray-500 mt-2 line-clamp-2">
              {d.desc}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h4 className="font-semibold text-amber-800 mb-2 text-sm">
            Interpretasi
          </h4>
          <p className="text-xs text-gray-700 leading-relaxed">
            {topSorted.length > 0
              ? `Dimensi dominan: ${topSorted
                  .map((t) => t.label)
                  .join(
                    ", "
                  )}. Pola ini menunjukkan kecenderungan Anda pada aktivitas ${(() => {
                  const first = topSorted[0]?.key;
                  switch (first) {
                    case "R":
                      return "praktis dan teknis";
                    case "I":
                      return "analitis dan investigatif";
                    case "A":
                      return "kreatif dan ekspresif";
                    case "S":
                      return "sosial dan edukatif";
                    case "E":
                      return "kepemimpinan dan wirausaha";
                    case "C":
                      return "terstruktur dan administratif";
                    default:
                      return "umum";
                  }
                })()}.`
              : "Belum ada data cukup untuk menentukan kecenderungan dominan."}
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <h4 className="font-semibold text-emerald-800 mb-2 text-sm">
            Rekomendasi Bidang
          </h4>
          {(() => {
            const total = withPct.reduce((acc, d) => acc + d.max, 0);
            if (total === 0) {
              return (
                <p className="text-xs text-gray-600 italic">
                  Belum ada rekomendasi karena semua skor 0 / belum tersedia.
                </p>
              );
            }
            // Convert to percentages for RIASEC recommender
            const r = {
              R: withPct.find((d) => d.key === "R")?.pct || 0,
              I: withPct.find((d) => d.key === "I")?.pct || 0,
              A: withPct.find((d) => d.key === "A")?.pct || 0,
              S: withPct.find((d) => d.key === "S")?.pct || 0,
              E: withPct.find((d) => d.key === "E")?.pct || 0,
              C: withPct.find((d) => d.key === "C")?.pct || 0,
            };
            const top = getTopMajorsByRiasec(r, p.user_jenjang, p.user_jurusan);
            if (top.length === 0) {
              return (
                <p className="text-xs text-gray-600 italic">
                  Belum ada rekomendasi karena jenjang belum dipilih.
                </p>
              );
            }
            return (
              <ul className="text-xs text-gray-800 space-y-1 list-disc list-inside">
                {top.map((t) => (
                  <li key={t.value}>{t.label}</li>
                ))}
              </ul>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default RiasecSummary;
