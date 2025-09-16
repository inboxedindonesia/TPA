"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  GraduationCap,
  Users,
  LogOut,
  BarChart3,
  User,
  Shield,
  History,
  Key,
  KeyRound,
} from "lucide-react";

interface AdminHeaderProps {
  currentTime?: string;
}

export default function AdminHeader({ currentTime }: AdminHeaderProps) {
  const pathname = usePathname();
  const [username, setUsername] = useState("Admin");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOnPrem, setIsOnPrem] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get user info from localStorage
    if (typeof window !== "undefined") {
      const userInfo = localStorage.getItem("user");
      let userRoles = [];
      let detectedAdmin = false;
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          setUsername(user.name || "Admin");
          // Deteksi admin dari berbagai kemungkinan struktur user object
          if (Array.isArray(user.roles)) {
            userRoles = user.roles;
            detectedAdmin = userRoles.some(
              (r: string) =>
                typeof r === "string" && r.toLowerCase().includes("admin")
            );
          } else if (user.role_id) {
            userRoles = [user.role_id];
            detectedAdmin =
              typeof user.role_id === "string" &&
              user.role_id.toLowerCase().includes("admin");
          } else if (user.role) {
            userRoles = [user.role];
            detectedAdmin =
              typeof user.role === "string" &&
              user.role.toLowerCase().includes("admin");
          } else {
            userRoles = [];
            detectedAdmin = false;
          }
        } catch (error) {
          console.error("Error parsing user info:", error);
          setUsername("Admin");
        }
      }
      setIsAdmin(detectedAdmin);
      setIsOnPrem(process.env.NEXT_PUBLIC_IS_ONPREM === "true");
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

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } catch (e) {
      // ignore log errors, proceed with client logout
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  // ...existing code...

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                TPA Universitas
              </h1>
              {currentTime && (
                <p className="text-xs text-gray-500">{currentTime}</p>
              )}
            </div>
          </Link>

          <div className="flex items-center space-x-6">
            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              <Link
                href="/admin/dashboard"
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  isActive("/admin/dashboard")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            </div>

            {/* User Profile & Logout */}
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
                    <User className="w-4 h-4 text-blue-600" />
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
                      href="/admin/users"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manajemen User
                    </Link>
                    <Link
                      href="/admin/roles"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Manajemen Peran
                    </Link>
                    <Link
                      href="/admin/activities"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <History className="w-4 h-4 mr-2" />
                      Log Pengguna
                    </Link>
                    {isAdmin && !isOnPrem && (
                      <Link
                        href="/admin/generate-license"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserDropdownOpen(false)}
                      >
                        <KeyRound className="w-4 h-4 mr-2" />
                        Generate License Key
                      </Link>
                    )}
                    <Link
                      href="/admin/license"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserDropdownOpen(false)}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Manajemen Lisensi
                    </Link>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          handleLogout();
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
    </header>
  );
}
