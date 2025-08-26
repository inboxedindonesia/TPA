          <div
            className={`rounded-lg p-4 cursor-pointer ${
              !activeStats && activeTab === "soal"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-900"
            }`}
            onClick={() => {
              setActiveTab("soal");
              setActiveStats("");
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-2 rounded-lg mb-2 ${
                  !activeStats && activeTab === "soal"
                    ? "bg-white text-blue-500"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <FileText className="w-5 h-5" />
              </div>
              <h3
                className={`text-sm font-semibold ${
                  !activeStats && activeTab === "soal"
                    ? "text-white"
                    : "text-gray-900"
                }`}
              >
                Kelola Soal
              </h3>
              <p
                className={`text-xs mt-1 ${
                  !activeStats && activeTab === "soal"
                    ? "text-blue-100"
                    : "text-gray-600"
                }`}
              >
                {dashboardData.totalSoal.toLocaleString()} Soal
              </p>
            </div>
          </div>

          {/* Kelola Tes Card */}
          <div
            className={`rounded-lg p-4 transition-shadow cursor-pointer ${
              !activeStats && activeTab === "tes"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-900"
            }`}
            onClick={() => {
              setActiveTab("tes");
              setActiveStats("");
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-2 rounded-lg mb-2 ${
                  !activeStats && activeTab === "tes"
                    ? "bg-white text-blue-500"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <h3
                className={`text-sm font-semibold ${
                  !activeStats && activeTab === "tes"
                    ? "text-white"
                    : "text-gray-900"
                }`}
              >
                Kelola Tes
              </h3>
              <p
                className={`text-xs mt-1 ${
                  !activeStats && activeTab === "tes"
                    ? "text-blue-100"
                    : "text-gray-600"
                }`}
              >
                {dashboardData.tesAktif} Tes Aktif
              </p>
            </div>
          </div>

          {/* Total Peserta Card */}
          <div
            className={`rounded-lg p-4 cursor-pointer ${
              activeStats === "peserta"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-900"
            }`}
            onClick={() => setActiveStats("peserta")}
            title="Klik untuk melihat detail statistik peserta"
          >
            <div className="flex flex-col items-center text-center">
              <div
                className={`p-2 rounded-lg mb-2 ${
                  activeStats === "peserta"
                    ? "bg-white text-blue-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
              <p
                className={`text-xs font-medium ${
                  activeStats === "peserta" ? "text-blue-100" : "text-gray-600"
                }`}
              >
                Total Peserta
              </p>
              <p
                className={`text-lg font-bold ${
                  activeStats === "peserta" ? "text-white" : "text-gray-900"
                }`}
              >
                {dashboardData.totalPeserta.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Content berdasarkan tab - hanya tampil jika tidak ada activeStats */}
        {!activeStats && (
          <div className="transition-all duration-300 ease-in-out">
            {/* Content untuk Kelola Soal */}
            {activeTab === "soal" && (
              <div className="space-y-6 px-1 sm:px-2 lg:px-4 animate-fadeIn">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Total Soal
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {soalData?.totalSoal?.toLocaleString() ||
                            dashboardData.totalSoal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Soal Baru
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {soalData?.soalBaru?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Soal Aktif
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {soalData?.soalAktif?.toLocaleString() ||
                            dashboardData.totalSoal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Rata-rata Kesulitan
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {soalData?.rataRataKesulitan || 7}/10
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="card p-4 px-1 sm:px-2 lg:px-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Kelola Soal
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Total{" "}
                        {soalData?.totalSoal?.toLocaleString() ||
                          dashboardData.totalSoal.toLocaleString()}{" "}
                        soal •{" "}
                        {soalData?.soalList?.filter(
                          (soal: any) => soal.difficulty === "MUDAH"
                        ).length || 0}{" "}
                        soal mudah •{" "}
                        {soalData?.soalList?.filter(
                          (soal: any) => soal.difficulty === "SULIT"
                        ).length || 0}{" "}
                        soal sulit
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link
                        href="/admin/soal/create"
                        className="btn-primary flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Soal
                      </Link>
                      <Link
                        href="/admin/soal/bank-soal"
                        className="btn-secondary flex items-center"
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Bank Soal
                      </Link>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari soal..."
                          value={searchSoal}
                          onChange={(e) => setSearchSoal(e.target.value)}
                          className="pl-8 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daftar Soal Table */}
                  <div className="bg-white rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Daftar Soal
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Soal
                            </th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kategori
                            </th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Kesulitan
                            </th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tanggal Dibuat
                            </th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {soalData?.soalList &&
                          soalData.soalList.length > 0 ? (
                            soalData.soalList
                              .filter((soal: any) =>
                                soal.question
                                  .toLowerCase()
                                  .includes(searchSoal.toLowerCase())
                              )
                              .map((soal: any) => (
                                <tr key={soal.id} className="hover:bg-gray-50">
                                  <td className="px-2 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 max-w-xs truncate">
                                      {soal.question}
                                    </div>
                                  </td>
                                  <td className="px-2 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                      {formatCategory(soal.category)}
                                    </div>
                                  </td>
                                  <td className="px-2 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {soal.difficulty}
                                    </div>
                                  </td>
                                  <td className="px-2 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">
                                      {formatDate(soal.createdAt)}
                                    </div>
                                  </td>
                                  <td className="px-2 py-4 whitespace-nowrap">
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleViewSoal(soal)}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                      >
                                        <Eye className="w-4 h-4 mr-1" />
                                      </button>
                                      <button
                                        onClick={() => handleEditSoal(soal)}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                      >
                                        <Edit className="w-4 h-4 mr-1" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSoal(soal)}
                                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                      >
                                        <Trash2 className="w-4 h-4 mr-1" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan={5}
                                className="px-2 py-4 text-center text-gray-500"
                              >
                                Belum ada soal yang dibuat
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

            {/* Content untuk Kelola Tes */}
            {activeTab === "tes" && (
              <div className="space-y-6 px-1 sm:px-2 lg:px-4 animate-fadeIn">
                {/* Stats Cards untuk Tes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Tes Aktif
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {dashboardData.tesAktif || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                        <XCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Tes Nonaktif
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {(dashboardData as any).tesList
                            ? (dashboardData as any).tesList.filter(
                                (tes: any) => tes.status !== "aktif"
                              ).length
                            : 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Total Peserta Tes
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {(dashboardData as any).totalPesertaTes || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="card p-4 px-1 sm:px-2 lg:px-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Kelola Tes
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {dashboardData.tesAktif} tes aktif •{" "}
                        {dashboardData.rataRataDurasi || "0"} menit rata-rata durasi
                        • {dashboardData.rataRataSkor || "0.0"} rata-rata skor
                      </p>
                    </div>
                    <div className="flex space-x-4">
                      <Link
                        href="/admin/tes/create"
                        className="btn-primary flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Buat Tes Baru
                      </Link>
                      <Link
                        href="/admin/tes/kelola"
                        className="btn-secondary flex items-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Kelola Tes
                      </Link>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari tes..."
                          value={searchTes}
                          onChange={(e) => setSearchTes(e.target.value)}
                          className="pl-8 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daftar Tes */}
                  <div className="bg-white rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200"></div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nama Tes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Jumlah Soal
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Durasi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Peserta
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tanggal Dibuat
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(dashboardData as any).tesList &&
                          (dashboardData as any).tesList.length > 0 ? (
                            (() => {
                              const filteredTes = (
                                dashboardData as any
                              ).tesList.filter((tes: any) =>
                                tes.nama
                                  .toLowerCase()
                                  .includes(searchTes.toLowerCase())
                              );

                              if (filteredTes.length === 0) {
                                return (
                                  <tr>
                                    <td
                                      colSpan={7}
                                      className="px-6 py-4 text-center text-gray-500"
                                    >
                                      {searchTes
                                        ? "Tidak ada tes yang sesuai dengan pencarian"
                                        : "Belum ada tes yang dibuat"}
                                    </td>
                                  </tr>
                                );
                              }

                              return filteredTes.map((tes: any) => (
                                <tr
                                  key={tes.id}
                                  className="hover:bg-gray-50"
                                >
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {tes.nama}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {tes.jumlahSoal} soal
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {tes.durasi} menit
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        tes.status === "aktif"
                                          ? "bg-green-100 text-green-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {tes.status === "aktif"
                                        ? "Aktif"
                                        : "Nonaktif"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {tes.peserta} peserta
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    {formatDate(tes.createdAt)}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleViewTest(tes.id)}
                                        className="text-blue-600 hover:text-blue-800"
                                        title="Lihat Detail"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleEditTest(tes.id)}
                                        className="text-green-600 hover:text-green-800"
                                        title="Edit"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteTest(tes.id)}
                                        className="text-red-600 hover:text-red-800"
                                        title="Hapus"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ));
                            })()
                          ) : (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-6 py-4 text-center text-gray-500"
                              >
                                Belum ada tes yang dibuat
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

            {/* Content untuk Total Peserta */}
            {activeTab === "peserta" && (
              <div className="space-y-6 px-1 sm:px-2 lg:px-4 animate-fadeIn">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Total Peserta
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {pesertaData?.totalPeserta?.toLocaleString() ||
                            dashboardData.totalPeserta.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Peserta Aktif
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {pesertaData?.pesertaAktif ||
                            dashboardData.pesertaAktif ||
                            Math.floor(dashboardData.totalPeserta * 0.8)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Rata-rata Skor
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {pesertaData?.rataRataSkor ||
                            dashboardData.rataRataSkor ||
                            "75.5"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
                        <Plus className="w-6 h-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          Peserta Baru
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {pesertaData?.pesertaBaru ||
                            dashboardData.pesertaBaru ||
                            0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="card p-4 px-1 sm:px-2 lg:px-4">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Statistik Peserta
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Total{" "}
                        {pesertaData?.totalPeserta?.toLocaleString() ||
                          dashboardData.totalPeserta.toLocaleString()}{" "}
                        peserta •{" "}
                        {pesertaData?.pesertaAktif ||
                          dashboardData.pesertaAktif ||
                          Math.floor(dashboardData.totalPeserta * 0.8)}{" "}
                        peserta aktif •{" "}
                        {pesertaData?.rataRataSkor ||
                          dashboardData.rataRataSkor ||
                          "75.5"}{" "}
                        rata-rata skor
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Link
                        href="/admin/peserta"
                        className="btn-primary flex items-center"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Kelola Peserta
                      </Link>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari peserta..."
                          value={searchPeserta}
                          onChange={(e) => setSearchPeserta(e.target.value)}
                          className="pl-8 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Search className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Daftar Peserta Table */}
                  <div className="bg-white rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Daftar Peserta
                      </h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nama
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tanggal Bergabung
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Aksi
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pesertaData?.pesertaList &&
                          pesertaData.pesertaList.length > 0 ? (
                            pesertaData.pesertaList
                              .filter((peserta: any) =>
                                peserta.name
                                  .toLowerCase()
                                  .includes(searchPeserta.toLowerCase()) ||
                                peserta.email
                                  .toLowerCase()
                                  .includes(searchPeserta.toLowerCase())
                              )
                              .map((peserta: any) => (
                                <tr key={peserta.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        {peserta.profilePicture ? (
                                          <img
                                            className="h-10 w-10 rounded-full"
                                            src={peserta.profilePicture}
                                            alt={peserta.name}
                                          />
                                        ) : (
                                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                            <span className="text-sm font-medium text-gray-700">
                                              {peserta.name.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">
                                          {peserta.name}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {peserta.email}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      Aktif
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(peserta.createdAt)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button className="text-blue-600 hover:text-blue-900">
                                      Lihat Detail
                                    </button>
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
