"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  GraduationCap,
  BarChart3,
  Play,
  Eye,
  Calendar,
  Target,
} from "lucide-react";

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

interface DashboardData {
  totalTests: number;
  completedTests: number;
  averageScore: number;
  targetScore: number;
  availableTests: Test[];
  testResults: TestResult[];
}

export default function PesertaDashboard() {
  const [activeTab, setActiveTab] = useState("tes");
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalTests: 0,
    completedTests: 0,
    averageScore: 0,
    targetScore: 85,
    availableTests: [],
    testResults: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/peserta/dashboard");

      if (!response.ok) {
        throw new Error("Gagal mengambil data dashboard");
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Gagal memuat data dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "tersedia":
        return "bg-blue-100 text-blue-800";
      case "sedang_berlangsung":
        return "bg-yellow-100 text-yellow-800";
      case "lulus":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "tersedia":
        return <Play className="w-4 h-4" />;
      case "sedang_berlangsung":
        return <Clock className="w-4 h-4" />;
      case "lulus":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "tersedia":
        return "Tersedia";
      case "sedang_berlangsung":
        return "Sedang Berlangsung";
      case "lulus":
        return "Lulus";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg p-6"
                >
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
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
              onClick={fetchDashboardData}
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                TPA Universitas - Peserta
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Selamat datang, Ahmad Fauzi
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover-lift">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.totalTests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover-lift">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tes Selesai</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.completedTests}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover-lift">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Rata-rata Skor
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.averageScore.toFixed(1)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover-lift">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Target</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.targetScore}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("tes")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "tes"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Tes Tersedia
              </button>
              <button
                onClick={() => setActiveTab("hasil")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "hasil"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Hasil Tes
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "tes" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Tes yang Tersedia
                </h2>
                {dashboardData.availableTests.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dashboardData.availableTests.map((test) => (
                      <div
                        key={test.id}
                        className="bg-gray-50 rounded-lg p-6 hover-lift"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {test.name}
                            </h3>
                            <p className="text-gray-600 text-sm mb-4">
                              {test.description}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Play className="w-3 h-3 mr-1" />
                            Tersedia
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <BookOpen className="w-4 h-4 mr-2" />
                            {test.totalQuestions} soal
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            {test.duration} menit
                          </div>
                        </div>

                        <Link
                          href={`/peserta/tes/${test.id}`}
                          className="w-full btn-primary flex items-center justify-center"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Mulai Tes
                        </Link>
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
                      Saat ini belum ada tes yang aktif. Silakan cek kembali
                      nanti.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "hasil" && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Hasil Tes Saya
                </h2>
                {dashboardData.testResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dashboardData.testResults.map((result) => (
                      <div
                        key={result.id}
                        className="bg-gray-50 rounded-lg p-6 hover-lift"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {result.testName}
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Selesai pada{" "}
                              {new Date(result.completedAt).toLocaleDateString(
                                "id-ID"
                              )}
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Selesai
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Skor</p>
                            <p className="text-lg font-bold text-gray-900">
                              {result.score}/{result.maxScore}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Persentase</p>
                            <p className="text-lg font-bold text-gray-900">
                              {result.percentage}%
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/peserta/hasil-tes/${result.id}`}
                          className="w-full btn-secondary flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Lihat Detail
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <CheckCircle className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Belum Ada Hasil Tes
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Anda belum menyelesaikan tes apapun. Mulai tes untuk
                      melihat hasil di sini.
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
