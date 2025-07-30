import type { Metadata } from "next";
import "./globals.css";
import ForceRefresh from "./force-refresh";

export const metadata: Metadata = {
  title: "TPA Universitas",
  description: "Platform Tes Potensi Akademik untuk Masuk Universitas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="light"
    >
      <head>
        <meta
          name="color-scheme"
          content="light"
        />
        <meta
          name="theme-color"
          content="#3b82f6"
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900">
        <ForceRefresh />
        <div className="min-h-screen flex flex-col">
          {/* Main content */}
          <main className="flex-1 bg-white">{children}</main>
        </div>
      </body>
    </html>
  );
}
