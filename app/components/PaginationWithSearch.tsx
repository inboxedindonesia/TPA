"use client";

import { useState, useEffect } from "react";

interface PaginationWithSearchProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  className?: string;
}

export default function PaginationWithSearch({
  currentPage,
  totalPages,
  onPageChange,
  onPrevPage,
  onNextPage,
  className = "",
}: PaginationWithSearchProps) {
  const [pageInput, setPageInput] = useState("");

  // Reset input when currentPage changes externally
  useEffect(() => {
    setPageInput("");
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Only allow numbers
    if (value === "" || /^\d+$/.test(value)) {
      setPageInput(value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const page = parseInt(pageInput);
      if (page && page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange(page);
        setPageInput(""); // Clear input after navigation
      }
    }
  };

  return (
    <div
      className={`flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}
    >
      <button
        onClick={onPrevPage}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-md border text-sm font-medium mr-2 ${
          currentPage === 1
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        Previous
      </button>

      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-600">
          Halaman {currentPage} dari {totalPages}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">|</span>
            <input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyPress={handleKeyPress}
              placeholder={`Search 1-${totalPages}`}
              className="w-32 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>

      <button
        onClick={onNextPage}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-md border text-sm font-medium ml-2 ${
          currentPage === totalPages
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-100"
        }`}
      >
        Next
      </button>
    </div>
  );
}
