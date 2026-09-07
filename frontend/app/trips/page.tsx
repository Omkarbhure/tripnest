"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { tripApi } from "@/lib/api";
import {
  TripResponse,
  TripSearchResultResponse,
  TripJoinResponse,
} from "@/lib/types";
import {
  searchTrips,
  requestToJoinTrip,
  getMyJoinRequests,
} from "@/lib/tripMemberApi";
import FadeIn from "@/components/ui/FadeIn";
import { StaggerList, StaggerItem } from "@/components/ui/StaggerList";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import {
  Search,
  Plane,
  Palmtree,
  MapPin,
  Calendar,
  Wallet,
  Clock,
  Users,
  Inbox,
  X,
  ArrowRight,
} from "lucide-react";

const STATUS_PILL: Record<string, string> = {
  PLANNED: "glass-pill glass-pill--planned",
  ONGOING: "glass-pill glass-pill--ongoing",
  COMPLETED: "glass-pill glass-pill--completed",
  CANCELLED: "glass-pill glass-pill--cancelled",
};

function Orbs() {
  return (
    <div className="glass-orbs pointer-events-none">
      <motion.div
        className="glass-orb glass-orb--orange"
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="glass-orb glass-orb--violet"
        animate={{ x: [0, -25, 0], y: [0, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="glass-orb glass-orb--cyan"
        animate={{ x: [0, 20, 0], y: [0, 25, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function TripsContent() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  // Active View Tab: 'my-trips' | 'explore' | 'my-requests'
  const [activeTab, setActiveTab] = useState<"my-trips" | "explore" | "my-requests">("my-trips");

  // My Trips State
  const [trips, setTrips] = useState<TripResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Search & Explore State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TripSearchResultResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchSearched, setSearchSearched] = useState(false);

  // Join Request Modal
  const [selectedTripToJoin, setSelectedTripToJoin] = useState<TripSearchResultResponse | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [submittingJoin, setSubmittingJoin] = useState(false);

  // My Join Requests
  const [myRequests, setMyRequests] = useState<TripJoinResponse[]>([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (activeTab === "explore" && searchResults.length === 0 && !searchSearched) {
      handleSearchTrips("");
    } else if (activeTab === "my-requests") {
      loadMyRequests();
    }
  }, [activeTab]);

  async function loadTrips() {
    try {
      setLoading(true);
      setError("");
      setTrips(await tripApi.getAll());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load trips.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMyRequests() {
    try {
      setLoadingMyRequests(true);
      const reqs = await getMyJoinRequests();
      setMyRequests(reqs);
    } catch {
      // Ignore
    } finally {
      setLoadingMyRequests(false);
    }
  }

  async function handleSearchTrips(query: string) {
    try {
      setSearching(true);
      const res = await searchTrips(query);
      setSearchResults(res);
      setSearchSearched(true);
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Search failed.", "error");
    } finally {
      setSearching(false);
    }
  }

  async function handleJoinSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedTripToJoin) return;

    setSubmittingJoin(true);
    try {
      await requestToJoinTrip(selectedTripToJoin.id, {
        message: joinMessage.trim() || undefined,
      });

      addToast(`Join request sent to the admin of "${selectedTripToJoin.title}"!`, "success");

      // Update the userRelationship in local search results
      setSearchResults((prev) =>
        prev.map((t) =>
          t.id === selectedTripToJoin.id
            ? { ...t, userRelationship: "REQUEST_PENDING" }
            : t
        )
      );

      setSelectedTripToJoin(null);
      setJoinMessage("");
    } catch (err: any) {
      addToast(err?.response?.data?.message || err?.message || "Failed to send join request.", "error");
    } finally {
      setSubmittingJoin(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await tripApi.delete(id);
      setTrips((prev) => prev.filter((t) => t.id !== id));
      addToast("Trip deleted", "success");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Failed to delete trip. Only the owner or admin can delete.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="glass-canvas min-h-screen">
      <Orbs />
      <div className="glass-grain" />
      <Navbar />

      <main className="glass-content relative max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header with Navigation Tabs & Action Button */}
        <FadeIn direction="down">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="glass-h1">Trip Management</h1>
              <p className="glass-sub mt-1">Plan, collaborate, and travel together seamlessly.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Navigation Segment Tabs */}
              <div className="flex items-center p-1 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl">
                <button
                  onClick={() => setActiveTab("my-trips")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    activeTab === "my-trips"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  My Trips
                </button>
                <button
                  onClick={() => setActiveTab("explore")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 inline-flex items-center gap-1.5 ${
                    activeTab === "explore"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Find & Join Trips</span>
                </button>
                <button
                  onClick={() => setActiveTab("my-requests")}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    activeTab === "my-requests"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  My Requests
                </button>
              </div>

              {/* Create Trip CTA */}
              <Link
                href="/trips/create"
                className="glass-btn-primary px-5 py-2.5 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5"
              >
                <Plane className="w-4 h-4" />
                <span>Create Trip</span>
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* ============================================================ */}
        {/* TAB 1: MY TRIPS */}
        {/* ============================================================ */}
        {activeTab === "my-trips" && (
          <div className="space-y-8">
            <FadeIn direction="up">
              <div className="relative h-64 sm:h-72 lg:h-80 overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
                <img
                  src="/trips-beach.avif"
                  alt="Tropical beach destination"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/95 via-[#0f172a]/60 to-[#0f172a]/25" />
                <div className="relative z-10 flex h-full max-w-md flex-col justify-center px-6 sm:px-8">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
                    Group & Solo Travel
                  </span>
                  <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                    Make room for somewhere beautiful.
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-white/70">
                    Invite friends, manage shared budgets, and explore curated itineraries.
                  </p>
                </div>
              </div>
            </FadeIn>

            {loading && (
              <div className="glass-card p-14 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-orange-400 border-t-transparent mx-auto mb-4" />
                <p className="text-white/60 text-sm">Loading your trips…</p>
              </div>
            )}

            {!loading && error && (
              <div className="glass-card p-14 text-center">
                <div className="glass-banner glass-banner--error mb-6 text-left">
                  <TripIcon name="warning" className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={loadTrips}
                  className="glass-btn-primary px-6 py-3"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && trips.length === 0 && (
              <div className="glass-card p-16 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center mx-auto mb-5">
                  <TripIcon name="plane" className="h-8 w-8 text-orange-200" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">No trips yet</h2>
                <p className="text-white/60 text-sm mb-8">
                  Start planning your first adventure or search for an existing group trip to join.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/trips/create"
                    className="glass-btn-primary inline-flex items-center justify-center px-7 py-3 text-sm font-semibold"
                  >
                    Create Your First Trip
                  </Link>
                  <button
                    onClick={() => setActiveTab("explore")}
                    className="glass-btn-outline px-6 py-3 text-sm font-semibold inline-flex items-center gap-1.5"
                  >
                    <Search className="w-4 h-4" />
                    <span>Browse Trips to Join</span>
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && trips.length > 0 && (
              <StaggerList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {trips.map((trip) => (
                  <StaggerItem key={trip.id}>
                    <div className="glass-card-md overflow-hidden flex flex-col h-full">
                      <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent">
                        <div className="flex items-center justify-between mb-2">
                          <span className={STATUS_PILL[trip.status] ?? "glass-pill glass-pill--default"}>
                            {trip.status}
                          </span>
                          <span className="text-xs text-white/40 font-medium">#{trip.id}</span>
                        </div>
                        <h2 className="text-base font-bold text-white truncate">{trip.title}</h2>
                      </div>

                      <div className="px-6 py-5 flex flex-col gap-3 flex-1">
                        <div className="space-y-1.5 text-sm">
                          <Row label="Destination" value={trip.destinationName ?? "Not specified"} />
                          <Row label="Owner" value={trip.ownerName} />
                          <Row label="Start" value={trip.startDate ?? "—"} />
                          <Row label="End" value={trip.endDate ?? "—"} />
                          <Row label="Budget" value={trip.budget != null ? `₹${trip.budget.toLocaleString()}` : "—"} />
                        </div>

                        {trip.description && (
                          <p className="text-sm text-white/60 line-clamp-2 leading-relaxed mt-1">
                            {trip.description}
                          </p>
                        )}

                        <div className="mt-auto pt-4 border-t border-white/10 flex gap-2">
                          <Link
                            href={`/trips/${trip.id}`}
                            className="glass-btn-primary flex-1 px-4 py-2 text-center text-xs font-semibold"
                          >
                            Open Details
                          </Link>
                          <Link
                            href={`/trips/${trip.id}/edit`}
                            className="glass-btn-ghost px-3 py-2 text-xs font-semibold"
                          >
                            Edit
                          </Link>
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDelete(trip.id)}
                            disabled={deletingId === trip.id}
                            className="glass-btn-danger px-3 py-2 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {deletingId === trip.id ? "…" : "Delete"}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerList>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: FIND & JOIN TRIPS */}
        {/* ============================================================ */}
        {activeTab === "explore" && (
          <div className="space-y-6">
            {/* Search Input Bar */}
            <div className="glass-card p-6 sm:p-7">
              <div className="max-w-2xl mx-auto space-y-3">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-white">Search Trips to Join</h2>
                  <p className="text-xs text-white/60 mt-1">
                    Search for trips by name and request to join the travel group.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchTrips(searchQuery);
                  }}
                  className="flex gap-2.5 pt-2"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search by trip title (e.g., Goa Vacation, Europe Trek)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="glass-input pl-10 text-sm"
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  </div>
                  <button
                    type="submit"
                    disabled={searching}
                    className="glass-btn-primary px-6 py-2.5 text-sm shrink-0 disabled:opacity-50"
                  >
                    {searching ? "Searching…" : "Search"}
                  </button>
                </form>
              </div>
            </div>

            {/* Search Results */}
            {searching ? (
              <div className="glass-card p-12 text-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-orange-400 border-t-transparent mx-auto mb-3" />
                <p className="text-xs text-white/50">Finding trips…</p>
              </div>
            ) : searchResults.length === 0 && searchSearched ? (
              <div className="glass-card p-12 text-center">
                <Palmtree className="w-10 h-10 text-orange-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-white">No trips found</h3>
                <p className="text-xs text-white/50 mt-1">
                  Try searching with different keywords or create a brand new trip!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {searchResults.map((trip) => {
                  const isMemberOrOwner =
                    trip.userRelationship === "OWNER" ||
                    trip.userRelationship === "GROUP_ADMIN" ||
                    trip.userRelationship === "MEMBER";
                  const isPending = trip.userRelationship === "REQUEST_PENDING";

                  return (
                    <div
                      key={trip.id}
                      className="glass-card-md overflow-hidden flex flex-col justify-between p-6 space-y-4 hover:border-white/25 transition-all duration-200"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={STATUS_PILL[trip.status] ?? "glass-pill glass-pill--default"}>
                            {trip.status}
                          </span>
                          <span className="text-xs text-white/40">Owner: {trip.ownerName}</span>
                        </div>
                        <h3 className="text-base font-bold text-white leading-snug">
                          {trip.title}
                        </h3>

                        <div className="mt-3 space-y-1 text-xs text-white/70">
                          {trip.destinationName && (
                            <p className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-orange-400" />
                              <span>{trip.destinationName}</span>
                            </p>
                          )}
                          <p className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-sky-400" />
                            <span>
                              {trip.startDate ? trip.startDate : "TBD"} &rarr;{" "}
                              {trip.endDate ? trip.endDate : "TBD"}
                            </span>
                          </p>
                          {trip.budget != null && (
                            <p className="flex items-center gap-1.5">
                              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Budget: ₹{trip.budget.toLocaleString()}</span>
                            </p>
                          )}
                        </div>

                        {trip.description && (
                          <p className="text-xs text-white/50 line-clamp-2 mt-3 leading-relaxed">
                            {trip.description}
                          </p>
                        )}
                      </div>

                      {/* Relationship / Action Button */}
                      <div className="pt-3 border-t border-white/10">
                        {isMemberOrOwner ? (
                          <Link
                            href={`/trips/${trip.id}`}
                            className="glass-btn-primary w-full py-2.5 text-center text-xs font-semibold block"
                          >
                            Joined &bull; Open Trip &rarr;
                          </Link>
                        ) : isPending ? (
                          <div className="w-full py-2.5 rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-300 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-300" />
                            <span>Join Request Pending</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedTripToJoin(trip)}
                            className="glass-btn-outline w-full py-2.5 text-center text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-500/20 hover:border-orange-400/40 hover:text-orange-200 transition-colors"
                          >
                            <Users className="w-3.5 h-3.5 text-orange-300" />
                            <span>Request to Join</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: MY JOIN REQUESTS */}
        {/* ============================================================ */}
        {activeTab === "my-requests" && (
          <div className="glass-card p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">My Join Requests</h2>
              <p className="text-xs text-white/60 mt-0.5">
                Track status of trips you requested to join. Once accepted by the admin, they appear in My Trips.
              </p>
            </div>

            {loadingMyRequests ? (
              <div className="py-12 text-center">
                <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-orange-400 border-t-transparent mx-auto mb-3" />
                <p className="text-xs text-white/50">Loading your requests…</p>
              </div>
            ) : myRequests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-10 text-center space-y-3">
                <Inbox className="w-10 h-10 text-white/30 mx-auto" />
                <p className="text-sm font-semibold text-white">No active requests sent</p>
                <p className="text-xs text-white/50">
                  Switch to &ldquo;Find & Join Trips&rdquo; to discover group trips and submit a request.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myRequests.map((req) => {
                  const isAccepted = req.status === "ACCEPTED";
                  const isPending = req.status === "PENDING";

                  return (
                    <div
                      key={req.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{req.tripTitle}</h3>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              isPending
                                ? "bg-amber-500/20 border-amber-400/30 text-amber-300"
                                : isAccepted
                                ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
                                : "bg-rose-500/20 border-rose-400/30 text-rose-300"
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        {req.message && (
                          <p className="text-xs text-white/70 italic mt-1 bg-white/[0.02] p-2 rounded-lg border border-white/5">
                            Note: &ldquo;{req.message}&rdquo;
                          </p>
                        )}
                        <p className="text-[10px] text-white/40 mt-1.5">
                          Sent on {new Date(req.createdAt).toLocaleDateString()}
                          {req.respondedAt && ` &bull; Responded on ${new Date(req.respondedAt).toLocaleDateString()}`}
                        </p>
                      </div>

                      {isAccepted && (
                        <Link
                          href={`/trips/${req.tripId}`}
                          className="glass-btn-primary px-4 py-2 text-xs font-semibold self-start sm:self-center shrink-0"
                        >
                          Go to Trip &rarr;
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* REQUEST TO JOIN MODAL */}
        {/* ============================================================ */}
        <AnimatePresence>
          {selectedTripToJoin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl border border-white/20 bg-[#0f172a]/95 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-orange-400" />
                    <h3 className="text-base font-bold text-white">
                      Request to Join Trip
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTripToJoin(null)}
                    className="text-white/40 hover:text-white text-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="rounded-2xl bg-white/[0.04] p-3.5 border border-white/10 text-xs text-white/80 space-y-1">
                  <p className="font-bold text-white text-sm">{selectedTripToJoin.title}</p>
                  <p>Organized by: <strong className="text-orange-300">{selectedTripToJoin.ownerName}</strong></p>
                  {selectedTripToJoin.destinationName && <p>Destination: {selectedTripToJoin.destinationName}</p>}
                </div>

                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <div>
                    <label className="glass-label mb-1.5">
                      Message to Group Admin (Optional)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Hi! I'd love to join your travel group for this adventure..."
                      value={joinMessage}
                      onChange={(e) => setJoinMessage(e.target.value)}
                      className="glass-input resize-none text-xs"
                    />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedTripToJoin(null)}
                      disabled={submittingJoin}
                      className="glass-btn-ghost flex-1 py-2.5 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingJoin}
                      className="glass-btn-primary flex-1 py-2.5 text-xs font-semibold disabled:opacity-50"
                    >
                      {submittingJoin ? "Sending…" : "Send Request"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/40 shrink-0">{label}</span>
      <span className="font-medium text-white text-right truncate">{value}</span>
    </div>
  );
}

function TripIcon({ name, className }: { name: "plane" | "warning"; className: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {name === "plane" ? (
        <path d="m3 11 18-7-7 18-2.5-8.5L3 11Zm8.5 2.5L21 4" />
      ) : (
        <><path d="m12 3 9 16H3L12 3Z" /><path d="M12 9v4M12 16h.01" /></>
      )}
    </svg>
  );
}

export default function TripsPage() {
  return <ProtectedRoute><TripsContent /></ProtectedRoute>;
}
