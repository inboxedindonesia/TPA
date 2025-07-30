"use client";

import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlusCircle,
  Settings,
  Eye,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "ESSAY";
  options?: string[];
  correctAnswer?: string;
  points: number;
  testId: string;
  order: number;
}

export default function QuestionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Mock questions
  const questions: Question[] = [
    {
      id: "1",
      question: "Apa hasil dari 15 + 27?",
      type: "MULTIPLE_CHOICE",
      options: ["40", "42", "43", "41"],
      correctAnswer: "42",
      points: 1,
      testId: "test-1",
      order: 1,
    },
    {
      id: "2",
      question: "Manakah yang merupakan bilangan prima?",
      type: "MULTIPLE_CHOICE",
      options: ["4", "6", "7", "8"],
      correctAnswer: "7",
      points: 1,
      testId: "test-1",
      order: 2,
    },
    {
      id: "3",
      question: "Apakah Jakarta adalah ibu kota Indonesia?",
      type: "TRUE_FALSE",
      options: ["Benar", "Salah"],
      correctAnswer: "Benar",
      points: 1,
      testId: "test-1",
      order: 3,
    },
    {
      id: "4",
      question: "Jelaskan konsep fotosintesis dalam 100 kata.",
      type: "ESSAY",
      points: 5,
      testId: "test-1",
      order: 4,
    },
  ];

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch = question.question
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === "all" || question.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "bg-blue-100 text-blue-800";
      case "TRUE_FALSE":
        return "bg-green-100 text-green-800";
      case "ESSAY":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MULTIPLE_CHOICE":
        return "Pilihan Ganda";
      case "TRUE_FALSE":
        return "Benar/Salah";
      case "ESSAY":
        return "Essay";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header dengan animasi */}
        <div className="mb-8 slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                Manajemen Soal
              </h1>
              <p className="mt-2 text-gray-600">
                Kelola soal-soal tes dengan mudah dan efisien
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center group"
            >
              <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Tambah Soal
            </button>
          </div>
        </div>

        {/* Filters dengan styling yang lebih menarik */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Cari soal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field pl-10 appearance-none"
              >
                <option value="all">Semua Tipe</option>
                <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                <option value="TRUE_FALSE">Benar/Salah</option>
                <option value="ESSAY">Essay</option>
              </select>
            </div>
          </div>
        </div>

        {/* Questions Table dengan styling yang lebih interaktif */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Daftar Soal ({filteredQuestions.length})
              </h2>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <BookOpen className="w-4 h-4" />
                <span>Total: {questions.length} soal</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Soal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Poin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Urutan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuestions.map((question, index) => (
                  <tr
                    key={question.id}
                    className="hover:bg-gray-50 transition-colors duration-200 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="text-sm font-medium text-gray-900 line-clamp-2">
                          {question.question}
                        </p>
                        {question.options && (
                          <div className="mt-1 text-xs text-gray-500">
                            {question.options.length} opsi
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                          question.type
                        )}`}
                      >
                        {getTypeLabel(question.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600">
                            {question.points}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {question.order}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button className="text-primary-600 hover:text-primary-900 transition-colors duration-200 p-1 rounded hover:bg-primary-50">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingQuestion(question);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-1 rounded hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1 rounded hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tidak ada soal ditemukan
              </h3>
              <p className="text-gray-500">
                Coba ubah filter atau tambah soal baru
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal untuk tambah/edit soal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingQuestion ? "Edit Soal" : "Tambah Soal Baru"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingQuestion(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pertanyaan
                  </label>
                  <textarea
                    rows={4}
                    className="input-field"
                    placeholder="Masukkan pertanyaan..."
                    defaultValue={editingQuestion?.question || ""}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipe Soal
                    </label>
                    <select className="input-field">
                      <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                      <option value="TRUE_FALSE">Benar/Salah</option>
                      <option value="ESSAY">Essay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Poin
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      defaultValue={editingQuestion?.points || 1}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Urutan
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    defaultValue={editingQuestion?.order || 1}
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingQuestion(null);
                    }}
                    className="btn-secondary"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingQuestion ? "Update Soal" : "Simpan Soal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
