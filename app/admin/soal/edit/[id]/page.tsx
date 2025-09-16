"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { use } from "react";
import AdminHeader from "@/app/components/AdminHeader";
import FeedbackModal from "@/app/components/FeedbackModal";

export default function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const [formData, setFormData] = useState({
    kategori: "",
    subkategori: "",
    pertanyaan: "",
    gambar: null as File | null,
    pilihanJawaban: ["", "", "", ""],
    gambarJawaban: [null, null, null, null] as (File | null)[],
    jawabanBenar: [] as string[],
    tipeJawaban: "TEXT",
    tipeSoal: "PILIHAN_GANDA",
    levelKesulitan: "SEDANG",
    deskripsi: "",
    allowMultipleAnswers: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State untuk menyimpan gambar yang sudah ada
  const [existingImages, setExistingImages] = useState({
    gambar: "",
    gambarJawaban: ["", "", "", ""] as string[],
  });

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

  // Load question data
  useEffect(() => {
    const loadQuestion = async () => {
      try {
        const response = await fetch(`/api/questions/${id}`);
        if (response.ok) {
          const question = await response.json();

          // Debug: log the question data
          console.log("Question data received:", question);
          console.log("gambarJawaban field:", question.gambarJawaban);
          console.log("options field:", question.options);

          // Parse pilihanJawaban properly
          let pilihanJawaban = ["", "", "", ""];
          let gambarJawaban = ["", "", "", ""];
          let existingGambarJawaban = ["", "", "", ""];

          // Parse options field
          if (question.options) {
            try {
              const parsedOptions = typeof question.options === "string" 
                ? JSON.parse(question.options) 
                : question.options;
              
              if (Array.isArray(parsedOptions)) {
                if (question.tipejawaban === "IMAGE") {
                  existingGambarJawaban = parsedOptions;
                } else {
                  pilihanJawaban = parsedOptions;
                }
              }
            } catch (e) {
              console.error("Error parsing options:", e);
            }
          }

          // Parse gambarjawaban field if it exists (prioritize this for IMAGE type)
          if (question.gambarjawaban) {
            try {
              const parsedGambarJawaban = typeof question.gambarjawaban === "string"
                ? JSON.parse(question.gambarjawaban)
                : question.gambarjawaban;
              
              if (Array.isArray(parsedGambarJawaban)) {
                existingGambarJawaban = parsedGambarJawaban;
                console.log("Parsed gambarjawaban:", existingGambarJawaban);
              }
            } catch (e) {
              console.error("Error parsing gambarjawaban:", e);
            }
          }

          // Debug: log final arrays
          console.log("Final pilihanJawaban array:", pilihanJawaban);
          console.log("Final existingGambarJawaban array:", existingGambarJawaban);

          setFormData({
            kategori: question.kategori || "",
            subkategori: question.subkategori || "",
            pertanyaan: question.question || "",
            gambar: null,
            pilihanJawaban: pilihanJawaban,
            gambarJawaban: [null, null, null, null],
            jawabanBenar: Array.isArray(question.correctAnswer)
              ? question.correctAnswer
              : [question.correctAnswer],
            tipeJawaban: question.tipejawaban || "TEXT",
            tipeSoal: question.tipesoal || "PILIHAN_GANDA",
            levelKesulitan: question.levelkesulitan || "SEDANG",
            deskripsi: question.deskripsi || "",
            allowMultipleAnswers: question.allowmultipleanswers || false,
          });

          // Simpan gambar yang sudah ada
          setExistingImages({
            gambar: question.gambar || "",
            gambarJawaban: existingGambarJawaban,
          });
        } else {
          setError("Gagal memuat data soal");
          showFeedback(
            "error",
            "Gagal memuat data soal",
            "Tidak dapat memuat data soal dari server"
          );
        }
      } catch (error) {
        console.error("Error loading question:", error);
        setError("Terjadi kesalahan saat memuat soal");
        showFeedback(
          "error",
          "Gagal memuat data soal",
          "Terjadi kesalahan saat memuat soal"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadQuestion();
  }, [id]);

  // Reset jawabanBenar when allowMultipleAnswers changes
  useEffect(() => {
    if (!formData.allowMultipleAnswers && formData.jawabanBenar.length > 1) {
      setFormData((prev) => ({
        ...prev,
        jawabanBenar: formData.jawabanBenar.slice(0, 1), // Keep only first answer
      }));
    }
  }, [formData.allowMultipleAnswers]);

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
    const currentOptions = Array.isArray(formData.pilihanJawaban)
      ? formData.pilihanJawaban
      : ["", "", "", ""];
    const newOptions = [...currentOptions];
    newOptions[index] = value;
    setFormData((prev) => ({
      ...prev,
      pilihanJawaban: newOptions,
    }));
  };

  const handleImageAnswerChange = (index: number, file: File | null) => {
    const currentGambarJawaban = Array.isArray(formData.gambarJawaban)
      ? formData.gambarJawaban
      : [null, null, null, null];
    const newImageAnswers = [...currentGambarJawaban];
    newImageAnswers[index] = file;
    setFormData((prev) => ({
      ...prev,
      gambarJawaban: newImageAnswers,
    }));
  };

  const handleAnswerSelection = (answer: string, isSelected: boolean) => {
    // Don't allow selection if answer is empty
    if (!answer || answer.trim() === "") {
      return;
    }

    // For image answers, check if the image exists (new or existing)
    if (answer.startsWith("gambar_")) {
      const index = parseInt(answer.replace("gambar_", ""));
      const currentGambarJawaban = Array.isArray(formData.gambarJawaban)
        ? formData.gambarJawaban
        : [null, null, null, null];
      const hasNewImage = currentGambarJawaban[index];
      const hasExistingImage = existingImages.gambarJawaban[index];

      if (!hasNewImage && !hasExistingImage) {
        return; // Don't allow selection if no image uploaded or existing
      }
    }

    const currentJawabanBenar = Array.isArray(formData.jawabanBenar)
      ? formData.jawabanBenar
      : [];

    if (formData.allowMultipleAnswers) {
      // Multiple answers mode - toggle selection
      setFormData((prev) => ({
        ...prev,
        jawabanBenar: isSelected
          ? currentJawabanBenar.filter((ans) => ans !== answer)
          : [...currentJawabanBenar, answer],
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
          ? formData.pilihanJawaban.filter((option) => option.trim() !== "")
          : formData.gambarJawaban.map((_, index) => `image_${index}`).filter((_, index) => formData.gambarJawaban[index] !== null);

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
      const token = localStorage.getItem("token") || "test-token";
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

      // Debug: log form data being sent
      console.log("Form data being sent:", {
        kategori: formData.kategori,
        subkategori: formData.subkategori,
        pertanyaan: formData.pertanyaan,
        tipeSoal: formData.tipeSoal,
        tipeJawaban: formData.tipeJawaban,
        levelKesulitan: formData.levelKesulitan,
        deskripsi: formData.deskripsi,
        jawabanBenar: formData.jawabanBenar,
        pilihanJawaban: formData.pilihanJawaban,
        existingImages: existingImages
      });

      if (formData.tipeSoal === "PILIHAN_GANDA") {
        if (formData.tipeJawaban === "TEXT") {
          submitData.append(
            "pilihanJawaban",
            JSON.stringify(formData.pilihanJawaban)
          );
        } else {
          // Handle image answers - combine existing and new images
          const finalGambarJawaban = [];
          for (let i = 0; i < 4; i++) {
            if (formData.gambarJawaban[i]) {
              // New image uploaded
              submitData.append(
                `gambarJawaban_${i}`,
                formData.gambarJawaban[i]!
              );
              finalGambarJawaban.push(
                `/uploads/gambar_jawaban_${Date.now()}_${i}_${
                  formData.gambarJawaban[i]!.name
                }`
              );
            } else if (existingImages.gambarJawaban[i]) {
              // Keep existing image
              finalGambarJawaban.push(existingImages.gambarJawaban[i]);
            } else {
              // No image
              finalGambarJawaban.push("");
            }
          }
          submitData.append(
            "existingGambarJawaban",
            JSON.stringify(finalGambarJawaban)
          );
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

      const response = await fetch(`/api/questions/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      if (response.ok) {
        // Log activity for updating question
        try {
          const { ClientActivityLogger } = await import(
            "@/lib/clientActivityLogger"
          );
          await ClientActivityLogger.logQuestionOperation(
            id,
            "UPDATE",
            formData.pertanyaan
          );
        } catch (logError) {
          console.error("Error logging activity:", logError);
        }

        showFeedback(
          "success",
          "Soal berhasil diperbarui!",
          "Soal berhasil diperbarui!"
        );
        router.push("/admin/dashboard");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Gagal memperbarui soal" }));
        console.error("API Error Response:", errorData);
        setError(errorData.error || "Gagal memperbarui soal");
        showFeedback(
          "error",
          "Gagal memperbarui soal",
          errorData.error || "Terjadi kesalahan saat memperbarui soal"
        );
      }
    } catch (error) {
      console.error("Submit Error:", error);
      setError("Terjadi kesalahan server");
      showFeedback(
        "error",
        "Gagal memperbarui soal",
        "Terjadi kesalahan saat memperbarui soal"
      );
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data soal...</p>
          </div>
        </div>
      </div>
    );
  }

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
                  Edit Soal TPA
                </h1>
                <p className="text-gray-600">
                  Perbarui soal yang sudah ada di bank soal TPA Universitas
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

              {/* Tampilkan kategori dan subkategori yang dipilih */}
              {(formData.kategori || formData.subkategori) && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Kategori saat ini:
                  </p>
                  <div className="flex space-x-2">
                    {formData.kategori && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {formData.kategori.replace(/_/g, " ")}
                      </span>
                    )}
                    {formData.subkategori && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {formData.subkategori}
                      </span>
                    )}
                  </div>
                </div>
              )}
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

              {/* Tampilkan pertanyaan yang sedang diedit */}
              {formData.pertanyaan && formData.pertanyaan.trim() !== "" && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Pertanyaan saat ini:
                  </p>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-gray-700">
                      {formData.pertanyaan}
                    </p>
                  </div>
                </div>
              )}
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
              {existingImages.gambar && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Gambar saat ini:</p>
                  <img
                    src={existingImages.gambar}
                    alt="Gambar soal"
                    className="max-w-full h-auto rounded border-2 border-gray-300"
                    style={{ maxHeight: "200px" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Format: JPG, PNG, GIF. Hanya untuk soal kategori Tes Gambar.
              </p>
            </div>

            {/* 5. Multiple Answers */}
            <div>
              <label
                htmlFor="allowMultipleAnswers"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                5. Tipe Jawaban *
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

              {/* Tampilkan setting multiple answers */}
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  Setting jawaban saat ini:
                </p>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    formData.allowMultipleAnswers
                      ? "bg-orange-100 text-orange-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {formData.allowMultipleAnswers
                    ? "Multiple Answers"
                    : "Single Answer"}
                </span>
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {formData.allowMultipleAnswers
                  ? "Peserta dapat memilih lebih dari satu jawaban."
                  : "Peserta hanya dapat memilih satu jawaban."}
              </p>
            </div>

            {/* 6. Tipe Jawaban */}
            {formData.tipeSoal === "PILIHAN_GANDA" && (
              <div>
                <label
                  htmlFor="tipeJawaban"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  6. Format Jawaban *
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

                {/* Tampilkan format jawaban yang dipilih */}
                {formData.tipeJawaban && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">
                      Format jawaban saat ini:
                    </p>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        formData.tipeJawaban === "TEXT"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {formData.tipeJawaban === "TEXT" ? "Teks" : "Gambar"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 7. Pilihan Jawaban (Teks) */}
            {formData.tipeSoal === "PILIHAN_GANDA" &&
              formData.tipeJawaban === "TEXT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    7. Pilihan Jawaban (Teks) *
                  </label>
                  <div className="space-y-3">
                    {(Array.isArray(formData.pilihanJawaban)
                      ? formData.pilihanJawaban
                      : ["", "", "", ""]
                    ).map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="checkbox"
                          name={`jawabanBenar_${index}`}
                          value={option}
                          checked={(() => {
                            const jawabanBenar = Array.isArray(formData.jawabanBenar) ? formData.jawabanBenar : [];
                            // Handle double-encoded JSON format
                            const parsedAnswers = jawabanBenar.flatMap(answer => {
                              try {
                                // Try to parse if it's a JSON string
                                return typeof answer === 'string' && answer.startsWith('[') ? JSON.parse(answer) : [answer];
                              } catch {
                                return [answer];
                              }
                            });
                            return parsedAnswers.includes(option);
                          })()}
                          disabled={!option || option.trim() === ""} // Disable if empty
                          onChange={() =>
                            handleAnswerSelection(
                              option,
                              (() => {
                                const jawabanBenar = Array.isArray(formData.jawabanBenar) ? formData.jawabanBenar : [];
                                const parsedAnswers = jawabanBenar.flatMap(answer => {
                                  try {
                                    return typeof answer === 'string' && answer.startsWith('[') ? JSON.parse(answer) : [answer];
                                  } catch {
                                    return [answer];
                                  }
                                });
                                return parsedAnswers.includes(option);
                              })()
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

                  {/* Tampilkan pilihan jawaban yang sudah ada */}
                  {formData.pilihanJawaban.some(
                    (option) => option && option.trim() !== ""
                  ) && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Pilihan jawaban saat ini:
                      </p>
                      <div className="space-y-2">
                        {formData.pilihanJawaban.map(
                          (option, index) =>
                            option &&
                            option.trim() !== "" && (
                              <div
                                key={index}
                                className="flex items-center space-x-2 p-2 bg-gray-50 rounded"
                              >
                                <span className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <span className="text-sm text-gray-700">
                                  {option}
                                </span>
                                {(() => {
                                  const jawabanBenar = Array.isArray(formData.jawabanBenar) ? formData.jawabanBenar : [];
                                  // Handle double-encoded JSON format
                                  const parsedAnswers = jawabanBenar.flatMap(answer => {
                                    try {
                                      // Try to parse if it's a JSON string
                                      return typeof answer === 'string' && answer.startsWith('[') ? JSON.parse(answer) : [answer];
                                    } catch {
                                      return [answer];
                                    }
                                  });
                                  return parsedAnswers.includes(option);
                                })() && (
                                  <span className="text-green-600 text-sm">
                                    ✓ Benar
                                  </span>
                                )}
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}

                  <p className="mt-2 text-sm text-gray-500">
                    Pilih jawaban yang benar dengan checkbox
                  </p>
                </div>
              )}

            {/* 7. Pilihan Jawaban (Gambar) */}
            {formData.tipeSoal === "PILIHAN_GANDA" &&
              formData.tipeJawaban === "IMAGE" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    7. Pilihan Jawaban (Gambar) *
                  </label>
                  <div className="space-y-3">
                    {(Array.isArray(formData.gambarJawaban)
                      ? formData.gambarJawaban
                      : [null, null, null, null]
                    ).map((image, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3"
                      >
                        <input
                          type="checkbox"
                          name={`jawabanBenar_${index}`}
                          value={`image_${index}`}
                          checked={(Array.isArray(formData.jawabanBenar)
                            ? formData.jawabanBenar
                            : []
                          ).includes(`image_${index}`)}
                          disabled={
                            !image && !existingImages.gambarJawaban[index]
                          } // Disable if no image uploaded or existing
                          onChange={() =>
                            handleAnswerSelection(
                              `image_${index}`,
                              (Array.isArray(formData.jawabanBenar)
                                ? formData.jawabanBenar
                                : []
                              ).includes(`image_${index}`)
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
                        {(image || existingImages.gambarJawaban[index]) && (
                          <span className="text-sm text-green-600">
                            ✓ Gambar dipilih
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Tampilkan gambar jawaban yang sudah ada */}
                  {existingImages.gambarJawaban.some((img) => img) && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Gambar jawaban saat ini:
                      </p>
                      <div className="space-y-3">
                        {existingImages.gambarJawaban.map(
                          (imagePath, index) =>
                            imagePath && (
                              <div
                                key={index}
                                className="flex items-center space-x-3"
                              >
                                <div className="w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                                  {String.fromCharCode(65 + index)}
                                </div>
                                <div className="relative flex-1">
                                  <img
                                    src={imagePath}
                                    alt={`Jawaban ${index + 1}`}
                                    className="max-w-full h-auto rounded border-2 border-gray-300"
                                    style={{ maxHeight: "200px" }}
                                    onError={(e) => {
                                      console.error(
                                        "Error loading image:",
                                        imagePath
                                      );
                                      e.currentTarget.style.display = "none";
                                      // Show fallback text
                                      const fallback =
                                        document.createElement("div");
                                      fallback.className =
                                        "p-2 bg-gray-100 text-gray-500 text-xs rounded";
                                      fallback.textContent = `Gambar ${
                                        index + 1
                                      }: ${imagePath}`;
                                      e.currentTarget.parentNode?.appendChild(
                                        fallback
                                      );
                                    }}
                                    onLoad={() => {
                                      console.log(
                                        "Image loaded successfully:",
                                        imagePath
                                      );
                                    }}
                                  />
                                </div>
                                {/* Debug info */}
                                <div className="text-xs text-gray-500 mt-1">
                                  Path: {imagePath}
                                </div>
                                {/* Checkmark untuk jawaban benar */}
                                {(Array.isArray(formData.jawabanBenar)
                                  ? formData.jawabanBenar
                                  : []
                                ).includes(index.toString()) && (
                                  <span className="text-sm text-green-600 font-medium ml-2">
                                    ✓ Benar
                                  </span>
                                )}
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}

                  <p className="mt-2 text-sm text-gray-500">
                    Pilih jawaban yang benar dengan checkbox. Format: JPG, PNG,
                    GIF.
                  </p>
                </div>
              )}

            {/* 8. Jawaban yang Benar (untuk Isian) */}
            {formData.tipeSoal === "ISIAN" && (
              <div>
                <label
                  htmlFor="jawabanBenar"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  8. Jawaban yang Benar *
                </label>
                <input
                  type="text"
                  id="jawabanBenar"
                  name="jawabanBenar"
                  value={(Array.isArray(formData.jawabanBenar)
                    ? formData.jawabanBenar
                    : []
                  ).join(", ")}
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

                {/* Tampilkan jawaban isian yang sudah ada */}
                {(Array.isArray(formData.jawabanBenar)
                  ? formData.jawabanBenar
                  : []
                ).length > 0 &&
                  (Array.isArray(formData.jawabanBenar)
                    ? formData.jawabanBenar
                    : []
                  ).some((ans) => ans.trim() !== "") && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">
                        Jawaban benar saat ini:
                      </p>
                      <div className="space-y-2">
                        {(Array.isArray(formData.jawabanBenar)
                          ? formData.jawabanBenar
                          : []
                        ).map(
                          (answer, index) =>
                            answer &&
                            answer.trim() !== "" && (
                              <div
                                key={index}
                                className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded"
                              >
                                <span className="w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <span className="text-sm text-gray-700">
                                  {answer}
                                </span>
                                <span className="text-green-600 text-sm">
                                  ✓ Benar
                                </span>
                              </div>
                            )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* 9. Tipe Soal */}
            <div>
              <label
                htmlFor="tipeSoal"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                9. Tipe Soal *
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

              {/* Tampilkan tipe soal yang dipilih */}
              {formData.tipeSoal && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Tipe soal saat ini:
                  </p>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                    {formData.tipeSoal === "PILIHAN_GANDA"
                      ? "Pilihan Ganda"
                      : "Isian"}
                  </span>
                </div>
              )}
            </div>

            {/* 10. Level Kesulitan */}
            <div>
              <label
                htmlFor="levelKesulitan"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                10. Level Kesulitan *
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

              {/* Tampilkan level kesulitan yang dipilih */}
              {formData.levelKesulitan && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Level kesulitan saat ini:
                  </p>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      formData.levelKesulitan === "MUDAH"
                        ? "bg-green-100 text-green-800"
                        : formData.levelKesulitan === "SEDANG"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {formData.levelKesulitan}
                  </span>
                </div>
              )}
            </div>

            {/* 11. Deskripsi (Opsional) */}
            <div>
              <label
                htmlFor="deskripsi"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                11. Deskripsi (Opsional)
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

            {/* Submit */}
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
                  "Simpan Perubahan"
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
                💡 Tips Edit Soal
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Pastikan kategori dan subkategori sesuai dengan materi soal</li>
                <li>• Upload gambar baru jika diperlukan untuk soal kategori Tes Gambar</li>
                <li>• Periksa kembali jawaban benar setelah mengubah pilihan</li>
                <li>• Sesuaikan level kesulitan berdasarkan kompleksitas soal</li>
                <li>• Gunakan multiple answers jika soal memiliki lebih dari satu jawaban benar</li>
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
