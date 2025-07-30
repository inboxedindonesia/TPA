"use client";

import { useState, useEffect } from "react";
import { BookOpen, Clock, CheckCircle, Award, TrendingUp } from "lucide-react";
import Link from "next/link";

interface TestResult {
  id: string;
  testName: string;
  score: number;
  maxScore: number;
  duration: number;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
}

export default function HasilTesPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/peserta/hasil-tes");

      if (!response.ok) {
        throw new Error("Gagal mengambil data hasil tes");
      }

      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Error fetching results:", error);
      setError("Gagal memuat data hasil tes");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return "bg-green-100 text-green-800";
    if (percentage >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-md p-6"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <button
              onClick={fetchResults}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hasil Tes TPA
          </h1>
          <p className="text-gray-600">
            Lihat hasil tes yang telah Anda selesaikan dan evaluasi performa
            Anda.
          </p>
        </div>

        {/* Results List */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-xl shadow-md p-6 hover-lift"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {result.testName}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Selesai pada{" "}
                        {new Date(result.completedAt).toLocaleDateString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreBadge(
                      result.percentage
                    )}`}
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Selesai
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Skor</span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        result.percentage
                      )}`}
                    >
                      {result.score}/{result.maxScore}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Persentase</span>
                    <span
                      className={`text-lg font-bold ${getScoreColor(
                        result.percentage
                      )}`}
                    >
                      {result.percentage}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Jawaban Benar</span>
                    <span className="text-sm font-medium text-gray-900">
                      {result.correctAnswers}/{result.totalQuestions}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Durasi</span>
                    <span className="text-sm font-medium text-gray-900">
                      {result.duration} menit
                    </span>
                  </div>
                </div>

                <Link
                  href={`/peserta/hasil-tes/${result.id}`}
                  className="w-full btn-secondary flex items-center justify-center"
                >
                  <Award className="w-4 h-4 mr-2" />
                  Lihat Detail
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Award className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum Ada Hasil Tes
            </h3>
            <p className="text-gray-600 mb-6">
              Anda belum menyelesaikan tes apapun. Mulai tes untuk melihat hasil
              di sini.
            </p>
            <Link
              href="/peserta/tes"
              className="btn-primary flex items-center mx-auto w-fit"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Lihat Tes Tersedia
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
