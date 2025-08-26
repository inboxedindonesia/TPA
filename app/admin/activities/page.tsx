"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Shield,
  User as UserIcon,
  GraduationCap,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import AdminHeader from "@/app/components/AdminHeader";
import { DateRangePicker } from "rsuite";

interface Activity {
  id: number;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
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

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [filterUserRole, setFilterUserRole] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  useEffect(() => {
    fetchActivities();
  }, [
    pagination.page,
    searchTerm,
    filterAction,
    filterEntityType,
    filterUserRole,
    startDate,
    endDate,
  ]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(filterAction && { action: filterAction }),
        ...(filterEntityType && { entityType: filterEntityType }),
        ...(filterUserRole && { userRole: filterUserRole }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/admin/activities?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        setPagination(data.pagination);
      } else {
        console.error(
          "Failed to fetch activities:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterAction("");
    setFilterEntityType("");
    setFilterUserRole("");
    setStartDate("");
    setEndDate("");
    setDateRange(null);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatYYYYMMDD = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // Role badge helpers aligned with role management
  const getRoleBadgeColor = (role: string) => {
    const r = role.toLowerCase();
    if (r === "administrator" || r === "admin")
      return "bg-red-100 text-red-800";
    if (r === "moderator") return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-800";
  };

  const getRoleBadgeIcon = (role: string) => {
    const r = role.toLowerCase();
    if (r === "administrator" || r === "admin")
      return <Shield className="w-4 h-4" />;
    if (r === "moderator") return <GraduationCap className="w-4 h-4" />;
    return <UserIcon className="w-4 h-4" />;
  };

  // Initialize default date range as Today
  useEffect(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const endOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    setDateRange([startOfToday, endOfToday]);
    const todayStr = formatYYYYMMDD(now);
    setStartDate(todayStr);
    setEndDate(todayStr);
    setPagination((prev) => ({ ...prev, page: 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Aktivitas Sistem
            </h1>
          </div>
          <p className="text-gray-600">
            Monitor semua aktivitas user dan admin dalam sistem
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
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aksi
              </label>
              <div className="relative">
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full appearance-none pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Aksi</option>
                  <option value="LOGIN">Login</option>
                  <option value="LOGOUT">Logout</option>
                  <option value="REGISTER">Register</option>
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="DELETE">Delete</option>
                  <option value="START">Start</option>
                  <option value="COMPLETE">Complete</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Entitas
              </label>
              <div className="relative">
                <select
                  value={filterEntityType}
                  onChange={(e) => setFilterEntityType(e.target.value)}
                  className="w-full appearance-none pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Tipe</option>
                  <option value="USER">User</option>
                  <option value="TEST">Test</option>
                  <option value="QUESTION">Question</option>
                  <option value="TEST_SESSION">Test Session</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role User
              </label>
              <div className="relative">
                <select
                  value={filterUserRole}
                  onChange={(e) => setFilterUserRole(e.target.value)}
                  className="w-full appearance-none pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Semua Role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PESERTA">Peserta</option>
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <ChevronDown className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-2">
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

        {/* Activities Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Memuat aktivitas...</p>
            </div>
          ) : activities.length > 0 ? (
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activities.map((activity) => {
                    const activityDate = new Date(activity.createdAt);
                    const date = activityDate.toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    });
                    const time = activityDate.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <tr
                        key={activity.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {activity.userName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {activity.userEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                              activity.userRole
                            )}`}
                          >
                            {getRoleBadgeIcon(activity.userRole)}
                            <span className="ml-1">{activity.userRole}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.actionDisplay}
                          </div>
                          {activity.entityName &&
                            activity.entityType !== "USER" && (
                              <div className="text-sm text-gray-500">
                                {activity.entityName}
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {time}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">📝</div>
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
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {Array.from(
                { length: pagination.totalPages },
                (_, i) => i + 1
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg ${
                    page === pagination.page
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
