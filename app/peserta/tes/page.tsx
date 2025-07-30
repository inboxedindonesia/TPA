"use client";

import { useState, useEffect } from "react";
import { BookOpen, Clock, Users, Play, CheckCircle } from "lucide-react";
import Link from "next/link";

interface Test {
  id: string;
  name: string;
  description: string;
  duration: number;
  totalQuestions: number;
  isActive: boolean;
  createdAt: string;
  participantCount: number;
  averageScore: number;
}

export default function TesPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/peserta/tes");

      if (!response.ok) {
        throw new Error("Gagal mengambil data tes");
      }

      const data = await response.json();
      setTests(data.tests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      setError("Gagal memuat data tes");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
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
              onClick={fetchTests}
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
            Tes TPA Tersedia
          </h1>
          <p className="text-gray-600">
            Pilih tes yang ingin Anda ikuti. Pastikan Anda memiliki waktu yang
            cukup untuk menyelesaikan tes.
          </p>
        </div>

        {/* Tes List */}
        {tests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-white rounded-xl shadow-md p-6 hover-lift"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {test.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {test.description}
                      </p>
                    </div>
                  </div>
                  {test.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Nonaktif
                    </span>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Durasi</span>
                    <span className="text-sm font-medium text-gray-900">
                      {test.duration} menit
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Jumlah Soal</span>
                    <span className="text-sm font-medium text-gray-900">
                      {test.totalQuestions} soal
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Peserta</span>
                    <span className="text-sm font-medium text-gray-900">
                      {test.participantCount} orang
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Rata-rata Skor
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {test.averageScore}%
                    </span>
                  </div>
                </div>

                {test.isActive ? (
                  <Link
                    href={`/peserta/tes/${test.id}`}
                    className="w-full btn-primary flex items-center justify-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Mulai Tes
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-100 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
                  >
                    Tes Tidak Aktif
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <BookOpen className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Belum Ada Tes Tersedia
            </h3>
            <p className="text-gray-600">
              Saat ini belum ada tes yang aktif. Silakan cek kembali nanti.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
