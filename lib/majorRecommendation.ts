import { jurusanOptionsByJenjang, JurusanGroup } from "./jurusanOptions";

export type MIScores = {
  visual_spatial?: number;
  logical_mathematical?: number;
  linguistic?: number;
};

export type RiasecScores = {
  R?: number;
  I?: number;
  A?: number;
  S?: number;
  E?: number;
  C?: number;
};

// Heuristic weight mapping between majors and the measured MI dimensions.
const miWeightsByMajor: Record<string, Partial<MIScores>> = {
  // D3/S1 Core
  Akuntansi: {
    logical_mathematical: 0.6,
    linguistic: 0.3,
    visual_spatial: 0.1,
  },
  Manajemen: {
    logical_mathematical: 0.5,
    linguistic: 0.4,
    visual_spatial: 0.1,
  },

  "D3 Akuntansi": {
    logical_mathematical: 0.6,
    linguistic: 0.3,
    visual_spatial: 0.1,
  },
  "D3 Manajemen Perusahaan": {
    logical_mathematical: 0.5,
    linguistic: 0.4,
    visual_spatial: 0.1,
  },

  // Teknik
  Arsitektur: { visual_spatial: 0.7, logical_mathematical: 0.3 },
  "Teknik Sipil": {
    logical_mathematical: 0.6,
    visual_spatial: 0.3,
    linguistic: 0.1,
  },
  "Teknik Mesin": {
    logical_mathematical: 0.6,
    visual_spatial: 0.3,
    linguistic: 0.1,
  },
  "Teknik Elektro": {
    logical_mathematical: 0.7,
    visual_spatial: 0.2,
    linguistic: 0.1,
  },
  "Teknik Industri": {
    logical_mathematical: 0.6,
    visual_spatial: 0.2,
    linguistic: 0.2,
  },

  // FIKOM/IT
  "Teknik Informatika": {
    logical_mathematical: 0.7,
    visual_spatial: 0.2,
    linguistic: 0.1,
  },
  "Sistem Informasi": {
    logical_mathematical: 0.6,
    linguistic: 0.3,
    visual_spatial: 0.1,
  },

  // Komunikasi/Psikologi
  "Ilmu Komunikasi": { linguistic: 0.8, visual_spatial: 0.2 },
  Psikologi: {
    linguistic: 0.6,
    logical_mathematical: 0.2,
    visual_spatial: 0.2,
  },

  // Desain & Seni Kreatif
  "Desain Produk": { visual_spatial: 0.8, linguistic: 0.2 },
  "Desain Interior": { visual_spatial: 0.8, linguistic: 0.2 },
  "Desain Komunikasi Visual": { visual_spatial: 0.8, linguistic: 0.2 },

  // S2
  "Magister Manajemen": { logical_mathematical: 0.5, linguistic: 0.5 },
  "Magister Ilmu Komunikasi": { linguistic: 0.8, logical_mathematical: 0.2 },
  "Magister Teknik Industri": {
    logical_mathematical: 0.7,
    linguistic: 0.2,
    visual_spatial: 0.1,
  },
  "Magister Teknik Elektro": {
    logical_mathematical: 0.7,
    visual_spatial: 0.2,
    linguistic: 0.1,
  },
  "Magister Akuntansi": {
    logical_mathematical: 0.6,
    linguistic: 0.3,
    visual_spatial: 0.1,
  },
  "Magister Teknik Sipil": {
    logical_mathematical: 0.6,
    visual_spatial: 0.3,
    linguistic: 0.1,
  },
  "Magister Teknik Mesin": {
    logical_mathematical: 0.6,
    visual_spatial: 0.3,
    linguistic: 0.1,
  },

  // S3
  "Doktor Manajemen": { logical_mathematical: 0.5, linguistic: 0.5 },
};

function scoreMajor(label: string, mi: MIScores) {
  const w = miWeightsByMajor[label] || {};
  const vs = (mi.visual_spatial || 0) * (w.visual_spatial || 0);
  const lm = (mi.logical_mathematical || 0) * (w.logical_mathematical || 0);
  const lg = (mi.linguistic || 0) * (w.linguistic || 0);
  // Normalize to a 0-100-ish scale by assuming weights sum to <=1
  return vs + lm + lg; // already incorporates MI percentages (0..100)
}

export function getTopMajors(
  mi: MIScores,
  jenjang?: string | null,
  selectedJurusan?: string | null
) {
  const key = (jenjang || "").toUpperCase();
  const groups: JurusanGroup[] = jurusanOptionsByJenjang[key] || [];
  const pool = groups.flatMap((g) => g.options);
  if (pool.length === 0)
    return [] as Array<{ label: string; value: string; score: number }>;

  const selectedLower = (selectedJurusan || "").toLowerCase();

  const scored = pool.map((opt) => {
    let s = scoreMajor(opt.label, mi);
    // Tie-breaker: slightly prefer the user's chosen jurusan if present
    if (selectedLower && opt.label.toLowerCase() === selectedLower) s += 2;
    return { ...opt, score: Math.round(s) };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

// RIASEC weights per major (heuristic alignment)
const riasecWeightsByMajor: Record<string, Partial<RiasecScores>> = {
  Akuntansi: { C: 0.6, E: 0.2, I: 0.2 },
  Manajemen: { E: 0.6, C: 0.2, S: 0.2 },
  "D3 Akuntansi": { C: 0.6, E: 0.2, I: 0.2 },
  "D3 Manajemen Perusahaan": { E: 0.6, C: 0.2, S: 0.2 },

  Arsitektur: { A: 0.5, R: 0.3, I: 0.2 },
  "Teknik Sipil": { R: 0.5, I: 0.3, C: 0.2 },
  "Teknik Mesin": { R: 0.6, I: 0.3, C: 0.1 },
  "Teknik Elektro": { R: 0.5, I: 0.4, C: 0.1 },
  "Teknik Industri": { I: 0.4, E: 0.3, C: 0.3 },

  "Teknik Informatika": { I: 0.6, R: 0.2, C: 0.2 },
  "Sistem Informasi": { I: 0.4, C: 0.3, E: 0.3 },

  "Ilmu Komunikasi": { S: 0.4, E: 0.3, A: 0.3 },
  Psikologi: { S: 0.6, I: 0.2, C: 0.2 },

  "Desain Produk": { A: 0.6, R: 0.2, I: 0.2 },
  "Desain Interior": { A: 0.6, R: 0.2, I: 0.2 },
  "Desain Komunikasi Visual": { A: 0.6, S: 0.2, I: 0.2 },

  "Magister Manajemen": { E: 0.5, C: 0.3, S: 0.2 },
  "Magister Ilmu Komunikasi": { S: 0.5, A: 0.3, E: 0.2 },
  "Magister Teknik Industri": { I: 0.5, C: 0.3, E: 0.2 },
  "Magister Teknik Elektro": { I: 0.6, R: 0.2, C: 0.2 },
  "Magister Akuntansi": { C: 0.6, I: 0.2, E: 0.2 },
  "Magister Teknik Sipil": { R: 0.5, I: 0.3, C: 0.2 },
  "Magister Teknik Mesin": { R: 0.6, I: 0.3, C: 0.1 },

  "Doktor Manajemen": { E: 0.5, I: 0.25, S: 0.25 },
};

function scoreMajorByRiasec(label: string, r: RiasecScores) {
  const w = riasecWeightsByMajor[label] || {};
  const s =
    (r.R || 0) * (w.R || 0) +
    (r.I || 0) * (w.I || 0) +
    (r.A || 0) * (w.A || 0) +
    (r.S || 0) * (w.S || 0) +
    (r.E || 0) * (w.E || 0) +
    (r.C || 0) * (w.C || 0);
  return s; // already weighted by percentages
}

export function getTopMajorsByRiasec(
  r: RiasecScores,
  jenjang?: string | null,
  selectedJurusan?: string | null
) {
  const key = (jenjang || "").toUpperCase();
  const groups: JurusanGroup[] = jurusanOptionsByJenjang[key] || [];
  const pool = groups.flatMap((g) => g.options);
  if (pool.length === 0)
    return [] as Array<{ label: string; value: string; score: number }>;

  const selectedLower = (selectedJurusan || "").toLowerCase();
  const scored = pool.map((opt) => {
    let s = scoreMajorByRiasec(opt.label, r);
    if (selectedLower && opt.label.toLowerCase() === selectedLower) s += 2;
    return { ...opt, score: Math.round(s) };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}
