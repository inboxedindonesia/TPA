"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  Target,
  Timer,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  options?: string[];
  correctAnswer?: string;
}

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Mock questions
  const questions: Question[] = [
    {
      id: "1",
      question: "Apa hasil dari 15 + 27?",
      type: "MULTIPLE_CHOICE",
      options: ["40", "42", "43", "41"],
      correctAnswer: "42",
    },
    {
      id: "2",
      question: "Manakah yang merupakan bilangan prima?",
      type: "MULTIPLE_CHOICE",
      options: ["4", "6", "7", "8"],
      correctAnswer: "7",
    },
    {
      id: "3",
      question: "Apakah Jakarta adalah ibu kota Indonesia?",
      type: "TRUE_FALSE",
      options: ["Benar", "Salah"],
      correctAnswer: "Benar",
    },
    {
      id: "4",
      question: "Berapakah akar kuadrat dari 64?",
      type: "MULTIPLE_CHOICE",
      options: ["6", "7", "8", "9"],
      correctAnswer: "8",
    },
    {
      id: "5",
      question: "Apakah 2 + 2 = 5?",
      type: "TRUE_FALSE",
      options: ["Benar", "Salah"],
      correctAnswer: "Salah",
    },
  ];

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && !isTestComplete && !isPaused) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isTestComplete, isPaused]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmitTest = () => {
    setIsTestComplete(true);
    setShowResults(true);
    // TODO: Submit answers to backend
    console.log("Test submitted:", answers);
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question) => {
      if (answers[question.id] === question.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100),
    };
  };

  const getTimeColor = () => {
    if (timeLeft <= 300) return "text-red-600"; // 5 minutes left
    if (timeLeft <= 600) return "text-yellow-600"; // 10 minutes left
    return "text-gray-600";
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card p-8 text-center">
            <div className="bounce-in">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Tes Selesai!
              </h1>
              <div className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-4">
                {score.percentage}%
              </div>
              <p className="text-lg text-gray-600 mb-8">
                Anda menjawab {score.correct} dari {score.total} soal dengan
                benar
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-md mx-auto mb-8">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Skor Anda</span>
                  <span>
                    {score.correct}/{score.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${score.percentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="btn-primary inline-flex items-center"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Lihat Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header dengan gradient dan shadow */}
      <div className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center text-gray-600 hover:text-primary-600 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Kembali
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Tes Potensi Akademik
              </h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-gray-500" />
                <div className={`font-mono font-bold ${getTimeColor()}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Soal {currentQuestion + 1} dari {questions.length}
                </span>
              </div>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  isPaused
                    ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-10 h-10 rounded-full text-sm font-medium transition-all duration-200 ${
                  index === currentQuestion
                    ? "bg-primary-600 text-white shadow-lg scale-110"
                    : answers[questions[index].id]
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                Soal {currentQuestion + 1}
              </h2>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                  {currentQ.type === "MULTIPLE_CHOICE"
                    ? "Pilihan Ganda"
                    : "Benar/Salah"}
                </div>
              </div>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed">
              {currentQ.question}
            </p>
          </div>

          <div className="space-y-4">
            {currentQ.options?.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:border-primary-300 hover:bg-primary-50 ${
                  answers[currentQ.id] === option
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-primary-300"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQ.id}`}
                  value={option}
                  checked={answers[currentQ.id] === option}
                  onChange={(e) =>
                    handleAnswerChange(currentQ.id, e.target.value)
                  }
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-3 text-gray-700 font-medium">{option}</span>
              </label>
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevQuestion}
              disabled={currentQuestion === 0}
              className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Sebelumnya
            </button>

            <div className="flex space-x-4">
              {currentQuestion === questions.length - 1 ? (
                <button
                  onClick={handleSubmitTest}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 hover:scale-105 shadow-lg flex items-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Selesai & Submit
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="btn-primary flex items-center"
                >
                  Selanjutnya
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Warning when time is running out */}
      {timeLeft <= 300 && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Waktu hampir habis!</span>
        </div>
      )}
    </div>
  );
}
