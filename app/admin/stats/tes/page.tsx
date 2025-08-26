"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  Play,
  Pause,
  CheckCircle,
  BarChart3,
} from "lucide-react";
import Link from "next/link";

interface TesStats {
  totalTes: number;
  tesAktif: number;
  tesSelesai: number;
  rataRataDurasi: number;
  daftarTes: Array<{
    id: string;
    name: string;
    duration: number;
    isActive: boolean;
    createdAt: string;
    participantCount: number;
    averageScore: number;
    questionCount: number;
  }>;
}

export default function TesStatsPage() {
  const [stats, setStats] = useState<TesStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTesStats();
  }, []);

  const fetchTesStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/stats/tes");

      if (!response.ok) {
        throw new Error("Gagal mengambil data statistik tes");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching tes stats:", error);
      setError("Gagal memuat data statistik tes");
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-6"
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
              onClick={fetchTesStats}
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/dashboard"
              className="p-2 bg-white rounded-lg transition-shadow"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Statistik Tes
              </h1>
              <p className="text-gray-600">
                Detail lengkap data tes dan performa peserta
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalTes.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tes Aktif</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.tesAktif.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tes Selesai</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.tesSelesai.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Rata-rata Durasi
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.rataRataDurasi} menit
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Tes */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Daftar Tes
          </h2>
          {stats?.daftarTes && stats.daftarTes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Tes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Durasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Soal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peserta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rata-rata Skor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Dibuat
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.daftarTes.map((tes) => (
                    <tr
                      key={tes.id}
                      className="table-row-hover"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tes.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tes.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tes.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tes.duration} menit
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tes.questionCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tes.participantCount}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {tes.averageScore}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(tes.createdAt).toLocaleDateString("id-ID")}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Clock className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Tes
              </h3>
              <p className="text-gray-600">
                Saat ini belum ada tes yang dibuat dalam sistem.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
