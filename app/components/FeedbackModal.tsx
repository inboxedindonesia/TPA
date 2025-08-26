"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

interface FeedbackModalProps {
  isOpen: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  showConfirmButton?: boolean;
  confirmText?: string;
  cancelText?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function FeedbackModal({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
  showConfirmButton = false,
  confirmText = "Ya",
  cancelText = "Tidak",
  autoClose = false,
  autoCloseDelay = 3000,
}: FeedbackModalProps) {
  useEffect(() => {
    if (isOpen && autoClose && type !== "warning") {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose, type]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case "error":
        return <XCircle className="w-8 h-8 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case "info":
        return <Info className="w-8 h-8 text-blue-500" />;
      default:
        return <Info className="w-8 h-8 text-blue-500" />;
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case "success":
        return "text-green-800";
      case "error":
        return "text-red-800";
      case "warning":
        return "text-yellow-800";
      case "info":
        return "text-blue-800";
      default:
        return "text-gray-800";
    }
  };

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50";
      case "error":
        return "bg-red-50";
      case "warning":
        return "bg-yellow-50";
      case "info":
        return "bg-blue-50";
      default:
        return "bg-gray-50";
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "border-green-200";
      case "error":
        return "border-red-200";
      case "warning":
        return "border-yellow-200";
      case "info":
        return "border-blue-200";
      default:
        return "border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className={`${getBgColor()} ${getBorderColor()} border-l-4 p-4`}>
            <div className="flex items-start">
              <div className="flex-shrink-0">{getIcon()}</div>
              <div className="ml-3 w-0 flex-1">
                <h3 className={`text-lg font-medium ${getTitleColor()}`}>
                  {title}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-700">{message}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {showConfirmButton ? (
              <>
                <button
                  type="button"
                  onClick={onConfirm}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {confirmText}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {cancelText}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
