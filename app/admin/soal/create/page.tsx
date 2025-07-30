"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateQuestionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    question: "",
    type: "MULTIPLE_CHOICE",
    category: "MATEMATIKA",
    difficulty: "SEDANG",
    points: 1,
    correctAnswer: "",
    options: ["", "", "", ""],
    explanation: "",
    testId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate options for multiple choice
    if (formData.type === "MULTIPLE_CHOICE") {
      const validOptions = formData.options.filter(
        (option) => option.trim() !== ""
      );
      if (validOptions.length < 2) {
        setError("Minimal harus ada 2 pilihan jawaban");
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

      const questionData = {
        ...formData,
        options: JSON.stringify(
          formData.options.filter((option) => option.trim() !== "")
        ),
      };

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(questionData),
      });

      if (response.ok) {
        const result = await response.json();
        alert("Soal berhasil dibuat!");
        router.push("/admin/soal/bank-soal");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Gagal membuat soal");
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Buat Soal Baru
              </h1>
              <p className="mt-2 text-gray-600">
                Tambahkan soal baru ke bank soal TPA Universitas
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Kembali
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Pertanyaan */}
            <div>
              <label
                htmlFor="question"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Pertanyaan *
              </label>
              <textarea
                id="question"
                name="question"
                value={formData.question}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tulis pertanyaan soal di sini..."
              />
            </div>

            {/* Tipe Soal */}
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tipe Soal *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                <option value="TRUE_FALSE">Benar/Salah</option>
                <option value="ESSAY">Essay</option>
              </select>
            </div>

            {/* Kategori */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Kategori *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MATEMATIKA">Matematika</option>
                <option value="BAHASA_INDONESIA">Bahasa Indonesia</option>
                <option value="GENERAL_KNOWLEDGE">Pengetahuan Umum</option>
              </select>
            </div>

            {/* Tingkat Kesulitan */}
            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tingkat Kesulitan *
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="MUDAH">Mudah</option>
                <option value="SEDANG">Sedang</option>
                <option value="SULIT">Sulit</option>
              </select>
            </div>

            {/* Poin */}
            <div>
              <label
                htmlFor="points"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Poin *
              </label>
              <input
                type="number"
                id="points"
                name="points"
                value={formData.points}
                onChange={handleInputChange}
                min="1"
                max="10"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Pilihan Jawaban (untuk Multiple Choice) */}
            {formData.type === "MULTIPLE_CHOICE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilihan Jawaban *
                </label>
                <div className="space-y-3">
                  {formData.options.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3"
                    >
                      <input
                        type="radio"
                        name="correctAnswer"
                        value={option}
                        checked={formData.correctAnswer === option}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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
                  Pilih jawaban yang benar dengan radio button
                </p>
              </div>
            )}

            {/* Jawaban Benar (untuk True/False) */}
            {formData.type === "TRUE_FALSE" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jawaban Benar *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value="true"
                      checked={formData.correctAnswer === "true"}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Benar</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="correctAnswer"
                      value="false"
                      checked={formData.correctAnswer === "false"}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Salah</span>
                  </label>
                </div>
              </div>
            )}

            {/* Jawaban Benar (untuk Essay) */}
            {formData.type === "ESSAY" && (
              <div>
                <label
                  htmlFor="correctAnswer"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Jawaban Benar *
                </label>
                <textarea
                  id="correctAnswer"
                  name="correctAnswer"
                  value={formData.correctAnswer}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tulis jawaban yang benar..."
                />
              </div>
            )}

            {/* Penjelasan */}
            <div>
              <label
                htmlFor="explanation"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Penjelasan (Opsional)
              </label>
              <textarea
                id="explanation"
                name="explanation"
                value={formData.explanation}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Berikan penjelasan mengapa jawaban ini benar..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Menyimpan..." : "Buat Soal"}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            💡 Tips Membuat Soal
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Buat pertanyaan yang jelas dan tidak ambigu</li>
            <li>• Pilih kategori yang sesuai dengan konten soal</li>
            <li>• Sesuaikan tingkat kesulitan dengan target peserta</li>
            <li>• Berikan penjelasan untuk membantu pembelajaran</li>
            <li>• Untuk pilihan ganda, pastikan ada jawaban yang benar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
