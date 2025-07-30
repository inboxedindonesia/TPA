"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TestSession {
  id: string;
  userId: string;
  testId: string;
  status: string;
  score: number;
  maxScore: number;
  startTime: string;
  endTime: string;
  user: {
    name: string;
    email: string;
  };
  test: {
    name: string;
  };
}

export default function HasilTesPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TestSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTestSessions();
  }, []);

  const fetchTestSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/test-sessions", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      } else {
        setError("Gagal memuat data hasil tes");
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "ONGOING":
        return "bg-yellow-100 text-yellow-800";
      case "ABANDONED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Selesai";
      case "ONGOING":
        return "Sedang Berlangsung";
      case "ABANDONED":
        return "Ditinggalkan";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculatePercentage = (score: number, maxScore: number) => {
    if (maxScore === 0) return 0;
    return Math.round((score / maxScore) * 100);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data hasil tes...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Hasil Tes</h1>
              <p className="mt-2 text-gray-600">
                Lihat hasil tes dari semua peserta
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

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">
              {sessions.length}
            </div>
            <div className="text-sm text-gray-600">Total Sesi Tes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {sessions.filter((s) => s.status === "COMPLETED").length}
            </div>
            <div className="text-sm text-gray-600">Tes Selesai</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {sessions.filter((s) => s.status === "ONGOING").length}
            </div>
            <div className="text-sm text-gray-600">Sedang Berlangsung</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-600">
              {sessions.length > 0
                ? Math.round(
                    sessions.reduce(
                      (acc, s) =>
                        acc + calculatePercentage(s.score, s.maxScore),
                      0
                    ) / sessions.length
                  )
                : 0}
              %
            </div>
            <div className="text-sm text-gray-600">Rata-rata Nilai</div>
          </div>
        </div>

        {/* Results List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Daftar Hasil Tes
            </h2>
          </div>

          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada hasil tes
              </h3>
              <p className="text-gray-600 mb-4">
                Peserta belum mengikuti tes atau belum menyelesaikan tes
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {session.user?.name || "Peserta"}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                            session.status
                          )}`}
                        >
                          {getStatusText(session.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Tes:</span>{" "}
                          {session.test?.name || "Tes"}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span>{" "}
                          {session.user?.email || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Mulai:</span>{" "}
                          {formatDate(session.startTime)}
                        </div>
                      </div>

                      {session.status === "COMPLETED" && (
                        <div className="mt-3 flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              Nilai:
                            </span>
                            <span
                              className={`text-lg font-bold ${getScoreColor(
                                calculatePercentage(
                                  session.score,
                                  session.maxScore
                                )
                              )}`}
                            >
                              {session.score}/{session.maxScore}
                            </span>
                            <span
                              className={`text-sm ${getScoreColor(
                                calculatePercentage(
                                  session.score,
                                  session.maxScore
                                )
                              )}`}
                            >
                              (
                              {calculatePercentage(
                                session.score,
                                session.maxScore
                              )}
                              %)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700">
                              Selesai:
                            </span>
                            <span className="text-sm text-gray-600">
                              {formatDate(session.endTime)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() =>
                          router.push(`/admin/hasil-tes/${session.id}`)
                        }
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Filter Options */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Filter & Pencarian
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Tes
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Status</option>
                <option value="COMPLETED">Selesai</option>
                <option value="ONGOING">Sedang Berlangsung</option>
                <option value="ABANDONED">Ditinggalkan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tes
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Tes</option>
                <option value="test-1">TPA Matematika Dasar</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cari Peserta
              </label>
              <input
                type="text"
                placeholder="Nama atau email peserta..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
