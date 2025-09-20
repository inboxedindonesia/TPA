"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Shield,
  User as UserIcon,
  GraduationCap,
  Activity,
  FileText,
  Check,
  X,
  Filter,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import AdminHeader from "@/app/components/AdminHeader";
import PaginationWithSearch from "@/app/components/PaginationWithSearch";
import { DateRangePicker } from "rsuite";

interface Notification {
  id: number;
  type: string;
  message: string;
  user_id?: number;
  username?: string;
  user_role?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
  actionDisplay: string;
  timeAgo: string;
  icon: string;
  color: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterUserRole, setFilterUserRole] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    // Reset pagination to page 1 when filters change
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchNotifications({ ...pagination, page: 1 });
  }, [
    searchTerm,
    filterType,
    filterStatus,
    filterUserRole,
    startDate,
    endDate,
  ]);

  const getActionDisplay = (type: string) => {
    const actionMap: { [key: string]: string } = {
      test_created: "Membuat Tes",
      test_updated: "Mengupdate Tes",
      test_deleted: "Menghapus Tes",
      test_started: "Memulai Tes",
      test_completed: "Menyelesaikan Tes",
      user_registered: "Registrasi User",
      user_login: "Login User",
      user_logout: "Logout User",
      user_profile_updated: "Update Profil",
    };
    return actionMap[type] || type;
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "test_created":
      case "test_started":
        return "file-text";
      case "test_completed":
      case "test_updated":
        return "check";
      case "test_deleted":
        return "x";
      case "user_registered":
      case "user_login":
        return "user-plus";
      case "user_logout":
        return "user-minus";
      case "user_profile_updated":
        return "user-edit";
      default:
        return "activity";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "test_created":
      case "test_started":
        return "blue";
      case "test_completed":
      case "test_updated":
        return "green";
      case "test_deleted":
        return "red";
      case "user_registered":
      case "user_login":
        return "indigo";
      case "user_logout":
        return "gray";
      case "user_profile_updated":
        return "orange";
      default:
        return "gray";
    }
  };

  const fetchNotifications = async (customPagination?: typeof pagination) => {
    try {
      setLoading(true);

      // Use custom pagination if provided, otherwise use current state
      const currentPagination = customPagination || pagination;
      console.log("fetchNotifications using pagination:", currentPagination); // Debug log

      const params = new URLSearchParams({
        page: currentPagination.page.toString(),
        limit: currentPagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { type: filterType }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterUserRole && { userRole: filterUserRole }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      console.log("API URL:", `/api/admin/notifications/logs?${params}`); // Debug log
      console.log("Current filters:", {
        searchTerm,
        filterType,
        filterStatus,
        filterUserRole,
        startDate,
        endDate,
      }); // Debug log

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/notifications/logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("API Response:", data); // Debug log
        console.log("Pagination data:", data.pagination); // Debug pagination
        setNotifications(
          data.notifications.map((notif: any) => ({
            ...notif,
            actionDisplay: getActionDisplay(notif.type),
            timeAgo: getTimeAgo(notif.created_at),
            icon: getNotificationIcon(notif.type),
            color: getNotificationColor(notif.type),
          }))
        );
        setPagination(data.pagination);
      } else {
        console.error(
          "Failed to fetch notifications:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeIcon = (role: string) => {
    const r = role?.toLowerCase() || "";
    if (r === "administrator" || r === "role-admin") {
      return <Shield className="w-4 h-4" />;
    }
    if (r === "moderator") return <GraduationCap className="w-4 h-4" />;
    return <UserIcon className="w-4 h-4" />;
  };

  const formatYYYYMMDD = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const handlePageChange = (newPage: number) => {
    console.log("handlePageChange called with:", newPage); // Debug log
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      console.log("Setting pagination to page:", newPage); // Debug log
      const newPagination = { ...pagination, page: newPage };
      console.log("New pagination:", newPagination); // Debug log

      // Update state and fetch with new pagination immediately
      setPagination(newPagination);
      fetchNotifications(newPagination);
    }
  };

  // Pagination handlers for PaginationWithSearch component
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      const newPagination = { ...pagination, page: pagination.page - 1 };
      setPagination(newPagination);
      fetchNotifications(newPagination);
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      const newPagination = { ...pagination, page: pagination.page + 1 };
      setPagination(newPagination);
      fetchNotifications(newPagination);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setFilterStatus("");
    setFilterUserRole("");
    setDateRange(null);
    setStartDate("");
    setEndDate("");
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleViewNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedNotification(null);
  };

  const exportNotifications = async () => {
    try {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterType && { type: filterType }),
        ...(filterStatus && { status: filterStatus }),
        ...(filterUserRole && { userRole: filterUserRole }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        export: "true",
      });

      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/notifications/logs?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `notifications-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error exporting notifications:", error);
    }
  };
  // useEffect(() => {
  //   const now = new Date();
  //   const startOfToday = new Date(
  //     now.getFullYear(),
  //     now.getMonth(),
  //     now.getDate(),
  //     0,
  //     0,
  //     0
  //   );
  //   const endOfToday = new Date(
  //     now.getFullYear(),
  //     now.getMonth(),
  //     now.getDate(),
  //     23,
  //     59,
  //     59
  //   );
  //   setDateRange([startOfToday, endOfToday]);
  //   const todayStr = formatYYYYMMDD(now);
  //   setStartDate(todayStr);
  //   setEndDate(todayStr);
  //   setPagination((prev) => ({ ...prev, page: 1 }));
  // }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Log Aktivitas
              </h1>
            </div>
            <button
              onClick={exportNotifications}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
          <p className="text-gray-600">
            Monitor semua aktivitas sistem dan aktivitas pengguna
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Cari aktivitas..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Aktivitas
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Tipe</option>
                <option value="test_created">Tes Dibuat</option>
                <option value="test_updated">Tes Diupdate</option>
                <option value="test_deleted">Tes Dihapus</option>
                <option value="test_started">Tes Dimulai</option>
                <option value="test_completed">Tes Selesai</option>
                <option value="user_registered">User Registrasi</option>
                <option value="user_login">User Login</option>
                <option value="user_logout">User Logout</option>
                <option value="user_profile_updated">Profil Diupdate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="read">Sudah Dibaca</option>
                <option value="unread">Belum Dibaca</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role User
              </label>
              <select
                value={filterUserRole}
                onChange={(e) => {
                  setFilterUserRole(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Role</option>
                <option value="administrator">Administrator</option>
                <option value="moderator">Moderator</option>
                <option value="peserta">Peserta</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rentang Tanggal
              </label>
              <DateRangePicker
                value={dateRange as any}
                onChange={(val) => setDateRange(val as [Date, Date] | null)}
                onOk={(val) => {
                  if (val && val[0] && val[1]) {
                    setDateRange(val as [Date, Date]);
                    setStartDate(formatYYYYMMDD(val[0]));
                    setEndDate(formatYYYYMMDD(val[1]));
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }
                }}
                onClean={() => {
                  setDateRange(null);
                  setStartDate("");
                  setEndDate("");
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                format="dd/MM/yyyy HH:mm"
                showMeridian
                placement="bottomStart"
                menuClassName="no-hover-range"
                showOneCalendar
                className="w-full"
                placeholder="Pilih rentang tanggal"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Reset Filter
            </button>
            <div className="text-sm text-gray-500">
              Total: {pagination.total} aktivitas
            </div>
          </div>
        </div>

        {/* Notifications Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat aktivitas...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {notifications.map((notification) => {
                    const date = new Date(
                      notification.created_at
                    ).toLocaleDateString("id-ID");
                    const time = new Date(
                      notification.created_at
                    ).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr
                        key={notification.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-gray-500" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {notification.username || "System"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {notification.user_id
                                  ? `ID: ${notification.user_id}`
                                  : "System User"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                notification.user_role === "Administrator" || notification.user_role === "role-admin"
                                  ? "bg-red-100 text-red-800"
                                  : notification.user_role === "moderator"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {getRoleBadgeIcon(notification.user_role || "")}
                              <span className="ml-1">
                                {(() => {
                                  const role =
                                    notification.user_role || "System";
                                  // Normalize role display
                                  if (
                                    role === "role-peserta" ||
                                    role === "peserta"
                                  )
                                    return "Peserta";
                                  if (role === "Administrator" || role === "role-admin")
                                    return "Administrator";
                                  if (role === "moderator") return "Moderator";
                                  return role;
                                })()}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                                notification.color === "blue"
                                  ? "bg-blue-100"
                                  : notification.color === "green"
                                  ? "bg-green-100"
                                  : notification.color === "red"
                                  ? "bg-red-100"
                                  : notification.color === "indigo"
                                  ? "bg-indigo-100"
                                  : notification.color === "orange"
                                  ? "bg-orange-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              {notification.icon === "file-text" && (
                                <FileText
                                  className={`w-4 h-4 ${
                                    notification.color === "blue"
                                      ? "text-blue-500"
                                      : "text-gray-500"
                                  }`}
                                />
                              )}
                              {notification.icon === "check" && (
                                <Check
                                  className={`w-4 h-4 ${
                                    notification.color === "green"
                                      ? "text-green-500"
                                      : "text-gray-500"
                                  }`}
                                />
                              )}
                              {notification.icon === "x" && (
                                <X
                                  className={`w-4 h-4 ${
                                    notification.color === "red"
                                      ? "text-red-500"
                                      : "text-gray-500"
                                  }`}
                                />
                              )}
                              {notification.icon === "user-plus" && (
                                <UserIcon
                                  className={`w-4 h-4 ${
                                    notification.color === "indigo"
                                      ? "text-indigo-500"
                                      : "text-gray-500"
                                  }`}
                                />
                              )}
                              {notification.icon === "user-minus" && (
                                <UserIcon
                                  className={`w-4 h-4 ${
                                    notification.color === "gray"
                                      ? "text-gray-500"
                                      : "text-gray-500"
                                  }`}
                                />
                              )}
                              {notification.icon === "user-edit" && (
                                <UserIcon
                                  className={`w-4 h-4 ${
                                    notification.color === "orange"
                                      ? "text-orange-500"
                                      : "text-gray-500"
                                  }`}
                                />
                              )}
                              {notification.icon === "activity" && (
                                <Activity className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div className="ml-3">
                              <div
                                className="text-sm font-medium text-gray-900 max-w-[150px] truncate"
                                title={notification.actionDisplay}
                              >
                                {notification.actionDisplay.length > 20
                                  ? `${notification.actionDisplay.substring(
                                      0,
                                      20
                                    )}...`
                                  : notification.actionDisplay}
                              </div>
                              <div
                                className="text-sm text-gray-500 max-w-[200px] truncate"
                                title={notification.message}
                              >
                                {notification.message.length > 30
                                  ? `${notification.message.substring(
                                      0,
                                      30
                                    )}...`
                                  : notification.message}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <button
                            onClick={() => handleViewNotification(notification)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Tidak ada aktivitas
              </h3>
              <p className="text-gray-500">
                Belum ada aktivitas yang tercatat dalam sistem
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 bg-white rounded-lg shadow">
          <PaginationWithSearch
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
          />
        </div>
      </div>

      {/* View Notification Modal */}
      {isViewModalOpen && selectedNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Detail Aktivitas
                </h3>
                <button
                  onClick={closeViewModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-4 space-y-4">
                {/* Notification Type & Icon */}
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-full ${
                      selectedNotification.color === "blue"
                        ? "bg-blue-100"
                        : selectedNotification.color === "green"
                        ? "bg-green-100"
                        : selectedNotification.color === "red"
                        ? "bg-red-100"
                        : selectedNotification.color === "indigo"
                        ? "bg-indigo-100"
                        : selectedNotification.color === "orange"
                        ? "bg-orange-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {selectedNotification.icon === "file-text" && (
                      <FileText
                        className={`w-5 h-5 ${
                          selectedNotification.color === "blue"
                            ? "text-blue-500"
                            : "text-gray-500"
                        }`}
                      />
                    )}
                    {selectedNotification.icon === "check" && (
                      <Check
                        className={`w-5 h-5 ${
                          selectedNotification.color === "green"
                            ? "text-green-500"
                            : "text-gray-500"
                        }`}
                      />
                    )}
                    {selectedNotification.icon === "x" && (
                      <X
                        className={`w-5 h-5 ${
                          selectedNotification.color === "red"
                            ? "text-red-500"
                            : "text-gray-500"
                        }`}
                      />
                    )}
                    {selectedNotification.icon === "user-plus" && (
                      <UserIcon
                        className={`w-5 h-5 ${
                          selectedNotification.color === "indigo"
                            ? "text-indigo-500"
                            : "text-gray-500"
                        }`}
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">
                      {selectedNotification.actionDisplay}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {selectedNotification.type}
                    </p>
                  </div>
                </div>

                {/* User Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">
                    Informasi User
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Username:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedNotification.username || "System"}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Role:
                      </span>
                      <p className="text-sm text-gray-900">
                        {(() => {
                          const role =
                            selectedNotification.user_role || "System";
                          if (role === "role-peserta" || role === "peserta")
                            return "Peserta";
                          if (role === "administrator")
        return "Administrator";
                          if (role === "moderator") return "Moderator";
                          return role;
                        })()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        User ID:
                      </span>
                      <p className="text-sm text-gray-900">
                        {selectedNotification.user_id || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Pesan</h5>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedNotification.message}
                    </p>
                  </div>
                </div>

                {/* Timestamp Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Waktu</h5>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Dibuat:
                    </span>
                    <p className="text-sm text-gray-900">
                      {new Date(
                        selectedNotification.created_at
                      ).toLocaleString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
