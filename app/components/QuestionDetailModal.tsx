"use client";

import { X } from "lucide-react";

interface Question {
  id: string;
  question: string;
  category: string;
  difficulty: string;
  options: string[];
  correctAnswer: string[];
  tipeSoal?: string;
  tipeJawaban?: string;
  gambar?: string;
  gambarJawaban?: string[];
  subkategori?: string;
  levelKesulitan?: string;
  deskripsi?: string;
  allowMultipleAnswers?: boolean;
  createdAt: string;
  // Handle database field names
  tipesoal?: string;
  tipejawaban?: string;
  levelkesulitan?: string;
  allowmultipleanswers?: boolean;
  gambarjawaban?: string[];
}

interface QuestionDetailModalProps {
  isOpen: boolean;
  question: Question | null;
  onClose: () => void;
}

export default function QuestionDetailModal({
  isOpen,
  question,
  onClose,
}: QuestionDetailModalProps) {
  if (!isOpen || !question) return null;

  const getCategoryColor = (category: string) => {
    switch (category?.toUpperCase()) {
      case "TES_VERBAL":
        return "bg-blue-100 text-blue-800";
      case "TES_GAMBAR":
        return "bg-purple-100 text-purple-800";
      case "TES_LOGIKA":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCategoryName = (category: string) => {
    switch (category?.toUpperCase()) {
      case "TES_VERBAL":
        return "Tes Verbal";
      case "TES_GAMBAR":
        return "Tes Gambar";
      case "TES_LOGIKA":
        return "Tes Logika";
      default:
        return category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || category;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toUpperCase()) {
      case "MUDAH":
        return "bg-green-100 text-green-800";
      case "SEDANG":
        return "bg-yellow-100 text-yellow-800";
      case "SULIT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Detail Soal</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Question Info */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getCategoryColor(
                  question.category
                )}`}
              >
                {formatCategoryName(question.category)}
              </span>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getDifficultyColor(
                  question.difficulty
                )}`}
              >
                {question.difficulty}
              </span>
              <span className="text-sm text-gray-500">
                {question.tipeSoal || question.tipesoal} •{" "}
                {question.allowMultipleAnswers || question.allowmultipleanswers
                  ? "Multi Jawaban"
                  : "Single Jawaban"}
              </span>
            </div>

            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pertanyaan:
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                {question.question.startsWith("/uploads/") ? (
                  <img
                    src={question.question}
                    alt="Soal"
                    className="max-w-full h-auto rounded"
                  />
                ) : (
                  <p className="text-gray-900">{question.question}</p>
                )}
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Pilihan Jawaban:
            </h3>
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isCorrect = question.correctAnswer.includes(option);
                const optionImage =
                  question.gambarJawaban?.[index] ||
                  question.gambarjawaban?.[index];

                return (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      isCorrect
                        ? "border-green-300 bg-green-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start">
                      <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-700 mr-3 mt-1">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <div className="flex-1">
                        {optionImage ? (
                          <div className="space-y-2">
                            <img
                              src={optionImage}
                              alt={`Jawaban ${String.fromCharCode(65 + index)}`}
                              className="w-full max-w-xs h-auto rounded-lg border"
                            />
                            <p className="text-sm text-gray-900">{option}</p>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">
                            {option}
                          </span>
                        )}
                      </div>
                      {isCorrect && (
                        <span className="ml-3 text-green-600 font-medium">
                          ✓ Benar
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Informasi Tambahan
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipe Soal
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {question.tipeSoal || question.tipesoal}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tipe Jawaban
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {question.tipeJawaban || question.tipejawaban}
                  </p>
                </div>
                {question.subkategori && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subkategori
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {question.subkategori}
                    </p>
                  </div>
                )}
                {question.deskripsi && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Deskripsi
                    </label>
                    <p className="mt-1 text-sm text-gray-900">
                      {question.deskripsi}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Metadata
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    ID Soal
                  </label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {question.id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Dibuat
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(question.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Multiple Answers
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {question.allowMultipleAnswers ||
                    question.allowmultipleanswers
                      ? "Ya"
                      : "Tidak"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          {(question.gambar ||
            (question.gambarJawaban && question.gambarJawaban.length > 0) ||
            (question.gambarjawaban && question.gambarjawaban.length > 0)) && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Gambar</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.gambar && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gambar Soal
                    </label>
                    <img
                      src={question.gambar}
                      alt="Gambar Soal"
                      className="w-full h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}

                {(question.gambarJawaban &&
                  question.gambarJawaban.length > 0) ||
                (question.gambarjawaban &&
                  question.gambarjawaban.length > 0) ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gambar Jawaban
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        question.gambarJawaban ||
                        question.gambarjawaban ||
                        []
                      ).map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Jawaban ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
