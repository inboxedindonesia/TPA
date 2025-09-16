import React, { useRef, useEffect } from "react";
import jsPDF from "jspdf";
import { X, CalendarDays, Trophy, Clock, FileDown } from "lucide-react";

interface PesertaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  peserta: any;
  testResults: any[];
}

const PesertaDetailModal: React.FC<PesertaDetailModalProps> = ({
  isOpen,
  onClose,
  peserta,
  testResults,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isOpen]);

  if (!isOpen) return null;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const computeAge = (dateString: string) => {
    if (!dateString) return "-";
    const dob = new Date(dateString);
    if (isNaN(dob.getTime())) return "-";
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} tahun`;
  };
  
  const formatDuration = (sec?: number | null) => {
    if (sec == null || isNaN(sec as any)) return "-";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} detik`;
    return `${m} menit ${s.toString().padStart(2, "0")} detik`;
  };

  // Generate PDF untuk satu hasil tes dengan preview
  const downloadSingleResultPdf = (r: any) => {
    try {
      const doc = new jsPDF();
      const safe = (s: any) => (s == null ? "-" : String(s));
      const pct =
        r?.maxScore > 0 ? Math.round((r.score / r.maxScore) * 100) : null;
      const fileSafe = (s: string) =>
        safe(s)
          .toLowerCase()
          .replace(/[^a-z0-9-_\s]/g, "")
          .trim()
          .replace(/\s+/g, "-");

      doc.setFontSize(16);
      doc.text("Hasil Tes TPA", 10, 15);
      doc.setFontSize(12);

      let y = 30;
      doc.text(`Nama Tes     : ${safe(r?.testName)}`, 10, y);
      y += 8;
      doc.text(
        `Skor          : ${safe(r?.score)}${
          r?.maxScore ? "/" + r.maxScore : ""
        }${pct !== null ? ` (${pct}%)` : ""}`,
        10,
        y
      );
      y += 8;
      doc.text(`Tanggal      : ${r?.startTime ? formatDate(r.startTime) : "-"}`, 10, y);
      y += 8;
      doc.text(`Durasi        : ${r?.duration ? formatDuration(r.duration) : "-"}`, 10, y);
      y += 8;
      doc.text(`Status        : ${r?.status === "COMPLETED" ? "Selesai" : "Belum Selesai"}`, 10, y);

      // Tambahkan informasi detail jika ada
      if (r?.correctAnswers !== undefined || r?.wrongAnswers !== undefined) {
        y += 12;
        doc.text("Detail Jawaban:", 10, y);
        y += 8;
        doc.text(`Benar         : ${safe(r?.correctAnswers)}`, 10, y);
        y += 8;
        doc.text(`Salah         : ${safe(r?.wrongAnswers)}`, 10, y);
      }

      // Preview PDF terlebih dahulu
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Buka preview di tab baru
      const previewWindow = window.open(pdfUrl, '_blank');
      
      if (previewWindow) {
        // Tunggu sebentar lalu tanyakan apakah ingin download
        setTimeout(() => {
          const shouldDownload = confirm('Apakah Anda ingin mengunduh PDF ini?');
          if (shouldDownload) {
            const dateForFile = r?.startTime
              ? new Date(r.startTime).toISOString().slice(0, 10)
              : "tanggal";
            const nameForFile = fileSafe(r?.testName || "tes");
            doc.save(`hasil-${nameForFile}-${dateForFile}.pdf`);
          }
          // Bersihkan URL object
          URL.revokeObjectURL(pdfUrl);
        }, 1000);
      } else {
        // Jika popup diblokir, langsung download
        alert('Popup diblokir. PDF akan langsung diunduh.');
        const dateForFile = r?.startTime
          ? new Date(r.startTime).toISOString().slice(0, 10)
          : "tanggal";
        const nameForFile = fileSafe(r?.testName || "tes");
        doc.save(`hasil-${nameForFile}-${dateForFile}.pdf`);
        URL.revokeObjectURL(pdfUrl);
      }
    } catch (e) {
      alert("Gagal membuat PDF hasil tes.");
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-full p-6 relative"
        style={{ maxWidth: 900, maxHeight: "80vh", overflow: "auto" }}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4">Detail Peserta</h2>
        
        {/* Header Summary Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={peserta?.foto ? `/${peserta.foto}` : "/vercel.svg"}
                  alt="Foto Profil"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {peserta?.name || "-"}
                </h2>
                {peserta?.registration_id && (
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="font-medium text-gray-700">
                      {peserta.registration_id}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {peserta?.is_verified !== undefined && (
              <div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    peserta.is_verified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {peserta.is_verified ? "Aktif" : "Belum Terverifikasi"}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Personal Information Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Informasi Pribadi
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="mt-1 font-medium text-gray-900">
                {peserta?.email || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Usia</p>
              <p className="mt-1 font-medium text-gray-900">
                {computeAge(peserta?.tanggal_lahir || "")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">NIK</p>
              <p className="mt-1 font-medium text-gray-900">
                {peserta?.nik || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jenjang</p>
              <p className="mt-1 font-medium text-gray-900">
                {peserta?.jenjang || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jurusan</p>
              <p className="mt-1 font-medium text-gray-900">
                {peserta?.jurusan || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jenis Kelamin</p>
              <p className="mt-1 font-medium text-gray-900">
                {peserta?.jenis_kelamin || "-"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Tempat, Tanggal Lahir</p>
              <p className="mt-1 font-medium text-gray-900">
                {peserta?.tempat_lahir || "-"}{" "}
                {peserta?.tanggal_lahir
                  ? `, ${formatDate(peserta.tanggal_lahir)}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
        
        {/* Address / School Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Alamat & Sekolah
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Asal Sekolah</p>
              <p className="mt-1 font-medium text-gray-900">
                {peserta?.asal_sekolah || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Provinsi Sekolah</p>
              <p className="mt-1 font-medium text-gray-900">
                {peserta?.provinsi_sekolah || "-"}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">Alamat</p>
              <p className="mt-1 font-medium text-gray-900">
                {peserta?.alamat || "-"}
              </p>
            </div>
          </div>
        </div>
        {/* Recent Test History Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Riwayat Tes
            </h3>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {testResults && testResults.length > 0 ? (
              <div>
                {testResults.map((tes: any, index) => {
                  const percent =
                    tes?.maxScore && tes.maxScore > 0
                      ? Math.round((tes.score / tes.maxScore) * 100)
                      : null;
                  const minimumScore = tes.minimumScore || 60;
                  const goodThreshold = Math.min(minimumScore + 20, 100); // 20 poin di atas minimum, max 100
                  const scoreColor =
                    percent === null
                      ? "bg-gray-100 text-gray-800"
                      : percent >= goodThreshold
                      ? "bg-green-100 text-green-800"
                      : percent >= minimumScore
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800";

                  return (
                    <div
                      key={index}
                      className="group relative mb-4 rounded-xl border border-gray-200/70 bg-white/80 p-4 shadow-sm ring-1 ring-black/5"
                    >
                      <span className="pointer-events-none absolute inset-x-0 top-0 h-px" />

                      <div className="space-y-4">
                        {/* Header row with title/badges and actions */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h4 className="text-lg font-semibold tracking-tight text-gray-900">
                              {tes.testName || "Tes"}
                            </h4>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${scoreColor} ring-1 ring-black/5`}
                              >
                                <Trophy className="h-3.5 w-3.5" />
                                {`Skor: ${tes.score ?? "-"}${tes?.maxScore ? "/" + tes.maxScore : ""}${percent !== null ? ` (${percent}%)` : ""}`}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 shadow-sm">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {`${tes?.startTime ? formatDate(tes.startTime) : "-"}`}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tes.status === "COMPLETED" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                              >
                                {tes.status === "COMPLETED" ? "Selesai" : tes.status === "IN_PROGRESS" ? "Sedang Dikerjakan" : "Belum Selesai"}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white shadow-sm ring-1 ring-emerald-600/10 transition hover:bg-emerald-700 hover:shadow"
                              onClick={() => downloadSingleResultPdf(tes)}
                            >
                              <FileDown className="h-4 w-4" />
                              Unduh PDF
                            </button>
                          </div>
                        </div>

                        {/* Progress bars - full width */}
                        <div className="space-y-4">
                          {percent !== null && (
                            <div>
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Skor</span>
                                <span className="font-medium text-gray-700">
                                  {percent}%
                                </span>
                              </div>
                              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className={`h-full rounded-full ${
                                    percent >= 80
                                      ? "bg-emerald-500"
                                      : percent >= 60
                                      ? "bg-yellow-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {typeof tes?.durationSpentSec === "number" &&
                          tes?.testDuration ? (
                            <div>
                              {(() => {
                                const totalSec = (tes.testDuration || 0) * 60;
                                const used = Math.max(
                                  0,
                                  Math.min(totalSec, tes.durationSpentSec || 0)
                                );
                                const usedPct =
                                  totalSec > 0
                                    ? Math.round((used / totalSec) * 100)
                                    : 0;
                                return (
                                  <>
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                      <span>Pemakaian Waktu</span>
                                      <span className="font-medium text-gray-700">
                                        {formatDuration(used)} /{" "}
                                        {tes.testDuration} menit
                                      </span>
                                    </div>
                                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                      <div
                                        className="h-full rounded-full bg-blue-500"
                                        style={{
                                          width: `${Math.min(100, usedPct)}%`,
                                        }}
                                      />
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          ) : null}
                        </div>

                        {/* Metrics - full width */}
                        <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-4">
                          <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2">
                            <div>
                              <div className="text-gray-500">Benar</div>
                              <div className="font-semibold text-gray-900">
                                {tes?.correctAnswers ?? 0}/
                                {tes?.totalQuestions ?? 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-gray-500">Belum ada riwayat tes</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PesertaDetailModal;
