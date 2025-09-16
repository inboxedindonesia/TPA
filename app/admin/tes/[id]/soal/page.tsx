"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Question {
  id: string;
  question: string;
  type: string;
  category: string;
  difficulty: string;
  points: number;
  order: number;
  testId: string;
}

interface Test {
  id: string;
  name: string;
  description: string;
  duration: number;
  totalQuestions: number;
  isActive: boolean;
}

// Format category name to be more user-friendly
const formatCategoryName = (category: string) => {
  switch (category?.toUpperCase()) {
    case "TES_VERBAL":
      return "Tes Verbal";
    case "TES_GAMBAR":
      return "Tes Gambar";
    case "TES_LOGIKA":
      return "Tes Logika";
    case "TES_ANGKA":
      return "Tes Angka";
    default:
      return category?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || category;
  }
};

export default function TestQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTestAndQuestions();
  }, [testId]);

  const fetchTestAndQuestions = async () => {
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
      }

      // Fetch questions for this test
      const questionsResponse = await fetch(`/api/questions?testId=${testId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (questionsResponse.ok) {
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions || []);
      } else {
        setError("Gagal memuat data soal");
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus soal ini dari tes?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setQuestions(questions.filter((q) => q.id !== questionId));
        alert("Soal berhasil dihapus dari tes!");
      } else {
        alert("Gagal menghapus soal dari tes");
      }
    } catch (error) {
      alert("Terjadi kesalahan server");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "MUDAH":
        return "bg-green-100 text-green-800";
      case "SEDANG":
        return "bg-yellow-100 text-yellow-800";
      case "SULIT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "MATEMATIKA":
        return "bg-blue-100 text-blue-800";
      case "BAHASA_INDONESIA":
        return "bg-purple-100 text-purple-800";
      case "GENERAL_KNOWLEDGE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data tes dan soal...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-6xl mb-4">❌</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tes tidak ditemukan
          </h3>
          <p className="text-gray-600 mb-4">
            Tes yang Anda cari tidak ditemukan
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Soal Tes: {test.name}
              </h1>
              <p className="mt-2 text-gray-600">Kelola soal untuk tes ini</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  router.push(`/admin/soal/create?testId=${testId}`)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + Tambah Soal
              </button>
              <button
                onClick={() => router.back()}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Kembali
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Test Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Informasi Tes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="font-medium text-gray-700">Nama:</span>
              <span className="ml-2 text-gray-900">{test.name}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Durasi:</span>
              <span className="ml-2 text-gray-900">{test.duration} menit</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span
                className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  test.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {test.isActive ? "Aktif" : "Nonaktif"}
              </span>
            </div>
          </div>
          {test.description && (
            <div className="mt-4">
              <span className="font-medium text-gray-700">Deskripsi:</span>
              <p className="mt-1 text-gray-900">{test.description}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">
              {questions.length}
            </div>
            <div className="text-sm text-gray-600">Total Soal</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {questions.filter((q) => q.difficulty === "MUDAH").length}
            </div>
            <div className="text-sm text-gray-600">Soal Mudah</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {questions.filter((q) => q.difficulty === "SEDANG").length}
            </div>
            <div className="text-sm text-gray-600">Soal Sedang</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-red-600">
              {questions.filter((q) => q.difficulty === "SULIT").length}
            </div>
            <div className="text-sm text-gray-600">Soal Sulit</div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Daftar Soal</h2>
          </div>

          {questions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada soal
              </h3>
              <p className="text-gray-600 mb-4">
                Mulai dengan menambahkan soal pertama untuk tes ini
              </p>
              <button
                onClick={() =>
                  router.push(`/admin/soal/create?testId=${testId}`)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + Tambah Soal Pertama
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  className="px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          #{index + 1}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                            question.category
                          )}`}
                        >
                          {formatCategoryName(question.category)}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                            question.difficulty
                          )}`}
                        >
                          {question.difficulty}
                        </span>
                        <span className="text-xs text-gray-500">
                          {question.points} poin
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mb-1">
                        {question.question.length > 150
                          ? `${question.question.substring(0, 150)}...`
                          : question.question}
                      </h3>
                      <p className="text-xs text-gray-500">
                        ID: {question.id} • Tipe: {question.type}
                      </p>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() =>
                          router.push(`/admin/soal/edit/${question.id}`)
                        }
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemoveQuestion(question.id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            💡 Tips Mengelola Soal Tes
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Pastikan tes memiliki soal yang cukup sebelum diaktifkan</li>
            <li>• Seimbangkan tingkat kesulitan soal (mudah, sedang, sulit)</li>
            <li>• Variasikan kategori soal untuk tes yang komprehensif</li>
            <li>• Edit soal untuk memperbaiki pertanyaan atau jawaban</li>
            <li>• Hapus soal yang tidak sesuai atau bermasalah</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
