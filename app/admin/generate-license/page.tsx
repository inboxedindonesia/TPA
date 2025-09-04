"use client";
import { useState, useEffect } from "react";
import AdminHeader from "@/app/components/AdminHeader";

export default function GenerateLicensePage() {
  // Client-side redirect to dashboard if on-prem is active
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_IS_ONPREM === "true") {
      window.location.replace("/admin/dashboard");
    }
  }, []);
  if (process.env.NEXT_PUBLIC_IS_ONPREM === "true") {
    return null;
  }
  const [institution, setInstitution] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    setLicenseKey("");
    setLoading(true);
    const res = await fetch("/api/admin/generate-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institution,
        start_date: startDate,
        end_date: endDate,
      }),
      credentials: "include",
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setLicenseKey(data.licenseKey);
    } else {
      setMessage(data.message || "Gagal generate license");
    }
  };

  return (
    <>
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-8">
        <div className="flex flex-col mb-6 gap-2">
          <h1 className="text-2xl font-bold text-gray-800">
            Generate License Key
          </h1>
          <p className="text-gray-600 text-sm ">
            Halaman ini digunakan untuk membuat license key baru untuk institusi
            yang akan menggunakan platform.
          </p>
        </div>
        <div className="max-w-7xl mx-auto bg-white border rounded-lg shadow p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Institusi
              </label>
              <input
                type="text"
                className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nama Institusi"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal Berakhir
                </label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                loading ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate License Key"}
            </button>
          </form>
          {licenseKey && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License Key (copy dan distribusikan ke client):
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-2 text-xs bg-gray-50"
                rows={4}
                value={licenseKey}
                readOnly
              />
            </div>
          )}
          {message && (
            <div className="mt-4 text-red-600 text-sm font-medium">
              {message}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
