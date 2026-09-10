"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { adminApi, destinationApi } from "@/lib/api";
import { AdminStatsResponse, UserSummaryResponse, Destination } from "@/lib/types";
import { useToast } from "@/hooks/useToast";
import Image from "next/image";
import {
  Shield,
  Users,
  MapPin,
  Plane,
  CreditCard,
  Settings,
  Lock,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

export default function AdminPanel() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [users, setUsers] = useState<UserSummaryResponse[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "destinations" | "system">("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const { addToast } = useToast();

  async function loadAdminData(showToast = false) {
    try {
      if (showToast) setRefreshing(true);
      setError("");
      const [statsRes, usersRes, destsRes] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getUsers().catch(() => []),
        destinationApi.getAll().catch(() => []),
      ]);

      if (statsRes) setStats(statsRes);
      if (usersRes) setUsers(usersRes);
      if (destsRes) setDestinations(destsRes);

      if (showToast) {
        addToast("Admin panel synchronized with backend", "success");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load admin data";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function handleRoleChange(userId: number, newRole: string) {
    setUpdatingUserId(userId);
    try {
      const updated = await adminApi.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: updated.role } : u))
      );
      addToast(`Updated ${updated.name}'s role to ${updated.role}`, "success");
      const newStats = await adminApi.getStats();
      setStats(newStats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role";
      addToast(msg, "error");
    } finally {
      setUpdatingUserId(null);
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  return (
    <div className="space-y-6 pb-16">
      {/* ── Admin Header Banner (Pure White & Orange) ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-200 bg-orange-50 text-orange-700 text-xs font-semibold tracking-wide mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Administrator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Admin <span className="text-orange-500">Control Center</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              Platform administration, role assignments, system metrics, and destination catalogue.
            </p>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => loadAdminData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-700 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-red-500" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-sm animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-3.5 bg-slate-100 rounded w-1/2" />
                <div className="w-9 h-9 rounded-lg bg-slate-100" />
              </div>
              <div className="h-8 bg-slate-100 rounded w-1/3" />
              <div className="h-3 bg-slate-50 rounded w-2/3" />
            </div>
          ))
        ) : (
          <>
            <AdminStatCard
              title="Total Registered Users"
              value={stats?.totalUsers ?? users.length}
              icon={<Users className="w-5 h-5 text-orange-500" />}
              subtitle={`${stats?.usersByRole?.["ADMINISTRATOR"] ?? 1} Admin, ${stats?.usersByRole?.["TRAVELER"] ?? users.length - 1} Travelers`}
            />
            <AdminStatCard
              title="Active Destinations"
              value={stats?.totalDestinations ?? destinations.length}
              icon={<MapPin className="w-5 h-5 text-orange-500" />}
              subtitle="Catalog destinations"
            />
            <AdminStatCard
              title="Total Trips Created"
              value={stats?.totalTrips ?? 0}
              icon={<Plane className="w-5 h-5 text-orange-500" />}
              subtitle="Across all users"
            />
            <AdminStatCard
              title="Total Expenses Logged"
              value={stats?.totalExpenses ?? 0}
              icon={<CreditCard className="w-5 h-5 text-orange-500" />}
              subtitle={`₹${(stats?.totalSpentAmount ?? 0).toLocaleString()} recorded`}
            />
          </>
        )}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "bg-orange-500 text-white font-semibold shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Role Management</span>
          <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === "users" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("destinations")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "destinations"
              ? "bg-orange-500 text-white font-semibold shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Destinations Catalogue</span>
          <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
            activeTab === "destinations" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {destinations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "system"
              ? "bg-orange-500 text-white font-semibold shadow-sm"
              : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System & Security</span>
        </button>
      </div>

      {/* ── Tab Content: Users Management ── */}
      {activeTab === "users" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Filter and search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-slate-500 font-medium">Filter:</span>
              {["ALL", "ADMINISTRATOR", "TRAVELER", "GROUP_ADMIN"].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    roleFilter === role
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-800">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">User</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Current Role</th>
                    <th className="px-6 py-3.5 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                        No users matching the filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const initials = u.name
                        ? u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        : "U";

                      return (
                        <tr key={u.id} className="hover:bg-orange-50/20 transition-colors">
                          {/* User info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center font-bold text-orange-700 text-xs">
                                {initials}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{u.name}</p>
                                <p className="text-xs text-slate-400">ID #{u.id}</p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                            {u.email}
                          </td>

                          {/* Current Role Badge */}
                          <td className="px-6 py-4">
                            <RoleBadge role={u.role} />
                          </td>

                          {/* Change Role Selector */}
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <select
                                value={u.role}
                                disabled={updatingUserId === u.id}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="rounded-lg border border-slate-300 bg-white text-slate-800 px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 disabled:opacity-50 cursor-pointer shadow-sm"
                              >
                                <option value="TRAVELER">TRAVELER</option>
                                <option value="GROUP_ADMIN">GROUP_ADMIN</option>
                                <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                              </select>
                              {updatingUserId === u.id && (
                                <svg className="animate-spin h-4 w-4 text-orange-500" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Tab Content: Destinations Catalogue ── */}
      {activeTab === "destinations" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:border-orange-300 transition-colors"
            >
              <div className="relative h-44 w-full bg-slate-100">
                <Image
                  src={dest.imageUrl}
                  alt={dest.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{dest.name}</h3>
                    <p className="text-xs text-orange-300 font-medium">
                      {dest.city}, {dest.country}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white/20 text-white backdrop-blur border border-white/30">
                    ID #{dest.id}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {dest.description}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Tab Content: System & Security ── */}
      {activeTab === "system" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-500" />
              <span>Role-Based Access Control (RBAC)</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-orange-600">ADMINISTRATOR</span>
                <span className="text-slate-600">Full platform control, user roles, stats & seed data</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-900">GROUP_ADMIN</span>
                <span className="text-slate-600">Group trips management & itinerary collaboration</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-600">TRAVELER</span>
                <span className="text-slate-600">Personal trips, itineraries, weather search & expense tracking</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function AdminStatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-orange-300 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">
          {value.toLocaleString()}
        </p>
        {subtitle && <p className="mt-1 text-xs text-slate-500 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "ADMINISTRATOR") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
        <Shield className="w-3.5 h-3.5 text-orange-500" />
        <span>ADMINISTRATOR</span>
      </span>
    );
  }
  if (role === "GROUP_ADMIN") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
        <span>GROUP_ADMIN</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
      <span>TRAVELER</span>
    </span>
  );
}
