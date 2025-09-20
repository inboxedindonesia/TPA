"use client";

import { useState, useEffect } from "react";
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
  const [userRole, setUserRole] = useState<"Administrator" | "role-moderator" | "role-peserta" | null>(null);
  const [availableTests, setAvailableTests] = useState<any[]>([]);
  const [completedTestIds, setCompletedTestIds] = useState<string[]>([]);
  const [completedTests, setCompletedTests] = useState<any[]>([]);

  useEffect(() => {
    async function fetchAvailableTests() {
      try {
        const res = await fetch("/api/peserta/tes");
        if (!res.ok) return;
        const data = await res.json();
        setAvailableTests(data.tests || []);
      } catch {
        setAvailableTests([]);
      }
    }
    fetchAvailableTests();
  }, []);

  useEffect(() => {
    async function fetchCompletedTests() {
      try {
        const profileRes = await fetch("/api/auth/profile");
        if (!profileRes.ok) return;
        const profileData = await profileRes.json();
        const userId = profileData.user?.userId;
        if (!userId) return;
        const sessionRes = await fetch(
          `/api/test-sessions?userId=${userId}&status=COMPLETED`
        );
        if (!sessionRes.ok) return;
        const sessions = await sessionRes.json();
        setCompletedTestIds(sessions.map((s: any) => s.testId));
        setCompletedTests(sessions);
      } catch {
        setCompletedTestIds([]);
        setCompletedTests([]);
      }
    }
    fetchCompletedTests();
  }, []);

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
            Dashboard {userRole === "Administrator" ? "Admin" : "Peserta"}
          </h1>
          <p className="mt-2 text-gray-600">
            Selamat datang di platform Tes Potensi Akademik Online
          </p>
        </div>

        {/* DEBUG INFO: tampilkan di atas dashboard agar pasti terlihat */}
        <div className="mb-4 text-xs text-red-500 bg-white p-2 rounded shadow">
          <div>completedTestIds: {JSON.stringify(completedTestIds)}</div>
          <div>availableTests: {JSON.stringify(availableTests)}</div>
          <div>completedTests: {JSON.stringify(completedTests)}</div>
          {availableTests.length === 0 && (
            <div>
              ERROR: availableTests kosong (API /api/peserta/tes tidak
              mengembalikan data?)
            </div>
          )}
          {completedTestIds.length === 0 && (
            <div>
              WARNING: completedTestIds kosong (API /api/test-sessions tidak
              mengembalikan data?)
            </div>
          )}
        </div>
        {/* Role Toggle dengan styling yang lebih menarik */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-1 shadow-lg inline-flex">
            <button
              onClick={() => setUserRole("role-peserta")}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                userRole === "role-peserta"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-700 hover:text-primary-600"
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Peserta
            </button>
            <button
              onClick={() => setUserRole("Administrator")}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                userRole === "Administrator"
                  ? "bg-primary-600 text-white shadow-lg"
                  : "text-gray-700 hover:text-primary-600"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Admin
            </button>
          </div>
        </div>

        {userRole === "role-peserta" ? (
          <div>
            {/* DEBUG INFO: tampilkan di atas dashboard agar pasti terlihat */}
            <div className="mb-4 text-xs text-red-500 bg-white p-2 rounded shadow">
              <div>completedTestIds: {JSON.stringify(completedTestIds)}</div>
              <div>availableTests: {JSON.stringify(availableTests)}</div>
              <div>completedTests: {JSON.stringify(completedTests)}</div>
              {availableTests.length === 0 && (
                <div>
                  ERROR: availableTests kosong (API /api/peserta/tes tidak
                  mengembalikan data?)
                </div>
              )}
              {completedTestIds.length === 0 && (
                <div>
                  WARNING: completedTestIds kosong (API /api/test-sessions tidak
                  mengembalikan data?)
                </div>
              )}
            </div>
            <div className="space-y-8">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Tes yang Tersedia
                  </h2>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                    <span className="text-sm text-gray-600">
                      Update terbaru
                    </span>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {availableTests.map((test, index) => {
                    const testIdStr = String(test.id);
                    const isCompleted = completedTestIds
                      .map(String)
                      .includes(testIdStr);
                    return (
                      <div
                        key={test.id}
                        className="card p-6 hover:shadow-xl transition-all duration-300 group"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors duration-200">
                              {test.title}{" "}
                              <span className="text-xs text-gray-400">
                                (id: {testIdStr})
                              </span>
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
                              {test.questionCount || test.totalQuestions} soal
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Kategori:</span>
                            <span className="font-medium">
                              {test.category || "-"}
                            </span>
                          </div>
                        </div>
                        {isCompleted ? (
                          <button
                            className="w-full flex items-center justify-center bg-gray-300 text-gray-500 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
                            disabled
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Tes sudah selesai diambil
                          </button>
                        ) : (
                          <button className="btn-primary w-full flex items-center justify-center group">
                            <Play className="w-4 h-4 mr-2" />
                            Ambil Tes
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Admin section dihapus mock, gunakan data dari API jika perlu tampilkan admin dashboard */}
          </div>
        )}
      </div>
    </div>
  );
}
