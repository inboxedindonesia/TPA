import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Eye } from "lucide-react";

interface TesDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tes: any;
}

export default function TesDetailModal({
  isOpen,
  onClose,
  tes,
}: TesDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [participantsTotal, setParticipantsTotal] = useState(0);
  const [participantsTotalPages, setParticipantsTotalPages] = useState(1);
  const [participantsPage, setParticipantsPage] = useState(1);
  const [detailLoading, setDetailLoading] = useState(false);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [participantsError, setParticipantsError] = useState("");

  // Fetch test detail once per open/testId
  useEffect(() => {
    const fetchDetail = async () => {
      if (!isOpen || !tes) return;
      try {
        setDetailLoading(true);
        setDetailError("");
        const token = localStorage.getItem("token");
        const res = await fetch(`/api/admin/tes/${tes.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Gagal memuat detail tes");
        const data = await res.json();
        setDetail(data.test);
      } catch (e: any) {
        setDetailError(e?.message || "Gagal memuat detail tes");
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [isOpen, tes?.id]);

  // Fetch participants independently so searching only reloads the table
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!isOpen || !tes) return;
      try {
        setParticipantsLoading(true);
        setParticipantsError("");
        const token = localStorage.getItem("token");
        const qs = new URLSearchParams({
          page: String(page),
          limit: String(limit),
          ...(search ? { search } : {}),
        });
        const res = await fetch(`/api/admin/tes/${tes.id}?${qs.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) throw new Error("Gagal memuat daftar peserta");
        const data = await res.json();
        setParticipants(data.participants || []);
        setParticipantsTotal(data.participantsTotal || 0);
        setParticipantsTotalPages(data.participantsTotalPages || 1);
        setParticipantsPage(data.participantsPage || 1);
      } catch (e: any) {
        setParticipantsError(e?.message || "Gagal memuat daftar peserta");
      } finally {
        setParticipantsLoading(false);
      }
    };
    fetchParticipants();
  }, [isOpen, tes?.id, page, limit, search]);

  // Reset paging and search when modal/test changes
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSearchInput("");
      setPage(1);
      setLimit(20);
    }
  }, [isOpen, tes?.id]);

  // Debounced search-as-you-type
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const formatShortDate = (date: string | number | Date | null | undefined) => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = `${d.getFullYear()}`.slice(-2);
      const hour = pad(d.getHours());
      const min = pad(d.getMinutes());
      return `${day}/${month}/${year} ${hour}:${min}`;
    } catch {
      return "-";
    }
  };

  if (!isOpen || !tes) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <span className="text-xl">&times;</span>
        </button>
        <h2 className="text-xl font-bold mb-4">Detail Tes</h2>
        {detailError && (
          <div className="text-red-600 text-sm mb-2">{detailError}</div>
        )}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="mb-2">
                <span className="font-semibold">Nama Tes:</span>{" "}
                {detail?.name || tes.nama}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Deskripsi:</span>{" "}
                {detailLoading
                  ? "Memuat detail..."
                  : detail?.description || "-"}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Durasi:</span>{" "}
                {detailLoading ? "-" : detail?.duration ?? tes.durasi} menit
              </div>
              <div className="mb-2">
                <span className="font-semibold">Minimum Score:</span>{" "}
                {detailLoading ? "-" : detail?.minimumScore ?? "-"}
              </div>
              {Array.isArray(detail?.categories) &&
                detail.categories.length > 0 && (
                  <div className="mb-2">
                    <span className="font-semibold">Kategori Soal:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {detail.categories.map((c: any) => (
                        <span
                          key={c.category}
                          className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                        >
                          {c.category?.replace(/_/g, " ")}: {c.total}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
            <div>
              <div className="mb-2">
                <span className="font-semibold">Jumlah Soal:</span>{" "}
                {detailLoading ? "-" : detail?.questionCount ?? tes.jumlahSoal}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Status:</span>{" "}
                {detailLoading ? (
                  <span className="text-gray-600">-</span>
                ) : detail?.isActive ?? tes.status === "aktif" ? (
                  <span className="text-green-600 font-semibold">Aktif</span>
                ) : (
                  <span className="text-red-600 font-semibold">Nonaktif</span>
                )}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Peserta:</span>{" "}
                {detailLoading ? "-" : detail?.participantCount ?? tes.peserta}
                {typeof detail?.participantCompletedCount === "number" && (
                  <span className="text-gray-600 text-sm">
                    {" "}
                    (Selesai: {detail?.participantCompletedCount})
                  </span>
                )}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Rata-rata Skor:</span>{" "}
                {detailLoading ? "-" : detail?.averageScore ?? "-"}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Rata-rata %:</span>{" "}
                {detailLoading ? "-" : detail?.averagePercentage ?? "-"}%
              </div>
              <div className="mb-2">
                <span className="font-semibold">Completion Rate:</span>{" "}
                {detailLoading
                  ? "-"
                  : typeof detail?.completionRate === "number"
                  ? `${detail.completionRate}%`
                  : "-"}
              </div>
              <div className="mb-2">
                <span className="font-semibold">Tanggal Dibuat:</span>{" "}
                {detailLoading
                  ? "-"
                  : new Date(detail?.createdAt || tes.createdAt).toLocaleString(
                      "id-ID"
                    )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
              <h3 className="font-semibold">
                Daftar Peserta
                {typeof participantsTotal === "number" ? (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({participantsTotal} total)
                  </span>
                ) : null}
              </h3>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Cari nama/email/Reg. ID"
                  className="w-full sm:w-64 border rounded px-3 py-1 text-sm"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={limit}
                  onChange={(e) => {
                    setPage(1);
                    setLimit(Number(e.target.value));
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto overflow-x-auto border rounded-md">
              <table className="min-w-[1000px] text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left whitespace-nowrap w-[200px]">
                      Nama
                    </th>
                    <th className="px-3 py-2 text-left whitespace-nowrap w-[260px]">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left whitespace-nowrap w-[160px]">
                      Reg. ID
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap w-[170px]">
                      Mulai
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap w-[170px]">
                      Selesai
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap w-[90px]">
                      Durasi
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap w-[90px]">
                      Persen
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap w-[170px]">
                      Status Kelulusan
                    </th>
                    <th className="px-3 py-2 text-center whitespace-nowrap w-[80px]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {participantsLoading && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        Memuat...
                      </td>
                    </tr>
                  )}
                  {!participantsLoading && participantsError && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-4 text-center text-red-600"
                      >
                        {participantsError}
                      </td>
                    </tr>
                  )}
                  {!participantsLoading &&
                  !participantsError &&
                  participants.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        Belum ada peserta
                      </td>
                    </tr>
                  ) : (
                    participants.map((p) => (
                      <tr
                        key={`${p.userId}-${p.sessionId || "none"}`}
                        className="border-t"
                      >
                        <td
                          className="px-3 py-2 whitespace-nowrap max-w-[200px] truncate"
                          title={p.name}
                        >
                          {p.name}
                        </td>
                        <td
                          className="px-3 py-2 whitespace-nowrap max-w-[260px] truncate"
                          title={p.email}
                        >
                          {p.email}
                        </td>
                        <td
                          className="px-3 py-2 whitespace-nowrap max-w-[160px] truncate"
                          title={p.registration_id || "-"}
                        >
                          {p.registration_id || "-"}
                        </td>
                        <td
                          className="px-3 py-2 text-center whitespace-nowrap max-w-[170px] truncate"
                          title={
                            p.startTime
                              ? new Date(p.startTime).toLocaleString("id-ID")
                              : "-"
                          }
                        >
                          {formatShortDate(p.startTime)}
                        </td>
                        <td
                          className="px-3 py-2 text-center whitespace-nowrap max-w-[170px] truncate"
                          title={
                            p.endTime
                              ? new Date(p.endTime).toLocaleString("id-ID")
                              : "-"
                          }
                        >
                          {formatShortDate(p.endTime)}
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap w-[90px]">
                          {typeof p.durationMinutes === "number"
                            ? `${p.durationMinutes} mnt`
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-center whitespace-nowrap w-[90px]">
                          {typeof p.percentage === "number"
                            ? `${p.percentage}%`
                            : "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {p.kelulusan === "lolos" ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Lolos
                            </span>
                          ) : p.kelulusan === "tidak-lolos" ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Tidak Lolos
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Belum Tes
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-center w-[80px]">
                          {p.sessionId ? (
                            <Link
                              href={`/admin/hasil-tes/${p.sessionId}`}
                              className="inline-flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                            </Link>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-3 text-sm">
              <div className="text-gray-600">
                Halaman {participantsPage} dari {participantsTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Sebelumnya
                </button>
                <button
                  className="px-3 py-1 border rounded disabled:opacity-50"
                  onClick={() =>
                    setPage((p) => Math.min(participantsTotalPages, p + 1))
                  }
                  disabled={page >= participantsTotalPages}
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
