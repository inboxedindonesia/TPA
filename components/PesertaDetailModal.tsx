import React from "react";

interface PesertaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  peserta: any;
  testResults: any[];
}

import { X } from "lucide-react";

const PesertaDetailModal: React.FC<PesertaDetailModalProps> = ({
  isOpen,
  onClose,
  peserta,
  testResults,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div
        className="bg-white rounded-lg shadow-lg w-full p-6 relative"
        style={{ maxWidth: 500, maxHeight: "80vh", overflow: "auto" }}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold mb-4">Detail Peserta</h2>``
        <div
          className="space-y-2 mb-6 text-sm"
          style={{ maxWidth: 400 }}
        >
          {/* Biodata utama saja, style seperti sebelumnya */}
          <div>
            <span className="font-semibold">ID:</span> {peserta?.id || "-"}
          </div>
          <div>
            <span className="font-semibold">Nama:</span> {peserta?.name || "-"}
          </div>
          <div>
            <span className="font-semibold">Email:</span>{" "}
            {peserta?.email || "-"}
          </div>
          {peserta?.registration_id !== undefined && (
            <div>
              <span className="font-semibold">Registration ID:</span>{" "}
              {peserta.registration_id || "-"}
            </div>
          )}
          {peserta?.is_verified !== undefined && (
            <div>
              <span className="font-semibold">Status:</span>{" "}
              {peserta.is_verified ? "Aktif" : "Belum Verifikasi"}
            </div>
          )}
          {peserta?.createdAt && (
            <div>
              <span className="font-semibold">Tanggal Daftar:</span>{" "}
              {new Date(peserta.createdAt).toLocaleString("id-ID")}
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold mb-2">Riwayat Tes</h3>
        <div className="max-h-60 overflow-y-auto">
          {testResults && testResults.length > 0 ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left font-medium">Nama Tes</th>
                  <th className="text-left font-medium">Skor</th>
                  <th className="text-left font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody>
                {testResults.map((tes: any) => (
                  <tr key={tes.id}>
                    <td>{tes.namaTes}</td>
                    <td>{tes.skor}</td>
                    <td>
                      {tes.tanggal
                        ? new Date(tes.tanggal).toLocaleString("id-ID")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-500">Belum ada riwayat tes</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PesertaDetailModal;
