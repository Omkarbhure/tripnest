"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Crown,
  Luggage,
  Search,
  RefreshCw,
  Server,
  Activity,
  UserCheck,
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
      // Refresh stats
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
    <div className="space-y-8 pb-16">
      {/* ── Admin Header Banner ── */}
      <div className="relative rounded-3xl overflow-hidden border border-purple-500/20 bg-gradient-to-r from-purple-900/30 via-slate-900/60 to-indigo-900/30 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-400/30 bg-purple-500/15 text-purple-200 text-xs font-bold uppercase tracking-wider mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Root Administrator Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Admin <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">Control Center</span>
            </h1>
            <p className="mt-1.5 text-sm text-white/60 max-w-xl">
              Platform administration, role assignments, system metrics, and destination catalogue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => loadAdminData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 bg-white/10 hover:bg-white/15 backdrop-blur-xl text-sm font-semibold text-white transition-all duration-150 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-purple-300 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Syncing..." : "Sync Database"}</span>
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live & Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="glass-banner glass-banner--error flex items-center justify-between gap-3 p-4 rounded-2xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="text-sm text-rose-200">{error}</span>
          </div>
          <button
            onClick={() => loadAdminData()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl space-y-3 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-3.5 bg-white/10 rounded w-1/2" />
                <div className="w-8 h-8 rounded-xl bg-white/10" />
              </div>
              <div className="h-8 bg-white/10 rounded w-1/3" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))
        ) : (
          <>
            <AdminStatCard
              title="Total Registered Users"
              value={stats?.totalUsers ?? users.length}
              icon={<Users className="w-5 h-5 text-purple-300" />}
              accent="from-purple-500 to-indigo-500"
              subtitle={`${stats?.usersByRole?.["ADMINISTRATOR"] ?? 1} Admin, ${stats?.usersByRole?.["TRAVELER"] ?? users.length - 1} Travelers`}
            />
            <AdminStatCard
              title="Active Destinations"
              value={stats?.totalDestinations ?? destinations.length}
              icon={<MapPin className="w-5 h-5 text-sky-300" />}
              accent="from-sky-500 to-cyan-500"
              subtitle="Seeded in PostgreSQL"
            />
            <AdminStatCard
              title="Total Trips Created"
              value={stats?.totalTrips ?? 0}
              icon={<Plane className="w-5 h-5 text-amber-300 -rotate-45" />}
              accent="from-amber-500 to-orange-500"
              subtitle="Across all users"
            />
            <AdminStatCard
              title="Total Expenses Logged"
              value={stats?.totalExpenses ?? 0}
              icon={<CreditCard className="w-5 h-5 text-emerald-300" />}
              accent="from-emerald-500 to-teal-500"
              subtitle={`₹${(stats?.totalSpentAmount ?? 0).toLocaleString()} recorded`}
            />
          </>
        )}
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
            activeTab === "users"
              ? "bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-lg shadow-purple-500/10"
              : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User & Role Management</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-white/10 text-white font-medium">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("destinations")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
            activeTab === "destinations"
              ? "bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-lg shadow-purple-500/10"
              : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Destinations Catalogue</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-white/10 text-white font-medium">
            {destinations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 ${
            activeTab === "system"
              ? "bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-lg shadow-purple-500/10"
              : "text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>System & Security</span>
        </button>
      </div>

      {/* ── Tab Content: Users Management ── */}
      {activeTab === "users" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Filter and search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user by name or email..."
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              <span className="text-xs text-white/50 font-medium">Filter:</span>
              {["ALL", "ADMINISTRATOR", "TRAVELER", "GROUP_ADMIN"].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    roleFilter === role
                      ? "bg-purple-500 text-white shadow-sm"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-white">
                <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase font-semibold text-white/50 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Current Role</th>
                    <th className="px-6 py-4 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-white/50">
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
                        <tr key={u.id} className="hover:bg-white/[0.04] transition-colors">
                          {/* User info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
                                {initials}
                              </div>
                              <div>
                                <p className="font-semibold text-white">{u.name}</p>
                                <p className="text-xs text-white/40">ID #{u.id}</p>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="px-6 py-4 text-white/80 font-mono text-xs">
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
                                className="rounded-xl border border-white/20 bg-[#0f172a] text-white px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 cursor-pointer"
                              >
                                <option value="TRAVELER">TRAVELER</option>
                                <option value="GROUP_ADMIN">GROUP_ADMIN</option>
                                <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                              </select>
                              {updatingUserId === u.id && (
                                <svg className="animate-spin h-4 w-4 text-purple-400" viewBox="0 0 24 24" fill="none">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              <div className="relative h-44 w-full bg-slate-800">
                <Image
                  src={dest.imageUrl}
                  alt={dest.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight drop-shadow">{dest.name}</h3>
                    <p className="text-xs text-orange-300 font-medium">
                      {dest.city}, {dest.country}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur text-white border border-white/20">
                    ID #{dest.id}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-white/70 line-clamp-3 leading-relaxed">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              <span>Role-Based Access Control (RBAC)</span>
            </h3>
            <div className="space-y-3 text-xs text-white/70">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="font-semibold text-purple-300">ADMINISTRATOR</span>
                <span>Full platform control, user roles, stats & seed data</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="font-semibold text-emerald-300">GROUP_ADMIN</span>
                <span>Group trips management & itinerary collaboration</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="font-semibold text-sky-300">TRAVELER</span>
                <span>Personal trips, itineraries, weather search & expense tracking</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-sky-400" />
              <span>Server & Integrations</span>
            </h3>
            <div className="space-y-3 text-xs text-white/70">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>Backend Framework</span>
                <span className="font-mono text-white">Spring Boot 4.1.0 / Java 22</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>Database</span>
                <span className="font-mono text-white">PostgreSQL 18.4 (Port 5432)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>Weather Engine</span>
                <span className="font-mono text-white">OpenWeather API v2.5</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>Location Geocoding</span>
                <span className="font-mono text-white">OpenStreetMap / Nominatim</span>
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
  accent,
  subtitle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  subtitle?: string;
}) {
  return (
    <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 sm:p-6 overflow-hidden shadow-lg hover:-translate-y-0.5 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider font-semibold text-white/50">{title}</span>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${accent} flex items-center justify-center text-lg shadow-md`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums">
          {value.toLocaleString()}
        </p>
        {subtitle && <p className="mt-1 text-xs text-white/50 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "ADMINISTRATOR") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-400/40">
        <Shield className="w-3.5 h-3.5 text-purple-300" />
        <span>ADMINISTRATOR</span>
      </span>
    );
  }
  if (role === "GROUP_ADMIN") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
        <Crown className="w-3.5 h-3.5 text-emerald-300" />
        <span>GROUP_ADMIN</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-400/40">
      <Luggage className="w-3.5 h-3.5 text-sky-300" />
      <span>TRAVELER</span>
    </span>
  );
}
