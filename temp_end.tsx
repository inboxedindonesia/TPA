                            <tr>
                              <td
                                colSpan={5}
                                className="px-6 py-4 text-center text-gray-500"
                              >
                                Belum ada peserta yang terdaftar
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Modal View Soal */}
      {showModal && selectedSoal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Detail Soal
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Question */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Pertanyaan:</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                  {selectedSoal.question}
                </p>
              </div>

              {/* Correct Answer Section */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Jawaban Benar:
                </h4>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <span className="text-green-600 font-medium mr-2">✓</span>
                    {selectedSoal.tipeJawaban === "IMAGE" &&
                    selectedSoal.correctAnswer &&
                    (Array.isArray(selectedSoal.correctAnswer)
                      ? selectedSoal.correctAnswer.some((answer: string) =>
                          answer.startsWith("gambar_")
                        )
                      : selectedSoal.correctAnswer.startsWith("gambar_")) ? (
                      <div className="flex-1">
                        <p className="text-sm text-gray-600 mb-2">
                          {Array.isArray(selectedSoal.correctAnswer)
                            ? "Jawaban benar adalah gambar berikut:"
                            : "Jawaban benar adalah gambar berikut:"}
                        </p>
                        <div className="flex justify-center">
                          {Array.isArray(selectedSoal.correctAnswer) ? (
                            <div className="grid grid-cols-2 gap-2">
                              {(
                                formatCorrectAnswer(
                                  selectedSoal.correctAnswer,
                                  selectedSoal.tipeJawaban,
                                  selectedSoal.options || []
                                ) as string[]
                              ).map((imageSrc: string, index: number) => (
                                <img
                                  key={index}
                                  src={imageSrc}
                                  alt={`Jawaban Benar ${index + 1}`}
                                  className="max-w-full h-auto rounded border-2 border-green-300"
                                  style={{ maxHeight: "150px" }}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <img
                              src={
                                formatCorrectAnswer(
                                  selectedSoal.correctAnswer,
                                  selectedSoal.tipeJawaban,
                                  selectedSoal.options || []
                                ) as string
                              }
                              alt="Jawaban Benar"
                              className="max-w-full h-auto rounded border-2 border-green-300"
                              style={{ maxHeight: "200px" }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-900 font-medium">
                        {Array.isArray(selectedSoal.correctAnswer)
                          ? (
                              formatCorrectAnswer(
                                selectedSoal.correctAnswer,
                                selectedSoal.tipeJawaban || "",
                                selectedSoal.options || []
                              ) as string[]
                            ).join(", ")
                          : formatCorrectAnswer(
                              selectedSoal.correctAnswer || "",
                              selectedSoal.tipeJawaban || "",
                              selectedSoal.options || []
                            )}
                      </span>
                    )}
                  </div>
                  {selectedSoal.tipeSoal === "ISIAN" && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Peserta harus mengisi jawaban yang tepat sesuai dengan
                        jawaban di atas.
                      </p>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                        <p className="text-xs text-yellow-800">
                          <strong>Catatan:</strong> Jawaban harus tepat sama
                          dengan yang ditentukan (case sensitive).
                        </p>
                      </div>
                      {selectedSoal.tipeJawaban === "IMAGE" && (
                        <div className="bg-purple-50 border border-purple-200 rounded-md p-2 mt-2">
                          <p className="text-xs text-purple-800">
                            <strong>Info:</strong> Soal ini menggunakan gambar
                            sebagai jawaban yang harus diisi peserta.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedSoal.tipeSoal === "PILIHAN_GANDA" && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Jawaban yang benar dari pilihan yang tersedia.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                        <p className="text-xs text-blue-800">
                          <strong>Catatan:</strong> Jawaban yang ditandai dengan
                          ✓ adalah jawaban yang benar.
                        </p>
                      </div>
                      {selectedSoal.tipeJawaban === "IMAGE" && (
                        <div className="bg-purple-50 border border-purple-200 rounded-md p-2 mt-2">
                          <p className="text-xs text-purple-800">
                            <strong>Info:</strong> Soal ini menggunakan gambar
                            sebagai pilihan jawaban. Jawaban benar ditandai
                            dengan ✓.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Question Image */}
              {selectedSoal.gambar && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Gambar Soal:
                  </h4>
                  <div className="flex justify-center">
                    <img
                      src={selectedSoal.gambar}
                      alt="Gambar Soal"
                      className="max-w-full h-auto rounded-md border"
                      style={{ maxHeight: "300px" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TPA Specific Info */}
              {selectedSoal.kategori && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Kategori:
                    </h4>
                    <p className="text-gray-700">
                      {formatCategory(
                        selectedSoal.kategori || selectedSoal.category
                      )}
                    </p>
                  </div>
                  {selectedSoal.subkategori && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Subkategori:
                      </h4>
                      <p className="text-gray-700">
                        {selectedSoal.subkategori}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Answer Type */}
              {selectedSoal.tipeJawaban && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Tipe Jawaban:
                  </h4>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {selectedSoal.tipeJawaban === "TEXT" ? "Teks" : "Gambar"}
                  </div>
                  {selectedSoal.tipeJawaban === "IMAGE" && (
                    <p className="text-sm text-gray-500 mt-1">
                      Jawaban menggunakan gambar sebagai pilihan.
                    </p>
                  )}
                  {selectedSoal.tipeJawaban === "TEXT" && (
                    <p className="text-sm text-gray-500 mt-1">
                      Jawaban menggunakan teks sebagai pilihan.
                    </p>
                  )}
                </div>
              )}

              {/* Answer Options */}
              {selectedSoal.options &&
                selectedSoal.options.length > 0 &&
                selectedSoal.tipeSoal === "PILIHAN_GANDA" && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Pilihan Jawaban:
                    </h4>
                    <div className="space-y-2">
                      {selectedSoal.options.map(
                        (option: string, index: number) => (
                          <div
                            key={index}
                            className={`p-3 rounded-md border ${
                              option === selectedSoal.correctAnswer
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center">
                              <span className="font-medium text-gray-700 mr-2">
                                {String.fromCharCode(65 + index)}.
                              </span>
                              {selectedSoal.tipeJawaban === "IMAGE" ? (
                                <div className="flex-1">
                                  <img
                                    src={option}
                                    alt={`Pilihan ${String.fromCharCode(
                                      65 + index
                                    )}`}
                                    className="max-w-full h-auto rounded"
                                    style={{ maxHeight: "100px" }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-700 flex-1">
                                  {option}
                                </span>
                              )}
                              {option === selectedSoal.correctAnswer && (
                                <span className="ml-2 text-green-600 font-medium flex items-center">
                                  <span className="mr-1">✓</span>
                                  Benar
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Answer Images */}
              {selectedSoal.gambarJawaban &&
                selectedSoal.gambarJawaban.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Gambar Jawaban:
                    </h4>
                    <div className="space-y-4">
                      {selectedSoal.gambarJawaban.map(
                        (image: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <div className="w-8 h-8 bg-blue-500 text-white text-sm rounded-full flex items-center justify-center flex-shrink-0">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <div className="flex-1">
                              <img
                                src={image}
                                alt={`Jawaban ${index + 1}`}
                                className="max-w-full h-auto rounded border"
                                style={{ maxHeight: "200px" }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Description */}
              {selectedSoal.deskripsi && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Deskripsi:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                    {selectedSoal.deskripsi}
                  </p>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h4 className="font-medium text-gray-900 mb-3">
                  Informasi Soal:
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Tanggal Dibuat:</span>
                    <p className="text-gray-900 font-medium">
                      {formatDate(selectedSoal.createdAt)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Level Kesulitan:</span>
                    <p className="text-gray-900 font-medium">
                      {selectedSoal.levelKesulitan || selectedSoal.difficulty}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Jumlah Penggunaan:</span>
                    <p className="text-gray-900 font-medium">
                      {selectedSoal.usageCount} kali
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tingkat Keberhasilan:</span>
                    <p className="text-gray-900 font-medium">
                      {selectedSoal.successRate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Delete */}
      {deleteModal.isOpen && (
        <FeedbackModal
          isOpen={deleteModal.isOpen}
          type="warning"
          title="Konfirmasi Hapus Soal"
          message={`Apakah Anda yakin ingin menghapus soal "${deleteModal.soalTitle}"?`}
          onClose={closeDeleteModal}
          onConfirm={confirmDeleteSoal}
          showConfirmButton={true}
          confirmText="Hapus"
          cancelText="Batal"
        />
      )}

      {/* Modal Feedback */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        autoClose={true}
      />
    </div>
  );
}
