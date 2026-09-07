"use client";

import { useEffect, useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import ActivitySection from "@/components/ActivitySection";
import BudgetExpenseSection from "@/components/BudgetExpenseSection";
import TripMembersSection from "@/components/TripMembersSection";
import { getTripById, deleteTrip } from "@/lib/tripApi";
import { getItineraries, createItinerary, updateItinerary, deleteItinerary } from "@/lib/itineraryApi";
import { TripResponse, ItineraryResponse } from "@/lib/types";
import FadeIn from "@/components/ui/FadeIn";
import { StaggerList, StaggerItem } from "@/components/ui/StaggerList";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import {
  FileText,
  Calendar,
  Plus,
  X,
  AlertTriangle,
  MapPin,
  Pencil,
  Trash2,
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

function TripDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const { toasts, addToast, removeToast } = useToast();

  const [trip, setTrip] = useState<TripResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Itinerary State
  const [itineraries, setItineraries] = useState<ItineraryResponse[]>([]);
  const [showAddDayForm, setShowAddDayForm] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState("");
  const [dayNotes, setDayNotes] = useState("");
  const [addingDay, setAddingDay] = useState(false);
  const [itineraryError, setItineraryError] = useState("");

  // Edit Day State
  const [editingDayId, setEditingDayId] = useState<number | null>(null);
  const [editDayDate, setEditDayDate] = useState("");
  const [editDayNotes, setEditDayNotes] = useState("");
  const [updatingDay, setUpdatingDay] = useState(false);

  // Day Filter State ('all' or specific day ID)
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | "all">("all");

  useEffect(() => {
    async function load() {
      try {
        const [tripData, itin] = await Promise.all([
          getTripById(id),
          getItineraries(id),
        ]);
        setTrip(tripData);
        // Sort chronologically
        const sortedItin = [...itin].sort(
          (a, b) => new Date(a.dayDate).getTime() - new Date(b.dayDate).getTime()
        );
        setItineraries(sortedItin);
      } catch {
        setError("Unable to load trip details.");
      } finally {
        setLoading(false);
      }
    }
    if (!isNaN(id)) load();
  }, [id]);

  // Open Add Day Form with suggested date
  function handleOpenAddDay() {
    let nextDateStr = new Date().toISOString().split("T")[0];

    if (itineraries.length > 0) {
      // Find the last date and add 1 day
      const lastDay = itineraries[itineraries.length - 1];
      const nextDate = new Date(lastDay.dayDate + "T00:00:00");
      nextDate.setDate(nextDate.getDate() + 1);
      nextDateStr = nextDate.toISOString().split("T")[0];
    } else if (trip?.startDate) {
      nextDateStr = trip.startDate;
    }

    setSelectedDayDate(nextDateStr);
    setDayNotes("");
    setItineraryError("");
    setShowAddDayForm(true);
  }

  async function handleAddDaySubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedDayDate) {
      setItineraryError("Please select a date for this day.");
      return;
    }

    try {
      setAddingDay(true);
      setItineraryError("");
      const newDay = await createItinerary(id, selectedDayDate, dayNotes.trim() || undefined);
      setItineraries((prev) => {
        const updated = [...prev, newDay];
        return updated.sort((a, b) => new Date(a.dayDate).getTime() - new Date(b.dayDate).getTime());
      });
      setShowAddDayForm(false);
      setSelectedDayFilter(newDay.id);
      addToast("Day added to itinerary", "success");
    } catch (err: any) {
      setItineraryError(err?.response?.data?.message || err?.message || "Unable to add day. Please try again.");
    } finally {
      setAddingDay(false);
    }
  }

  function startEditDay(day: ItineraryResponse) {
    setEditingDayId(day.id);
    setEditDayDate(day.dayDate);
    setEditDayNotes(day.notes || "");
  }

  async function handleSaveEditDay(e: FormEvent, dayId: number) {
    e.preventDefault();
    if (!editDayDate) return;

    try {
      setUpdatingDay(true);
      const updated = await updateItinerary(id, dayId, editDayDate, editDayNotes.trim() || undefined);
      setItineraries((prev) => {
        const next = prev.map((d) => (d.id === dayId ? updated : d));
        return next.sort((a, b) => new Date(a.dayDate).getTime() - new Date(b.dayDate).getTime());
      });
      setEditingDayId(null);
      addToast("Itinerary day updated", "success");
    } catch (err: any) {
      addToast(err?.response?.data?.message || "Failed to update day.", "error");
    } finally {
      setUpdatingDay(false);
    }
  }

  async function handleDeleteDay(dayId: number, dayNumber: number) {
    if (!confirm(`Delete Day ${dayNumber} and all its activities?`)) return;

    try {
      await deleteItinerary(id, dayId);
      setItineraries((prev) => prev.filter((d) => d.id !== dayId));
      if (selectedDayFilter === dayId) {
        setSelectedDayFilter("all");
      }
      addToast(`Day ${dayNumber} removed`, "info");
    } catch (err: any) {
      addToast(err?.response?.data?.message || "Failed to delete day.", "error");
    }
  }

  async function handleDeleteTrip() {
    if (!confirm("Delete this trip and all its data? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteTrip(id);
      addToast("Trip deleted", "info");
      router.push("/trips");
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete trip. Only the Trip Owner or Group Admin can delete the trip.");
      setDeleting(false);
    }
  }

  const displayedItineraries =
    selectedDayFilter === "all"
      ? itineraries
      : itineraries.filter((d) => d.id === selectedDayFilter);

  if (loading) return (
    <div className="glass-canvas min-h-screen">
      <Orbs />
      <div className="glass-grain" />
      <Navbar backHref="/trips" backLabel="My Trips" />
      <div className="glass-content relative max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-orange-400 border-t-transparent mx-auto mb-4" />
        <p className="text-white/60 text-sm">Loading trip details…</p>
      </div>
    </div>
  );

  if (error || !trip) return (
    <div className="glass-canvas min-h-screen">
      <Orbs />
      <div className="glass-grain" />
      <Navbar backHref="/trips" backLabel="My Trips" />
      <div className="glass-content relative max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="glass-card p-12">
          <p className="text-red-400 mb-6 text-sm">{error ?? "Trip not found."}</p>
          <Link
            href="/trips"
            className="glass-btn-primary inline-flex items-center justify-center px-6 py-3"
          >
            Back to My Trips
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="glass-canvas min-h-screen">
      <Orbs />
      <div className="glass-grain" />
      <Navbar backHref="/trips" backLabel="My Trips" />

      <FadeIn>
        <main className="glass-content relative max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

          {/* Title & Top Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <span className={STATUS_PILL[trip.status] ?? "glass-pill glass-pill--default"}>
                {trip.status}
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2 leading-snug">{trip.title}</h1>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href={`/trips/${id}/edit`}
                className="glass-btn-ghost px-4 py-2 text-sm"
              >
                Edit
              </Link>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleDeleteTrip} disabled={deleting}
                className="glass-btn-danger px-4 py-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? "Deleting…" : "Delete"}
              </motion.button>
            </div>
          </div>

          {/* Trip Overview Card */}
          <div className="glass-card p-7 sm:p-8">
            <div className="glass-icon-chip mb-5">
              <FileText className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-white/90">Trip Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <InfoRow label="Destination" value={trip.destinationName ?? "Not specified"} />
              <InfoRow label="Owner" value={trip.ownerName} />
              <InfoRow label="Start Date" value={trip.startDate ?? "Not specified"} />
              <InfoRow label="End Date" value={trip.endDate ?? "Not specified"} />
              <InfoRow label="Budget" value={trip.budget != null ? `₹${trip.budget.toLocaleString()}` : "Not specified"} />
              <InfoRow label="Created" value={new Date(trip.createdAt).toLocaleDateString()} />
            </div>
            {trip.description && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="glass-label mb-2">Description</p>
                <p className="text-white/80 leading-relaxed text-sm">{trip.description}</p>
              </div>
            )}
          </div>

          {/* Group Collaboration / Members Section */}
          <TripMembersSection tripId={id} ownerName={trip.ownerName} />

          {/* Budget & Expense Tracker */}
          <BudgetExpenseSection tripId={id} />

          {/* ============================================================ */}
          {/* DAYWISE ITINERARY & ACTIVITIES */}
          {/* ============================================================ */}
          <div className="glass-card p-7 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="glass-icon-chip">
                <Calendar className="w-5 h-5 text-orange-400" />
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Daywise Itinerary</h2>
                  <p className="text-xs text-white/50 mt-0.5">
                    {itineraries.length === 0
                      ? "No days planned yet."
                      : `${itineraries.length} day${itineraries.length > 1 ? "s" : ""} scheduled.`}
                  </p>
                </div>
              </div>

              {!showAddDayForm && (
                <button
                  onClick={handleOpenAddDay}
                  className="glass-btn-primary px-5 py-2.5 text-sm shrink-0 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Day</span>
                </button>
              )}
            </div>

            {/* Expandable Add Day Form with Date Picker */}
            <AnimatePresence>
              {showAddDayForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={handleAddDaySubmit}
                    className="rounded-2xl border border-orange-500/30 bg-gradient-to-b from-orange-500/10 via-amber-500/5 to-white/[0.02] p-5 sm:p-6 backdrop-blur-xl space-y-4 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-400" />
                        <h3 className="text-sm font-semibold text-white">
                          Select Date & Plan Itinerary Day
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddDayForm(false)}
                        className="text-white/50 hover:text-white text-sm"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="glass-label mb-1.5">
                          Select Date <span className="text-orange-400">*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={selectedDayDate}
                          min={trip.startDate || undefined}
                          max={trip.endDate || undefined}
                          onChange={(e) => setSelectedDayDate(e.target.value)}
                          className="glass-input text-sm"
                        />
                        {trip.startDate && trip.endDate && (
                          <p className="text-[10px] text-white/40 mt-1">
                            Trip range: {trip.startDate} to {trip.endDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="glass-label mb-1.5">
                          Day Theme / Notes (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Old Goa Heritage Walk & Sunset Cruise"
                          value={dayNotes}
                          onChange={(e) => setDayNotes(e.target.value)}
                          className="glass-input text-sm"
                        />
                      </div>
                    </div>

                    {itineraryError && (
                      <div className="glass-banner glass-banner--error text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{itineraryError}</span>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddDayForm(false)}
                        disabled={addingDay}
                        className="glass-btn-ghost px-4 py-2 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingDay || !selectedDayDate}
                        className="glass-btn-primary px-6 py-2 text-xs font-semibold disabled:opacity-50"
                      >
                        {addingDay ? "Adding…" : "Save Itinerary Day"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Date / Day Selection Filter Pills */}
            {itineraries.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 border-b border-white/10 no-scrollbar">
                <button
                  onClick={() => setSelectedDayFilter("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all duration-200 ${
                    selectedDayFilter === "all"
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                      : "bg-white/[0.04] text-white/60 hover:text-white border border-white/10"
                  }`}
                >
                  All Days ({itineraries.length})
                </button>

                {itineraries.map((day, idx) => {
                  const dayDateObj = new Date(day.dayDate + "T00:00:00");
                  const formattedShort = dayDateObj.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                  });
                  const isSelected = selectedDayFilter === day.id;

                  return (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDayFilter(day.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all duration-200 flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                          : "bg-white/[0.04] text-white/60 hover:text-white border border-white/10"
                      }`}
                    >
                      <span>Day {idx + 1}</span>
                      <span className="text-[11px] opacity-75 font-normal">({formattedShort})</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {itineraries.length === 0 && !showAddDayForm && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center space-y-3">
                <MapPin className="w-8 h-8 text-orange-400/80 mx-auto" />
                <h3 className="text-sm font-semibold text-white">No days scheduled yet</h3>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  Click &ldquo;+ Add Day&rdquo; to select a date and organize activities day by day.
                </p>
                <button
                  onClick={handleOpenAddDay}
                  className="glass-btn-primary px-6 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5 mt-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Plan First Day</span>
                </button>
              </div>
            )}

            {/* Daywise Itinerary List */}
            {displayedItineraries.length > 0 && (
              <StaggerList className="space-y-5">
                {displayedItineraries.map((day) => {
                  // Find 1-based index in full sorted list
                  const fullIndex = itineraries.findIndex((d) => d.id === day.id);
                  const isEditingThisDay = editingDayId === day.id;

                  return (
                    <StaggerItem key={day.id}>
                      <div className="glass-card-md overflow-hidden border border-white/15 shadow-xl">
                        {/* Day Card Header with Date Info and Actions */}
                        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
                                Day {fullIndex + 1}
                              </span>
                              <span className="text-xs text-white/40">&bull;</span>
                              <span className="text-sm font-bold text-white">
                                {new Date(day.dayDate + "T00:00:00").toLocaleDateString("en-IN", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            {day.notes && !isEditingThisDay && (
                              <p className="text-xs text-white/70 mt-1 font-medium italic">
                                &ldquo;{day.notes}&rdquo;
                              </p>
                            )}
                          </div>

                          {/* Edit / Delete Day Buttons */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <button
                              onClick={() => startEditDay(day)}
                              title="Change date or notes"
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white/70 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors inline-flex items-center gap-1"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Edit Date</span>
                            </button>
                            <button
                              onClick={() => handleDeleteDay(day.id, fullIndex + 1)}
                              title="Delete this day"
                              className="p-1.5 rounded-lg text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Edit Form */}
                        {isEditingThisDay && (
                          <form
                            onSubmit={(e) => handleSaveEditDay(e, day.id)}
                            className="p-4 bg-[#0a0f1d]/90 border-b border-white/10 space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="glass-label mb-1">Select New Date</label>
                                <input
                                  type="date"
                                  required
                                  value={editDayDate}
                                  onChange={(e) => setEditDayDate(e.target.value)}
                                  className="glass-input text-xs"
                                />
                              </div>
                              <div>
                                <label className="glass-label mb-1">Day Notes / Theme</label>
                                <input
                                  type="text"
                                  value={editDayNotes}
                                  onChange={(e) => setEditDayNotes(e.target.value)}
                                  placeholder="e.g. Scuba diving & dinner"
                                  className="glass-input text-xs"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingDayId(null)}
                                className="glass-btn-ghost px-3 py-1.5 text-xs font-semibold"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={updatingDay}
                                className="glass-btn-primary px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
                              >
                                {updatingDay ? "Saving…" : "Update Day"}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Activities Section for this Day */}
                        <div className="px-5 py-4">
                          <ActivitySection itineraryId={day.id} />
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerList>
            )}
          </div>
        </main>
      </FadeIn>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="glass-label">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function TripDetailPage() {
  return <ProtectedRoute><TripDetailContent /></ProtectedRoute>;
}
