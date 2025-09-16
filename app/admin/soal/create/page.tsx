"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AdminHeader from "@/app/components/AdminHeader";
import FeedbackModal from "@/app/components/FeedbackModal";

export default function CreateQuestionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    kategori: "",
    subkategori: "",
    pertanyaan: "",
    gambar: null as File | null,
    pilihanJawaban: ["", "", "", ""],
    gambarJawaban: [null, null, null, null] as (File | null)[],
    jawabanBenar: [] as string[], // Changed to array for multiple answers
    tipeJawaban: "TEXT", // "TEXT" or "IMAGE"
    tipeSoal: "PILIHAN_GANDA",
    levelKesulitan: "SEDANG",
    deskripsi: "",
    allowMultipleAnswers: false, // New field for multiple answers
    poin: 1, // New field for question points
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdQuestions, setCreatedQuestions] = useState<any[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  // State untuk modal feedback
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    type: "info" as "success" | "error" | "warning" | "info",
    title: "",
    message: "",
  });

  // Fungsi untuk menampilkan modal feedback
  const showFeedback = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string
  ) => {
    setFeedbackModal({
      isOpen: true,
      type,
      title,
      message,
    });
  };

  const closeFeedback = () => {
    setFeedbackModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Mapping kategori ke subkategori
  const subkategoriMap = {
    TES_VERBAL: [
      "Tes Sinonim",
      "Tes Antonim",
      "Tes Padanan Hubungan 1",
      "Tes Padanan Hubungan 2",
      "Tes Pengelompokan Kata",
    ],
    TES_ANGKA: [
      "Tes Aritmetik",
      "Tes Seri Angka",
      "Tes Seri Huruf",
      "Tes Logika Angka",
      "Tes Angka Dalam Cerita",
    ],
    TES_LOGIKA: [
      "Tes Logika Umum",
      "Tes Logika Analisa Pernyataan",
      "Tes Logika Cerita",
      "Tes Logika Diagram",
    ],
    TES_GAMBAR: [
      "Tes Padanan Hubungan Gambar",
      "Tes Seri Gambar",
      "Tes Pengelompokan Gambar",
      "Tes Bayangan Cermin",
      "Tes Identifikasi Potongan Gambar",
    ],
    // RIASEC Categories
    TES_REALISTIC: [
      "Aktivitas Praktis",
      "Pekerjaan Manual",
      "Teknologi & Mesin",
      "Outdoor & Fisik",
    ],
    TES_INVESTIGATIVE: [
      "Penelitian & Analisis",
      "Problem Solving",
      "Sains & Matematika",
      "Observasi & Eksperimen",
    ],
    TES_ARTISTIC: [
      "Kreativitas & Seni",
      "Ekspresi Diri",
      "Desain & Estetika",
      "Inovasi & Originalitas",
    ],
    TES_SOCIAL: [
      "Membantu Orang Lain",
      "Komunikasi & Interaksi",
      "Mengajar & Membimbing",
      "Kerja Tim & Kolaborasi",
    ],
    TES_ENTERPRISING: [
      "Kepemimpinan & Manajemen",
      "Bisnis & Kewirausahaan",
      "Persuasi & Negosiasi",
      "Kompetisi & Pencapaian",
    ],
    TES_CONVENTIONAL: [
      "Organisasi & Administrasi",
      "Detail & Akurasi",
      "Prosedur & Sistem",
      "Data & Dokumentasi",
    ],
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Reset subkategori when kategori changes
    if (name === "kategori") {
      setFormData((prev) => ({
        ...prev,
        subkategori: "",
        jawabanBenar: [],
      }));
    }

    // Reset jawaban when tipeJawaban changes
    if (name === "tipeJawaban") {
      setFormData((prev) => ({
        ...prev,
        pilihanJawaban: ["", "", "", ""],
        gambarJawaban: [null, null, null, null],
        jawabanBenar: [],
      }));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.pilihanJawaban];
    newOptions[index] = value;
    setFormData((prev) => ({
      ...prev,
      pilihanJawaban: newOptions,
    }));
  };

  const handleImageAnswerChange = (index: number, file: File | null) => {
    const newImageAnswers = [...formData.gambarJawaban];
    newImageAnswers[index] = file;
    setFormData((prev) => ({
      ...prev,
      gambarJawaban: newImageAnswers,
    }));
  };

  const handleAnswerSelection = (answer: string, isSelected: boolean) => {
    // For text answers, don't allow selection if answer is empty
    if (formData.tipeJawaban === "TEXT") {
      const index = parseInt(answer);
      if (!formData.pilihanJawaban[index] || formData.pilihanJawaban[index].trim() === "") {
        return;
      }
    } else {
      // For image answers, check if the image exists
      const index = parseInt(answer);
      if (!formData.gambarJawaban[index]) {
        return; // Don't allow selection if no image uploaded
      }
    }

    if (formData.allowMultipleAnswers) {
      // Multiple answers mode - toggle selection
      setFormData((prev) => ({
        ...prev,
        jawabanBenar: isSelected
          ? prev.jawabanBenar.filter((ans) => ans !== answer)
          : [...prev.jawabanBenar, answer],
      }));
    } else {
      // Single answer mode - replace selection
      setFormData((prev) => ({
        ...prev,
        jawabanBenar: isSelected ? [] : [answer],
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({
      ...prev,
      gambar: file,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    if (!formData.kategori) {
      setError("Kategori soal harus dipilih");
      showFeedback("warning", "Validasi Gagal", "Kategori soal harus dipilih");
      setLoading(false);
      return;
    }

    if (!formData.subkategori) {
      setError("Subkategori soal harus dipilih");
      showFeedback(
        "warning",
        "Validasi Gagal",
        "Subkategori soal harus dipilih"
      );
      setLoading(false);
      return;
    }

    if (!formData.pertanyaan) {
      setError("Pertanyaan harus diisi");
      showFeedback("warning", "Validasi Gagal", "Pertanyaan harus diisi");
      setLoading(false);
      return;
    }

    if (formData.tipeSoal === "PILIHAN_GANDA") {
      const validOptions =
        formData.tipeJawaban === "TEXT"
          ? formData.pilihanJawaban.filter((option) => option.trim() !== "")
          : formData.gambarJawaban.filter((img) => img !== null);

      if (validOptions.length < 2) {
        setError("Minimal harus ada 2 pilihan jawaban");
        showFeedback(
          "warning",
          "Validasi Gagal",
          "Minimal harus ada 2 pilihan jawaban"
        );
        setLoading(false);
        return;
      }

      if (formData.jawabanBenar.length === 0) {
        setError("Jawaban benar harus dipilih");
        showFeedback(
          "warning",
          "Validasi Gagal",
          "Jawaban benar harus dipilih"
        );
        setLoading(false);
        return;
      }

      // Check if all selected answers are valid
      const validAnswerOptions =
        formData.tipeJawaban === "TEXT"
          ? formData.pilihanJawaban.map((_, index) => index.toString())
          : formData.gambarJawaban.map((_, index) => index.toString()).filter((_, index) => formData.gambarJawaban[index] !== null);

      const invalidAnswers = formData.jawabanBenar.filter(
        (answer) => !validAnswerOptions.includes(answer)
      );

      if (invalidAnswers.length > 0) {
        setError("Jawaban benar yang dipilih tidak valid");
        showFeedback(
          "warning",
          "Validasi Gagal",
          "Jawaban benar yang dipilih tidak valid"
        );
        setLoading(false);
        return;
      }
    } else if (formData.tipeSoal === "ISIAN") {
      if (formData.jawabanBenar.length === 0) {
        setError("Jawaban benar harus diisi");
        showFeedback("warning", "Validasi Gagal", "Jawaban benar harus diisi");
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Prepare form data for file upload
      const submitData = new FormData();
      submitData.append("kategori", formData.kategori);
      submitData.append("subkategori", formData.subkategori);
      submitData.append("pertanyaan", formData.pertanyaan);
      submitData.append("tipeSoal", formData.tipeSoal);
      submitData.append("tipeJawaban", formData.tipeJawaban);
      submitData.append("levelKesulitan", formData.levelKesulitan);
      submitData.append("deskripsi", formData.deskripsi);
      submitData.append(
        "allowMultipleAnswers",
        formData.allowMultipleAnswers.toString()
      );
      submitData.append("poin", formData.poin.toString());

      if (formData.tipeSoal === "PILIHAN_GANDA") {
        if (formData.tipeJawaban === "TEXT") {
          submitData.append(
            "pilihanJawaban",
            JSON.stringify(formData.pilihanJawaban)
          );
        } else {
          // Handle image answers
          for (let i = 0; i < formData.gambarJawaban.length; i++) {
            if (formData.gambarJawaban[i]) {
              submitData.append(
                `gambarJawaban_${i}`,
                formData.gambarJawaban[i]!
              );
            }
          }
        }
        submitData.append(
          "jawabanBenar",
          JSON.stringify(formData.jawabanBenar)
        );
      } else if (formData.tipeSoal === "ISIAN") {
        submitData.append(
          "jawabanBenar",
          JSON.stringify(formData.jawabanBenar)
        );
      }

      if (formData.gambar) {
        submitData.append("gambar", formData.gambar);
      }

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      if (response.ok) {
        const data = await response.json();

        // Log activity for creating question
        try {
          const { ClientActivityLogger } = await import(
            "@/lib/clientActivityLogger"
          );
          await ClientActivityLogger.logQuestionOperation(
            data.questionId || "new-question",
            "CREATE",
            formData.pertanyaan
          );
        } catch (logError) {
          console.error("Error logging activity:", logError);
        }

        // Update created questions list and total points
        const newQuestion = { ...data, points: parseInt(formData.poin.toString()) || 1 };
        setCreatedQuestions(prev => [...prev, newQuestion]);
        
        const newTotalPoints = totalPoints + (parseInt(formData.poin.toString()) || 1);
        setTotalPoints(newTotalPoints);
        
        showFeedback(
          "success",
          "Soal berhasil dibuat!",
          `Soal berhasil dibuat! Total poin sekarang: ${newTotalPoints}`
        );
        
        // Reset form for creating another question
        setFormData({
          kategori: "",
          subkategori: "",
          pertanyaan: "",
          gambar: null,
          pilihanJawaban: ["", "", "", ""],
          gambarJawaban: [null, null, null, null],
          jawabanBenar: [],
          tipeJawaban: "TEXT",
          tipeSoal: "PILIHAN_GANDA",
          levelKesulitan: "SEDANG",
          deskripsi: "",
          allowMultipleAnswers: false,
          poin: 1,
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Gagal membuat soal");
        showFeedback(
          "error",
          "Gagal membuat soal",
          errorData.error || "Gagal membuat soal"
        );
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
      showFeedback(
        "error",
        "Terjadi kesalahan server",
        "Terjadi kesalahan server"
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset jawabanBenar when allowMultipleAnswers changes
  useEffect(() => {
    if (!formData.allowMultipleAnswers && formData.jawabanBenar.length > 1) {
      setFormData((prev) => ({
        ...prev,
        jawabanBenar: prev.jawabanBenar.slice(0, 1), // Keep only first answer
      }));
    }
  }, [formData.allowMultipleAnswers, formData.jawabanBenar.length]);

  // Calculate total points when created questions change
  useEffect(() => {
    const total = createdQuestions.reduce((sum, question) => sum + (question.points || 0), 0);
    setTotalPoints(total);
  }, [createdQuestions]);

  // Load existing questions on component mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/questions", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCreatedQuestions(data.questions || []);
        }
      } catch (error) {
        console.error("Error loading questions:", error);
      }
    };

    loadQuestions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <AdminHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Buat Soal Baru
                </h1>
                <p className="text-gray-600">
                  Tambahkan soal ke bank soal TPA Universitas
                </p>
              </div>
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* 1. Kategori Soal */}
            <div>
              <label
                htmlFor="kategori"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                1. Kategori Soal *
              </label>
              <select
                id="kategori"
                name="kategori"
                value={formData.kategori}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pilih Kategori Soal</option>
                <optgroup label="TPA (Tes Potensi Akademik)">
                  <option value="TES_VERBAL">Tes Verbal</option>
                  <option value="TES_ANGKA">Tes Angka</option>
                  <option value="TES_LOGIKA">Tes Logika</option>
                  <option value="TES_GAMBAR">Tes Gambar</option>
                </optgroup>
                <optgroup label="RIASEC (Tes Minat Karir)">
                  <option value="TES_REALISTIC">Tes Realistic</option>
                  <option value="TES_INVESTIGATIVE">Tes Investigative</option>
                  <option value="TES_ARTISTIC">Tes Artistic</option>
                  <option value="TES_SOCIAL">Tes Social</option>
                  <option value="TES_ENTERPRISING">Tes Enterprising</option>
                  <option value="TES_CONVENTIONAL">Tes Conventional</option>
                </optgroup>
              </select>
            </div>

            {/* 2. Subkategori Soal */}
            <div>
              <label
                htmlFor="subkategori"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                2. Subkategori Soal *
              </label>
              <select
                id="subkategori"
                name="subkategori"
                value={formData.subkategori}
                onChange={handleInputChange}
                required
                disabled={!formData.kategori}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">
                  {formData.kategori
                    ? "Pilih Subkategori Soal"
                    : "Pilih kategori terlebih dahulu"}
                </option>
                {formData.kategori &&
                  subkategoriMap[
                    formData.kategori as keyof typeof subkategoriMap
                  ]?.map((sub) => (
                    <option
                      key={sub}
                      value={sub}
                    >
                      {sub}
                    </option>
                  ))}
              </select>
            </div>

            {/* 3. Pertanyaan */}
            <div>
              <label
                htmlFor="pertanyaan"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                3. Pertanyaan (Teks) *
              </label>
              <textarea
                id="pertanyaan"
                name="pertanyaan"
                value={formData.pertanyaan}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tulis pertanyaan soal di sini..."
              />
            </div>

            {/* 4. Gambar (Jika Ada) */}
            <div>
              <label
                htmlFor="gambar"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                4. Gambar (Jika Ada)
              </label>
              <input
                type="file"
                id="gambar"
                name="gambar"
                onChange={handleFileChange}
                accept="image/jpeg,image/png,image/gif"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Format: JPG, PNG, GIF. Hanya untuk soal kategori Tes Gambar.
              </p>
            </div>

            {/* 5. Tipe Soal */}
            <div>
              <label
                htmlFor="tipeSoal"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                5. Tipe Soal *
              </label>
              <select
                id="tipeSoal"
                name="tipeSoal"
                value={formData.tipeSoal}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PILIHAN_GANDA">Pilihan Ganda</option>
                <option value="ISIAN">Isian</option>
              </select>
            </div>

            {/* 6. Multiple Answers */}
            <div>
              <label
                htmlFor="allowMultipleAnswers"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                6. Tipe Jawaban *
              </label>
              <select
                id="allowMultipleAnswers"
                name="allowMultipleAnswers"
                value={formData.allowMultipleAnswers ? "true" : "false"}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    allowMultipleAnswers: e.target.value === "true",
                    jawabanBenar: [], // Reset jawaban when mode changes
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="false">Single Answer</option>
                <option value="true">Multiple Answers</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                {formData.allowMultipleAnswers
                  ? "Peserta dapat memilih lebih dari satu jawaban."
                  : "Peserta hanya dapat memilih satu jawaban."}
              </p>
            </div>

            {/* 7. Tipe Jawaban */}
            {formData.tipeSoal === "PILIHAN_GANDA" && (
              <div>
                <label
                  htmlFor="tipeJawaban"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  7. Format Jawaban *
                </label>
                <select
                  id="tipeJawaban"
                  name="tipeJawaban"
                  value={formData.tipeJawaban}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="TEXT">Teks</option>
                  <option value="IMAGE">Gambar</option>
                </select>
              </div>
            )}

            {/* 8. Pilihan Jawaban (Teks) */}
            {formData.tipeSoal === "PILIHAN_GANDA" &&
              formData.tipeJawaban === "TEXT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    8. Pilihan Jawaban (Teks) *
                  </label>
                  <div className="space-y-3">
                    {formData.pilihanJawaban.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="checkbox"
                          name={`jawabanBenar_${index}`}
                          value={index.toString()}
                          checked={formData.jawabanBenar.includes(index.toString())}
                          disabled={!option || option.trim() === ""} // Disable if empty
                          onChange={() =>
                            handleAnswerSelection(
                              index.toString(),
                              formData.jawabanBenar.includes(index.toString())
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(index, e.target.value)
                          }
                          placeholder={`Pilihan ${String.fromCharCode(
                            65 + index
                          )}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Pilih jawaban yang benar dengan checkbox
                  </p>
                </div>
              )}

            {/* 9. Pilihan Jawaban (Gambar) */}
            {formData.tipeSoal === "PILIHAN_GANDA" &&
              formData.tipeJawaban === "IMAGE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    9. Pilihan Jawaban (Gambar) *
                  </label>
                  <div className="space-y-3">
                    {formData.gambarJawaban.map((image, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="checkbox"
                          name={`jawabanBenar_${index}`}
                          value={index.toString()}
                          checked={formData.jawabanBenar.includes(index.toString())}
                          disabled={!image} // Disable if no image uploaded
                          onChange={() =>
                            handleAnswerSelection(
                              index.toString(),
                              formData.jawabanBenar.includes(index.toString())
                            )
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                        />
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={(e) =>
                            handleImageAnswerChange(
                              index,
                              e.target.files?.[0] || null
                            )
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {image && (
                          <span className="text-sm text-green-600">
                            ✓ Gambar dipilih
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Pilih jawaban yang benar dengan checkbox. Format: JPG, PNG,
                    GIF.
                  </p>
                </div>
              )}

            {/* 10. Jawaban yang Benar (untuk Isian) */}
            {formData.tipeSoal === "ISIAN" && (
              <div>
                <label
                  htmlFor="jawabanBenar"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  10. Jawaban yang Benar *
                </label>
                <input
                  type="text"
                  id="jawabanBenar"
                  name="jawabanBenar"
                  value={formData.jawabanBenar.join(", ")}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      jawabanBenar: e.target.value
                        .split(",")
                        .map((ans) => ans.trim()),
                    }))
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tulis jawaban yang benar (pisahkan dengan koma)"
                />
              </div>
            )}

            {/* 11. Level Kesulitan */}
            <div>
              <label
                htmlFor="levelKesulitan"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                11. Level Kesulitan *
              </label>
              <select
                id="levelKesulitan"
                name="levelKesulitan"
                value={formData.levelKesulitan}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MUDAH">Mudah</option>
                <option value="SEDANG">Sedang</option>
                <option value="SULIT">Sulit</option>
              </select>
            </div>

            {/* 12. Poin Soal */}
            <div>
              <label
                htmlFor="poin"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                12. Bobot Poin Soal *
              </label>
              <input
                type="number"
                id="poin"
                name="poin"
                value={formData.poin}
                onChange={handleInputChange}
                min="1"
                max="100"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Masukkan bobot poin untuk soal ini (1-100)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Poin yang akan diperoleh jika soal dijawab dengan benar (1-100 poin)
              </p>
            </div>

            {/* 13. Deskripsi (Opsional) */}
            <div>
              <label
                htmlFor="deskripsi"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                13. Deskripsi (Opsional)
              </label>
              <textarea
                id="deskripsi"
                name="deskripsi"
                value={formData.deskripsi}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Berikan deskripsi atau penjelasan tambahan terkait soal..."
              />
            </div>

            {/* 14. Submit */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Soal"
                )}
              </button>
            </div>
          </form>
            </div>
          </div>

          {/* Info Box */}
          <div className="lg:col-span-1">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                💡 Tips Membuat Soal
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Pilih kategori dan subkategori yang sesuai dengan materi soal</li>
                <li>• Upload gambar hanya untuk soal kategori Tes Gambar</li>
                <li>• Gunakan tipe jawaban teks atau gambar sesuai kebutuhan</li>
                <li>• Tentukan level kesulitan berdasarkan kompleksitas soal</li>
                <li>• Aktifkan multiple answers jika soal memiliki lebih dari satu jawaban benar</li>
                <li>• Berikan bobot poin sesuai tingkat kesulitan soal</li>
                <li>• Tambahkan deskripsi untuk memberikan instruksi tambahan</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={closeFeedback}
      />
    </div>
  );
}
