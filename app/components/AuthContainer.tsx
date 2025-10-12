"use client";
import { GraduationCap } from "lucide-react";
import React from "react";

interface AuthContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: "sm" | "lg" | "xl";
  footer?: React.ReactNode;
}

// Wrapper autentikasi dengan fullscreen gradient background (tanpa rounded panel)
export function AuthContainer({
  title,
  subtitle,
  children,
  width = "sm",
  footer,
}: AuthContainerProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Fullscreen soft gradient */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />

      <div
        className={`relative z-10 ${
          width === "xl"
            ? "max-w-6xl"
            : width === "lg"
            ? "max-w-3xl"
            : "max-w-md"
        } w-full space-y-8`}
      >
        <div
          className={`card ${
            width === "xl" ? "p-12" : width === "lg" ? "p-10" : "p-8"
          } shadow-2xl relative overflow-hidden`}
        >
          {/* Decorative subtle circles on card */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-100/50 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-52 h-52 rounded-full bg-indigo-100/40 blur-2xl" />
          <div className="text-center relative">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto">
                {subtitle}
              </p>
            )}
          </div>
          <div className="mt-8">{children}</div>
          {footer && (
            <div className="mt-6 text-center text-sm text-gray-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthContainer;
