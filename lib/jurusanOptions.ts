export type JurusanGroup = {
  group: string;
  options: Array<{ value: string; label: string }>;
};

export const jurusanOptionsByJenjang: Record<string, JurusanGroup[]> = {
  D3: [
    {
      group: "Jenjang Diploma (D3)",
      options: [
        { value: "D3 Akuntansi", label: "D3 Akuntansi" },
        { value: "D3 Manajemen Perusahaan", label: "D3 Manajemen Perusahaan" },
      ],
    },
  ],
  S1: [
    {
      group: "Fakultas Ekonomi dan Bisnis (FEB)",
      options: [
        { value: "Akuntansi", label: "Akuntansi" },
        { value: "Manajemen", label: "Manajemen" },
      ],
    },
    {
      group: "Fakultas Teknik",
      options: [
        { value: "Arsitektur", label: "Arsitektur" },
        { value: "Teknik Sipil", label: "Teknik Sipil" },
        { value: "Teknik Mesin", label: "Teknik Mesin" },
        { value: "Teknik Elektro", label: "Teknik Elektro" },
        { value: "Teknik Industri", label: "Teknik Industri" },
      ],
    },
    {
      group: "Fakultas Ilmu Komputer",
      options: [
        { value: "Teknik Informatika", label: "Teknik Informatika" },
        { value: "Sistem Informasi", label: "Sistem Informasi" },
      ],
    },
    {
      group: "Fakultas Ilmu Komunikasi",
      options: [{ value: "Ilmu Komunikasi", label: "Ilmu Komunikasi" }],
    },
    {
      group: "Fakultas Psikologi",
      options: [{ value: "Psikologi", label: "Psikologi" }],
    },
    {
      group: "Fakultas Desain & Seni Kreatif",
      options: [
        { value: "Desain Produk", label: "Desain Produk" },
        { value: "Desain Interior", label: "Desain Interior" },
        {
          value: "Desain Komunikasi Visual",
          label: "Desain Komunikasi Visual",
        },
      ],
    },
  ],
  S2: [
    {
      group: "Jenjang Magister (S2)",
      options: [
        { value: "Magister Manajemen", label: "Magister Manajemen" },
        {
          value: "Magister Ilmu Komunikasi",
          label: "Magister Ilmu Komunikasi",
        },
        {
          value: "Magister Teknik Industri",
          label: "Magister Teknik Industri",
        },
        { value: "Magister Teknik Elektro", label: "Magister Teknik Elektro" },
        { value: "Magister Akuntansi", label: "Magister Akuntansi" },
        { value: "Magister Teknik Sipil", label: "Magister Teknik Sipil" },
        { value: "Magister Teknik Mesin", label: "Magister Teknik Mesin" },
      ],
    },
  ],
  S3: [
    {
      group: "Jenjang Doktor (S3)",
      options: [{ value: "Doktor Manajemen", label: "Doktor (S3) Manajemen" }],
    },
  ],
};

export const getJurusanGroupsByJenjang = (jenjang?: string | null) => {
  const key = (jenjang || "").toUpperCase();
  return jurusanOptionsByJenjang[key] || [];
};
