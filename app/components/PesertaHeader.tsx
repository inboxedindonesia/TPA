"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { GraduationCap, BarChart3, LogOut } from "lucide-react";

interface PesertaHeaderProps {
  handleLogout: () => void;
}

const PesertaHeader: React.FC<PesertaHeaderProps> = ({ handleLogout }) => {
  const [username, setUsername] = useState<string>("Peserta");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    const userInfo = localStorage.getItem("user");
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setUsername(user.name || "Peserta");
      } catch {
        setUsername("Peserta");
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/peserta/dashboard"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                TPA Universitas
              </h1>
            </div>
          </Link>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/peserta/dashboard"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/peserta/dashboard")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div
                className="relative"
                ref={userDropdownRef}
              >
                <button
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-600"
                  onMouseEnter={() => setIsUserDropdownOpen(true)}
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {username}
                    </p>
                  </div>
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      Menu User
                    </div>
                    <Link
                      href="/peserta/profil"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <span className="w-4 h-4 mr-2 inline-block">
                        {/* Bisa diganti icon user jika ingin */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z"
                          />
                        </svg>
                      </span>
                      Profile
                    </Link>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setShowLogoutModal(true);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Logout Confirm Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowLogoutModal(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Konfirmasi Keluar
              </h3>
              <p className="text-gray-600 mb-6">
                Apakah Anda yakin ingin keluar?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                  }}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default PesertaHeader;
