"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getActivities, createActivity, updateActivity, deleteActivity } from "@/lib/activityApi";
import { ActivityResponse, ActivityRequest } from "@/lib/types";
import {
  Landmark,
  Train,
  Hotel,
  Utensils,
  Mountain,
  ShoppingBag,
  MapPin,
  Clock,
  Plus,
  AlertTriangle,
  Pencil,
  Trash2,
  RefreshCw,
  Compass,
} from "lucide-react";

const ACTIVITY_TYPES = ["SIGHTSEEING", "TRANSPORTATION", "ACCOMMODATION", "DINING", "ADVENTURE", "SHOPPING", "OTHER"];

function getActivityIcon(type?: string | null) {
  switch (type) {
    case "SIGHTSEEING":
      return <Landmark className="w-4 h-4 text-amber-400" />;
    case "TRANSPORTATION":
      return <Train className="w-4 h-4 text-sky-400" />;
    case "ACCOMMODATION":
      return <Hotel className="w-4 h-4 text-purple-400" />;
    case "DINING":
      return <Utensils className="w-4 h-4 text-orange-400" />;
    case "ADVENTURE":
      return <Mountain className="w-4 h-4 text-emerald-400" />;
    case "SHOPPING":
      return <ShoppingBag className="w-4 h-4 text-pink-400" />;
    default:
      return <MapPin className="w-4 h-4 text-orange-400" />;
  }
}

const emptyForm = (): ActivityRequest => ({ title: "", description: "", startTime: "", endTime: "", location: "", type: "" });

export default function ActivitySection({ itineraryId }: { itineraryId: number }) {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ActivityRequest>(emptyForm());

  useEffect(() => { load(); }, [itineraryId]);

  async function load() {
    try {
      setLoading(true); setError("");
      setActivities(await getActivities(itineraryId));
    } catch { setError("Unable to load activities."); }
    finally { setLoading(false); }
  }

  function startAdd() { setEditingId(null); setForm(emptyForm()); setShowForm(true); }

  function startEdit(a: ActivityResponse) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      description: a.description ?? "",
      startTime: a.startTime ?? "",
      endTime: a.endTime ?? "",
      location: a.location ?? "",
      type: a.type ?? "",
    });
    setShowForm(true);
  }

  function cancel() { setShowForm(false); setEditingId(null); setForm(emptyForm()); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    try {
      setSaving(true); setError("");
      const payload: ActivityRequest = {
        title: form.title.trim(),
        description: form.description || undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        location: form.location || undefined,
        type: form.type || undefined,
      };
      if (editingId !== null) {
        const updated = await updateActivity(itineraryId, editingId, payload);
        setActivities((prev) => prev.map((a) => a.id === editingId ? updated : a));
      } else {
        const created = await createActivity(itineraryId, payload);
        setActivities((prev) => [...prev, created]);
      }
      cancel();
    } catch { setError("Unable to save activity."); }
    finally { setSaving(false); }
  }

  async function handleDelete(activityId: number) {
    if (!confirm("Delete this activity?")) return;
    try {
      await deleteActivity(itineraryId, activityId);
      setActivities((prev) => prev.filter((a) => a.id !== activityId));
    } catch { alert("Unable to delete activity."); }
  }

  function field(k: keyof ActivityRequest, val: string) { setForm((f) => ({ ...f, [k]: val })); }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white/80">Activities</h4>
        {!showForm && (
          <button
            onClick={startAdd}
            className="glass-btn-primary px-3 py-1.5 text-xs inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Activity</span>
          </button>
        )}
      </div>

      {error && (
        <div className="glass-banner glass-banner--error text-xs mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="space-y-2.5 ml-2 mt-2">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card-md p-3.5 flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-white/10 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-white/10 rounded w-1/3" />
                <div className="h-2.5 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 glass-form-sheet space-y-3 p-4"
        >
          <p className="glass-label">
            {editingId !== null ? "Edit Activity" : "New Activity"}
          </p>

          <div>
            <label className="glass-label">Title *</label>
            <input
              type="text" value={form.title} onChange={(e) => field("title", e.target.value)} required
              placeholder="e.g. Visit Colosseum"
              className="glass-input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="glass-label">Start Time</label>
              <input
                type="time" value={form.startTime} onChange={(e) => field("startTime", e.target.value)}
                className="glass-input"
              />
            </div>
            <div>
              <label className="glass-label">End Time</label>
              <input
                type="time" value={form.endTime} onChange={(e) => field("endTime", e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div>
            <label className="glass-label">Location</label>
            <input
              type="text" value={form.location} onChange={(e) => field("location", e.target.value)}
              placeholder="e.g. Rome, Italy"
              className="glass-input"
            />
          </div>

          <div>
            <label className="glass-label">Type</label>
            <select
              value={form.type} onChange={(e) => field("type", e.target.value)}
              className="glass-input bg-[#0f172a]/40"
            >
              <option value="">Select type…</option>
              {ACTIVITY_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="glass-label">Description</label>
            <textarea
              value={form.description} onChange={(e) => field("description", e.target.value)} rows={2}
              placeholder="Optional notes…"
              className="glass-input resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit" disabled={saving}
              className="glass-btn-primary px-4 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : editingId !== null ? "Update" : "Save Activity"}
            </button>
            <button
              type="button" onClick={cancel}
              className="glass-btn-ghost px-4 py-2 text-xs"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {!loading && activities.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center my-2">
          <Compass className="w-6 h-6 text-white/30 mx-auto mb-1.5" />
          <p className="text-xs font-semibold text-white/70">No activities scheduled yet</p>
          <p className="text-[11px] text-white/40 mt-0.5 mb-2.5">Plan sights, dining, or transportation for this day.</p>
          <button
            onClick={startAdd}
            className="glass-btn-ghost px-3 py-1 text-xs inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            <span>Add First Activity</span>
          </button>
        </div>
      )}

      {activities.length > 0 && (
        <div className="relative pl-3 border-l border-white/10 space-y-3 ml-2 mt-2">
          <AnimatePresence>
            {activities.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="relative glass-card-md px-4 py-3.5 flex items-start justify-between gap-3 group hover:border-white/20 transition-all"
              >
                {/* Timeline node dot */}
                <div className="absolute -left-[19px] top-4 w-3 h-3 rounded-full bg-orange-400 ring-4 ring-[#0f172a] shadow-sm" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
                      {getActivityIcon(a.type)}
                    </div>
                    <span className="font-bold text-sm text-white group-hover:text-orange-300 transition-colors">{a.title}</span>
                    {a.type && (
                      <span className="text-[11px] bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/30 px-2 py-0.5 rounded-full font-semibold">
                        {a.type}
                      </span>
                    )}
                  </div>
                  {(a.startTime || a.endTime) && (
                    <p className="text-xs text-orange-200/80 font-mono mt-1.5 inline-flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                      <Clock className="w-3.5 h-3.5 text-orange-300" />
                      <span>{a.startTime ?? "--:--"} – {a.endTime ?? "--:--"}</span>
                    </p>
                  )}
                  {a.location && (
                    <p className="text-xs text-white/60 mt-1.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      <span>{a.location}</span>
                    </p>
                  )}
                  {a.description && <p className="text-xs text-white/70 mt-1.5 leading-relaxed">{a.description}</p>}
                </div>
                <div className="flex gap-1.5 shrink-0 pt-0.5">
                  <button
                    onClick={() => startEdit(a)}
                    className="glass-btn-ghost px-2.5 py-1 text-xs inline-flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="glass-btn-danger px-2.5 py-1 text-xs inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
