"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Users,
  BarChart3,
  Clock,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  TrendingUp,
  Award,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<"ADMIN" | "PARTICIPANT">(
    "PARTICIPANT"
  );

  // Mock data
  const availableTests = [
    {
      id: "1",
      title: "Tes Potensi Akademik Dasar",
      description: "Tes untuk mengukur kemampuan dasar akademik",
      duration: 60,
      questionCount: 50,
      difficulty: "Mudah",
      category: "Umum",
    },
    {
      id: "2",
      title: "Tes Matematika Lanjutan",
      description: "Tes matematika tingkat lanjut",
      duration: 90,
      questionCount: 75,
      difficulty: "Sulit",
      category: "Matematika",
    },
  ];

  const completedTests = [
    {
      id: "1",
      title: "Tes Potensi Akademik Dasar",
      score: 85,
      maxScore: 100,
      completedAt: "2024-01-15",
      timeSpent: "45 menit",
      accuracy: "85%",
    },
  ];

  const allTests = [
    {
      id: "1",
      title: "Tes Potensi Akademik Dasar",
      description: "Tes untuk mengukur kemampuan dasar akademik",
      duration: 60,
      questionCount: 50,
      isActive: true,
      participants: 25,
      avgScore: 78.5,
    },
    {
      id: "2",
      title: "Tes Matematika Lanjutan",
      description: "Tes matematika tingkat lanjut",
      duration: 90,
      questionCount: 75,
      isActive: true,
      participants: 15,
      avgScore: 72.3,
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Mudah":
        return "bg-green-100 text-green-800";
      case "Sedang":
        return "bg-yellow-100 text-yellow-800";
      case "Sulit":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header dengan animasi */}
        <div className="mb-8 slide-up">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
            Dashboard {userRole === "ADMIN" ? "Admin" : "Peserta"}
          </h1>
          <p className="mt-2 text-gray-600">
            Selamat datang di platform Tes Potensi Akademik Online
          </p>
        </div>

        {/* Role Toggle dengan styling yang lebih menarik */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-1 shadow-lg inline-flex">
            <button
              onClick={() => setUserRole("PARTICIPANT")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                userRole === "PARTICIPANT"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-700 hover:text-primary-600"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Peserta
            </button>
            <button
              onClick={() => setUserRole("ADMIN")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                userRole === "ADMIN"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-700 hover:text-primary-600"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Admin
            </button>
          </div>
        </div>

        {userRole === "PARTICIPANT" ? (
          /* Participant Dashboard */
          <div className="space-y-8">
            {/* Available Tests dengan cards yang interaktif */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Tes yang Tersedia
                </h2>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-primary-600" />
                  <span className="text-sm text-gray-600">Update terbaru</span>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableTests.map((test, index) => (
                  <div
                    key={test.id}
                    className="card p-6 hover:shadow-xl transition-all duration-300 group"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                          {test.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {test.description}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                          test.difficulty
                        )}`}
                      >
                        {test.difficulty}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Durasi:</span>
                        <span className="font-medium">
                          {test.duration} menit
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Soal:</span>
                        <span className="font-medium">
                          {test.questionCount} soal
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Kategori:</span>
                        <span className="font-medium">{test.category}</span>
                      </div>
                    </div>

                    <button className="btn-primary w-full flex items-center justify-center group">
                      <Play className="w-4 h-4 mr-2" />
                      Mulai Tes
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Completed Tests */}
            <div className="card p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Tes yang Telah Selesai
              </h2>
              <div className="space-y-4">
                {completedTests.map((test) => (
                  <div
                    key={test.id}
                    className="card p-6 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {test.title}
                        </h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {test.completedAt}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {test.timeSpent}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-600">
                          {test.score}/{test.maxScore}
                        </div>
                        <div className="text-sm text-gray-500">
                          Akurasi: {test.accuracy}
                        </div>
                        <div className="mt-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-600 rounded-full transition-all duration-500"
                              style={{
                                width: `${(test.score / test.maxScore) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Admin Dashboard */
          <div className="space-y-8">
            {/* Stats dengan animasi */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6 bounce-in">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Tes
                    </p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </div>

              <div
                className="card p-6 bounce-in"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Peserta</p>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                  </div>
                </div>
              </div>

              <div
                className="card p-6 bounce-in"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Rata-rata Skor
                    </p>
                    <p className="text-2xl font-bold text-gray-900">78.5</p>
                  </div>
                </div>
              </div>

              <div
                className="card p-6 bounce-in"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Tes Aktif
                    </p>
                    <p className="text-2xl font-bold text-gray-900">8</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tests Management */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Manajemen Tes
                </h2>
                <button className="btn-primary flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Tes Baru
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama Tes
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durasi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Soal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Peserta
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rata-rata
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allTests.map((test) => (
                      <tr
                        key={test.id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {test.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {test.description}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.duration} menit
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.questionCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.participants}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {test.avgScore}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              test.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {test.isActive ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            )}
                            {test.isActive ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-primary-600 hover:text-primary-900 transition-colors duration-200">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-blue-600 hover:text-blue-900 transition-colors duration-200">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900 transition-colors duration-200">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
