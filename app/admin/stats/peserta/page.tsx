"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  TrendingUp,
  Calendar,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

interface PesertaStats {
  totalPeserta: number;
  pesertaAktif: number;
  pesertaBaru: number;
  rataRataSkor: number;
  daftarPeserta: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    totalTests: number;
    averageScore: number;
  }>;
}

export default function PesertaStatsPage() {
  const [stats, setStats] = useState<PesertaStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPesertaStats();
  }, []);

  const fetchPesertaStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/stats/peserta");

      if (!response.ok) {
        throw new Error("Gagal mengambil data statistik peserta");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching peserta stats:", error);
      setError("Gagal memuat data statistik peserta");
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
              onClick={fetchPesertaStats}
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
                Statistik Peserta
              </h1>
              <p className="text-gray-600">
                Detail lengkap data peserta dan performa tes
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Peserta
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.totalPeserta.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Peserta Aktif
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.pesertaAktif.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Peserta Baru
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.pesertaBaru.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Rata-rata Skor
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.rataRataSkor}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Daftar Peserta */}
        <div className="bg-white rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Daftar Peserta
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal Daftar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Tes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rata-rata Skor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.daftarPeserta.map((peserta) => (
                  <tr
                    key={peserta.id}
                    className="table-row-hover"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {peserta.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {peserta.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(peserta.createdAt).toLocaleDateString(
                          "id-ID"
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {peserta.totalTests}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {peserta.averageScore}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
