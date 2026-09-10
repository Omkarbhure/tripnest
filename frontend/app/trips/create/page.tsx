"use client";

import { FormEvent, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { createTrip } from "@/lib/tripApi";
import { Destination } from "@/lib/types";
import apiClient from "@/lib/apiClient";
import FadeIn from "@/components/ui/FadeIn";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";

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

function CreateTripContent() {
  const router = useRouter();
  const { toasts, addToast, removeToast } = useToast();

  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("PLANNED");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [destQuery, setDestQuery] = useState("");
  const [destResults, setDestResults] = useState<Destination[]>([]);
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [destSearching, setDestSearching] = useState(false);
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    apiClient.get<Destination[]>("/api/destinations").then((r) => {
      setAllDestinations(r.data);
      const destinationId = new URLSearchParams(window.location.search).get("destinationId");
      const destination = r.data.find((item) => item.id === Number(destinationId));
      if (destination) setSelectedDest(destination);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!destQuery.trim()) { setDestResults([]); return; }
    debounceRef.current = setTimeout(() => {
      setDestSearching(true);
      const q = destQuery.toLowerCase();
      setDestResults(allDestinations.filter((d) =>
        d.name.toLowerCase().includes(q) || d.city?.toLowerCase().includes(q) || d.country?.toLowerCase().includes(q)
      ));
      setDestSearching(false);
    }, 300);
  }, [destQuery, allDestinations]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Trip title is required."); return; }
    if (!selectedDest) { setError("Destination is required."); return; }
    if (!startDate) { setError("Start date is required."); return; }
    if (!endDate) { setError("End date is required."); return; }
    if (endDate < startDate) { setError("End date cannot be before start date."); return; }
    try {
      setLoading(true); setError("");
      const trip = await createTrip({
        title: title.trim(),
        destinationId: selectedDest.id,
        startDate,
        endDate,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(budget ? { budget: Number(budget) } : {}),
        status,
      });
      addToast("Trip created successfully", "success");
      router.push(`/trips/${trip.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create trip.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-canvas min-h-screen">
      <Orbs />
      <div className="glass-grain" />
      <Navbar backHref="/trips" backLabel="My Trips" />

      <main className="glass-content relative max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-7">
          <h1 className="glass-h1">Create New Trip</h1>
          <p className="glass-sub mt-1.5">Plan your next adventure.</p>
        </div>

        <FadeIn direction="up">
          <form onSubmit={handleSubmit} className="glass-card p-7 sm:p-8 space-y-6">
            {error && (
              <div className="glass-banner glass-banner--error">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="glass-label">Trip Title *</label>
              <input
                type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                placeholder="e.g. Goa Weekend Escape"
                className="glass-input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="glass-label mb-0">Destination *</label>
                <Link
                  href="/destinations"
                  className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Explore Destinations</span>
                </Link>
              </div>
              {selectedDest ? (
                <div className="flex items-center justify-between rounded-xl border border-orange-400/40 bg-orange-500/10 px-4 py-3 backdrop-blur-sm">
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedDest.name}</p>
                    <p className="text-xs text-white/60 mt-0.5">
                      {selectedDest.city}{selectedDest.city && selectedDest.country ? ", " : ""}{selectedDest.country}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedDest(null); setDestQuery(""); }}
                    className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text" value={destQuery} onChange={(e) => setDestQuery(e.target.value)}
                    placeholder="Search destinations…"
                    className="glass-input"
                  />
                  {destSearching && <p className="text-xs text-white/40 mt-1">Searching…</p>}
                  {destResults.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-[#0f172a]/95 backdrop-blur-2xl shadow-lg max-h-52 overflow-y-auto divide-y divide-white/5">
                      {destResults.map((d) => (
                        <li key={d.id}>
                          <button
                            type="button"
                            onClick={() => { setSelectedDest(d); setDestQuery(""); setDestResults([]); }}
                            className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors duration-100"
                          >
                            <p className="text-sm font-semibold text-white">{d.name}</p>
                            <p className="text-xs text-white/60 mt-0.5">
                              {d.city}{d.city && d.country ? ", " : ""}{d.country}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {destQuery.trim() && !destSearching && destResults.length === 0 && (
                    <p className="text-xs text-white/40 mt-1.5">No matching destinations found in the database.</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="glass-label">Start Date *</label>
                <input
                  type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required
                  className="glass-input"
                />
              </div>
              <div>
                <label className="glass-label">End Date *</label>
                <input
                  type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} required
                  className="glass-input"
                />
              </div>
            </div>

            <div>
              <label className="glass-label">Description</label>
              <textarea
                value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                placeholder="Describe your trip…"
                className="glass-input resize-none"
              />
            </div>

            <div>
              <label className="glass-label">Budget (₹)</label>
              <input
                type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 25000"
                className="glass-input"
              />
            </div>

            <div>
              <label className="glass-label">Status</label>
              <select
                value={status} onChange={(e) => setStatus(e.target.value)}
                className="glass-input bg-[#0f172a]/60"
              >
                <option value="PLANNED">Planned</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button" onClick={() => router.push("/trips")}
                className="glass-btn-ghost px-5 py-2.5"
              >
                Cancel
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit" disabled={loading}
                className="glass-btn-primary px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating…" : "Create Trip"}
              </motion.button>
            </div>
          </form>
        </FadeIn>
      </main>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

export default function CreateTripPage() {
  return <ProtectedRoute><CreateTripContent /></ProtectedRoute>;
}
