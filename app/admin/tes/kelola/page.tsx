"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Test {
  id: string;
  name: string;
  description: string;
  duration: number;
  totalQuestions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    name: string;
    email: string;
  };
}

export default function KelolaTesPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/tests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      } else {
        setError("Gagal memuat data tes");
      }
    } catch (error) {
      setError("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (testId: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/tests/${testId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        setTests(
          tests.map((test) =>
            test.id === testId ? { ...test, isActive: !currentStatus } : test
          )
        );
        alert(
          `Tes berhasil ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}!`
        );
      } else {
        alert("Gagal mengubah status tes");
      }
    } catch (error) {
      alert("Terjadi kesalahan server");
    }
  };

  const handleDeleteTest = async (testId: string, testName: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tes "${testName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/tests/${testId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTests(tests.filter((test) => test.id !== testId));
        alert("Tes berhasil dihapus!");
      } else {
        alert("Gagal menghapus tes");
      }
    } catch (error) {
      alert("Terjadi kesalahan server");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data tes...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Kelola Tes</h1>
              <p className="mt-2 text-gray-600">
                Kelola semua tes yang tersedia dalam sistem
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push("/admin/tes/create")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + Buat Tes Baru
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">
              {tests.length}
            </div>
            <div className="text-sm text-gray-600">Total Tes</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {tests.filter((t) => t.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Tes Aktif</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {tests.filter((t) => !t.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Tes Nonaktif</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-600">
              {tests.reduce((acc, test) => acc + test.totalQuestions, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Soal</div>
          </div>
        </div>

        {/* Tests List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Daftar Tes</h2>
          </div>

          {tests.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada tes
              </h3>
              <p className="text-gray-600 mb-4">
                Mulai dengan membuat tes pertama Anda
              </p>
              <button
                onClick={() => router.push("/admin/tes/create")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                + Buat Tes Pertama
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {test.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            test.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {test.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3">{test.description}</p>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Durasi:</span>{" "}
                          {test.duration} menit
                        </div>
                        <div>
                          <span className="font-medium">Soal:</span>{" "}
                          {test.totalQuestions} soal
                        </div>
                        <div>
                          <span className="font-medium">Dibuat:</span>{" "}
                          {formatDate(test.createdAt)}
                        </div>
                        <div>
                          <span className="font-medium">Pembuat:</span>{" "}
                          {test.creator?.name || "Admin"}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() =>
                          router.push(`/admin/tes/edit/${test.id}`)
                        }
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleToggleActive(test.id, test.isActive)
                        }
                        className={`px-3 py-1 text-xs rounded transition-colors ${
                          test.isActive
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {test.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/admin/tes/${test.id}/soal`)
                        }
                        className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        Soal
                      </button>
                      <button
                        onClick={() => handleDeleteTest(test.id, test.name)}
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
            💡 Tips Mengelola Tes
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Aktifkan tes hanya ketika siap untuk peserta</li>
            <li>• Nonaktifkan tes untuk maintenance atau perbaikan</li>
            <li>• Pastikan tes memiliki soal yang cukup sebelum diaktifkan</li>
            <li>• Hapus tes yang sudah tidak digunakan</li>
            <li>• Edit tes untuk menyesuaikan durasi atau deskripsi</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
