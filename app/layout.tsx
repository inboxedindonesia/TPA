import type { Metadata } from "next";
import "./globals.css";
import "rsuite/dist/rsuite-no-reset.min.css";
import ForceRefresh from "./force-refresh";
import GoogleAutoTranslate from "./components/GoogleAutoTranslate";

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
      <body className="min-h-screen bg-white text-gray-900">
        <ForceRefresh />
        {process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTO_TRANSLATE === "true" && (
          <GoogleAutoTranslate />
        )}
        <div className="min-h-screen flex flex-col">
          {/* Main content */}
          <main className="flex-1 bg-white">{children}</main>
        </div>
      </body>
    </html>
  );
}
