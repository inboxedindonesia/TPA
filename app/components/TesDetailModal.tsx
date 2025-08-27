import React from "react";

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
  if (!isOpen || !tes) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <span className="text-xl">&times;</span>
        </button>
        <h2 className="text-xl font-bold mb-4">Detail Tes</h2>
        <div className="mb-2">
          <span className="font-semibold">Nama Tes:</span> {tes.nama}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Jumlah Soal:</span> {tes.jumlahSoal}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Durasi:</span> {tes.durasi} menit
        </div>
        <div className="mb-2">
          <span className="font-semibold">Status:</span>{" "}
          {tes.status === "aktif" ? (
            <span className="text-green-600 font-semibold">Aktif</span>
          ) : (
            <span className="text-red-600 font-semibold">Nonaktif</span>
          )}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Peserta:</span> {tes.peserta}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Tanggal Dibuat:</span>{" "}
          {tes.createdAt
            ? new Date(tes.createdAt).toLocaleString("id-ID")
            : "-"}
        </div>
      </div>
    </div>
  );
}
