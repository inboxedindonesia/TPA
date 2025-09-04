"use client";
import { Shield } from "lucide-react";
import { useEffect, useState } from "react";
import AdminHeader from "@/app/components/AdminHeader";

interface License {
  institution: string;
  start_date: string;
  end_date: string;
  signature: string;
}

interface Meta {
  uploaded_at: string;
}

export default function LicenseAdminPage() {
  const [license, setLicense] = useState<License | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/license")
      .then((res) => res.json())
      .then((data) => {
        setLicense(data.license);
        setMeta(data.meta);
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey }),
    });
    const data = await res.json();
    setMessage(data.message);
    if (res.ok) {
      setLicenseKey("");
      // reload license info
      setLoading(true);
      fetch("/api/admin/license")
        .then((res) => res.json())
        .then((data) => {
          setLicense(data.license);
          setMeta(data.meta);
          setLoading(false);
        });
    }
  };

  function getDaysLeft(endDate: string) {
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getBufferDaysLeft(endDate: string) {
    const now = new Date();
    const end = new Date(endDate);
    const bufferEnd = new Date(end.getTime() + 14 * 24 * 60 * 60 * 1000);
    return Math.ceil(
      (bufferEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return (
    <>
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-8">
        <div className="flex flex-col mb-6 gap-2">
          <h1 className="text-2xl font-bold text-gray-800">
            Manajemen Lisensi
          </h1>
          <p className="text-gray-600 text-sm max-w-2xl">
            Halaman ini digunakan untuk mengelola lisensi akses platform.
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            Loading...
          </div>
        ) : (
          <>
            {license ? (
              <>
                {/* Warning 2 minggu sebelum expired */}
                {getDaysLeft(license.end_date) <= 14 &&
                  getDaysLeft(license.end_date) > 0 && (
                    <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">
                      <b>Peringatan:</b> Lisensi akan berakhir dalam{" "}
                      {getDaysLeft(license.end_date)} hari. Segera lakukan
                      perpanjangan!
                    </div>
                  )}
                {/* Warning buffer 14 hari setelah expired */}
                {getDaysLeft(license.end_date) <= 0 &&
                  getBufferDaysLeft(license.end_date) > 0 && (
                    <div className="mb-4 p-3 rounded bg-orange-100 text-orange-800 border border-orange-300">
                      <b>Peringatan:</b> Lisensi sudah expired, namun aplikasi
                      masih dapat digunakan selama{" "}
                      {getBufferDaysLeft(license.end_date)} hari ke depan (masa
                      tenggang). Segera lakukan perpanjangan!
                    </div>
                  )}
                {/* Warning expired total */}
                {getBufferDaysLeft(license.end_date) <= 0 && (
                  <div className="mb-4 p-3 rounded bg-red-100 text-red-800 border border-red-300">
                    <b>Lisensi sudah benar-benar expired.</b> Aplikasi tidak
                    dapat digunakan sampai lisensi diperpanjang.
                  </div>
                )}
                <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border">
                  <div>
                    <span className="text-xs text-gray-500">Institusi</span>
                    <div className="font-semibold text-gray-800">
                      {license.institution}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">
                      Tanggal Upload
                    </span>
                    <div className="font-medium">
                      {meta?.uploaded_at
                        ? new Date(meta.uploaded_at).toLocaleString()
                        : "-"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Tanggal Mulai</span>
                    <div>{license.start_date}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">
                      Tanggal Berakhir
                    </span>
                    <div>{license.end_date}</div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">
                      Sisa Hari Aktif
                    </span>
                    <div
                      className={
                        getDaysLeft(license.end_date) <= 0
                          ? "text-red-600 font-bold"
                          : getDaysLeft(license.end_date) <= 14
                          ? "text-yellow-600 font-bold"
                          : "text-green-600 font-bold"
                      }
                    >
                      {getDaysLeft(license.end_date) <= 0
                        ? "Expired"
                        : getDaysLeft(license.end_date) <= 14
                        ? `Akan berakhir dalam ${getDaysLeft(
                            license.end_date
                          )} hari`
                        : `${getDaysLeft(license.end_date)} hari`}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status</span>
                    <div
                      className={
                        getDaysLeft(license.end_date) <= 0
                          ? "text-red-600 font-bold"
                          : getDaysLeft(license.end_date) <= 14
                          ? "text-yellow-600 font-bold"
                          : "text-green-600 font-bold"
                      }
                    >
                      {getDaysLeft(license.end_date) <= 0 ? "Expired" : "Aktif"}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="mb-8 text-red-600 bg-red-50 border border-red-200 rounded p-4 text-center">
                Belum ada lisensi terpasang.
              </div>
            )}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 bg-gray-50 p-4 rounded-lg border"
            >
              <label
                htmlFor="licenseKey"
                className="font-medium text-gray-700"
              >
                Input/Perbarui License Key
              </label>
              <textarea
                id="licenseKey"
                name="licenseKey"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                rows={4}
                className="border rounded p-2 focus:outline-blue-400"
                placeholder="Paste license key di sini"
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold transition"
              >
                Simpan Lisensi
              </button>
              {message && (
                <div className="mt-2 text-center text-red-600">{message}</div>
              )}
            </form>
          </>
        )}
      </div>
    </>
  );
}
