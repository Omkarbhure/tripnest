"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BudgetResponse, BudgetRequest,
  ExpenseResponse, ExpenseRequest,
  CategorySummary, RemainingBudgetResponse,
  EXPENSE_CATEGORIES,
} from "@/lib/types";
import apiClient from "@/lib/apiClient";
import { Chart, ArcElement, Tooltip, Legend, PieController, BarController, CategoryScale, LinearScale, BarElement } from "chart.js";
import { ToastContainer } from "@/components/ui/Toast";
import { useToast } from "@/hooks/useToast";
import {
  Wallet,
  Receipt,
  PieChart as PieChartIcon,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

Chart.register(ArcElement, Tooltip, Legend, PieController, BarController, CategoryScale, LinearScale, BarElement);

const CATEGORY_COLORS: Record<string, string> = {
  TRANSPORTATION: "#f97316",
  HOTEL:          "#3b82f6",
  FOOD:           "#22c55e",
  SHOPPING:       "#a855f7",
  ENTERTAINMENT:  "#ec4899",
  MISCELLANEOUS:  "#6b7280",
};

interface Props { tripId: number; }

export default function BudgetExpenseSection({ tripId }: Props) {
  const [budget, setBudget] = useState<BudgetResponse | null>(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [budgetForm, setBudgetForm] = useState<BudgetRequest>({ totalBudget: 0, currency: "INR" });
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetError, setBudgetError] = useState("");

  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [expenseForm, setExpenseForm] = useState<ExpenseRequest>(emptyExpenseForm());
  const [savingExpense, setSavingExpense] = useState(false);
  const [expenseError, setExpenseError] = useState("");

  const [summary, setSummary] = useState<CategorySummary[]>([]);
  const [remaining, setRemaining] = useState<RemainingBudgetResponse | null>(null);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const { toasts, addToast, removeToast } = useToast();

  const loadBudget = useCallback(async () => {
    setBudgetLoading(true); setBudgetError("");
    try {
      const res = await apiClient.get<BudgetResponse>(`/api/trips/${tripId}/budget`);
      setBudget(res.data);
      setBudgetForm({ totalBudget: res.data.totalBudget, currency: res.data.currency, notes: res.data.notes ?? "" });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "";
      if (!msg.includes("No budget found")) setBudgetError(msg || "Failed to load budget.");
    } finally {
      setBudgetLoading(false);
    }
  }, [tripId]);

  const loadExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const res = await apiClient.get<ExpenseResponse[]>(`/api/trips/${tripId}/expenses`);
      setExpenses(res.data);
    } catch { /* empty list */ }
    finally { setExpensesLoading(false); }
  }, [tripId]);

  const loadSummary = useCallback(async () => {
    try {
      const [sumRes, remRes] = await Promise.allSettled([
        apiClient.get<CategorySummary[]>(`/api/trips/${tripId}/expenses/summary`),
        apiClient.get<RemainingBudgetResponse>(`/api/trips/${tripId}/expenses/remaining`),
      ]);
      if (sumRes.status === "fulfilled") setSummary(sumRes.value.data);
      if (remRes.status === "fulfilled") setRemaining(remRes.value.data);
    } catch { /* ignore */ }
  }, [tripId]);

  useEffect(() => {
    loadBudget();
    loadExpenses();
  }, [loadBudget, loadExpenses]);

  useEffect(() => { loadSummary(); }, [expenses, loadSummary]);

  useEffect(() => {
    if (!chartRef.current || summary.length === 0) return;
    if (chartInstance.current) { chartInstance.current.destroy(); }

    chartInstance.current = new Chart(chartRef.current, {
      type: "pie",
      data: {
        labels: summary.map((s) => s.category),
        datasets: [{
          data: summary.map((s) => Number(s.totalAmount)),
          backgroundColor: summary.map((s) => CATEGORY_COLORS[s.category] ?? "#9ca3af"),
          borderWidth: 2,
          borderColor: "rgba(15,23,42,0.9)",
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { size: 12 }, color: "rgba(255,255,255,0.8)" },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ₹${Number(ctx.raw).toLocaleString("en-IN")}`,
            },
          },
        },
      },
    });
    return () => { chartInstance.current?.destroy(); };
  }, [summary]);

  async function handleBudgetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!budgetForm.totalBudget || budgetForm.totalBudget <= 0) {
      setBudgetError("Budget amount must be greater than zero."); return;
    }
    setSavingBudget(true); setBudgetError("");
    try {
      if (budget) {
        const res = await apiClient.put<BudgetResponse>(`/api/trips/${tripId}/budget`, budgetForm);
        setBudget(res.data);
      } else {
        const res = await apiClient.post<BudgetResponse>(`/api/trips/${tripId}/budget`, budgetForm);
        setBudget(res.data);
      }
      setShowBudgetForm(false);
      await loadSummary();
      addToast("Budget saved", "success");
    } catch (e: unknown) {
      setBudgetError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save budget.");
    } finally {
      setSavingBudget(false);
    }
  }

  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseForm.amount || expenseForm.amount <= 0) { setExpenseError("Amount must be greater than zero."); return; }
    if (!expenseForm.category) { setExpenseError("Category is required."); return; }
    setSavingExpense(true); setExpenseError("");
    try {
      if (editingExpenseId !== null) {
        const res = await apiClient.put<ExpenseResponse>(`/api/trips/${tripId}/expenses/${editingExpenseId}`, expenseForm);
        setExpenses((prev) => prev.map((ex) => ex.id === editingExpenseId ? res.data : ex));
        addToast("Expense updated", "success");
      } else {
        const res = await apiClient.post<ExpenseResponse>(`/api/trips/${tripId}/expenses`, expenseForm);
        setExpenses((prev) => [res.data, ...prev]);
        addToast("Expense added", "success");
      }
      resetExpenseForm();
    } catch (e: unknown) {
      setExpenseError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to save expense.");
    } finally {
      setSavingExpense(false);
    }
  }

  async function handleDeleteExpense(expenseId: number) {
    if (!confirm("Delete this expense?")) return;
    try {
      await apiClient.delete(`/api/trips/${tripId}/expenses/${expenseId}`);
      setExpenses((prev) => prev.filter((ex) => ex.id !== expenseId));
      addToast("Expense deleted", "info");
    } catch { addToast("Failed to delete expense", "error"); }
  }

  function startEditExpense(ex: ExpenseResponse) {
    setEditingExpenseId(ex.id);
    setExpenseForm({
      category: ex.category,
      amount: Number(ex.amount),
      expenseDate: ex.expenseDate,
      description: ex.description ?? "",
      receiptUrl: ex.receiptUrl ?? "",
    });
    setShowExpenseForm(true);
  }

  function resetExpenseForm() {
    setShowExpenseForm(false);
    setEditingExpenseId(null);
    setExpenseForm(emptyExpenseForm());
    setExpenseError("");
  }

  const currency = budget?.currency ?? "INR";
  const fmt = (n: number) => `${currency === "INR" ? "₹" : currency + " "}${Number(n).toLocaleString("en-IN")}`;

  return (
    <>
      <div className="space-y-6">

        <div className="glass-card p-7 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <div className="glass-icon-chip">
              <Wallet className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-white/90">Budget</span>
            </div>
            <button
              onClick={() => { setShowBudgetForm((v) => !v); setBudgetError(""); }}
              className="glass-btn-primary px-4 py-2 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{budget ? "Edit Budget" : "Set Budget"}</span>
            </button>
          </div>

          {budgetLoading && (
            <div className="space-y-3 animate-pulse py-2">
              <div className="h-8 bg-white/10 rounded-lg w-1/3" />
              <div className="h-4 bg-white/5 rounded-lg w-2/3" />
            </div>
          )}
          {budgetError && !showBudgetForm && (
            <div className="glass-banner glass-banner--error text-sm flex items-center justify-between gap-2 my-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{budgetError}</span>
              </div>
              <button
                onClick={loadBudget}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs text-white transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {showBudgetForm && (
            <form
              onSubmit={handleBudgetSubmit}
              className="mb-6 glass-form-sheet space-y-4"
            >
              <p className="glass-label">
                {budget ? "Update Budget" : "Create Budget"}
              </p>
              {budgetError && (
                <div className="glass-banner glass-banner--error text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{budgetError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="glass-label">Total Budget *</label>
                  <input
                    type="number" min="0.01" step="0.01" required value={budgetForm.totalBudget || ""}
                    onChange={(e) => setBudgetForm((f) => ({ ...f, totalBudget: Number(e.target.value) }))}
                    className="glass-input"
                  />
                </div>
                <div>
                  <label className="glass-label">Currency</label>
                  <select
                    value={budgetForm.currency ?? "INR"}
                    onChange={(e) => setBudgetForm((f) => ({ ...f, currency: e.target.value }))}
                    className="glass-input bg-[#0f172a]/40"
                  >
                    {["INR", "USD", "EUR", "GBP", "JPY", "AED"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="glass-label">Notes</label>
                <input
                  type="text" value={budgetForm.notes ?? ""}
                  onChange={(e) => setBudgetForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional budget notes…"
                  className="glass-input"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit" disabled={savingBudget}
                  className="glass-btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingBudget ? "Saving…" : "Save Budget"}
                </button>
                <button
                  type="button" onClick={() => { setShowBudgetForm(false); setBudgetError(""); }}
                  className="glass-btn-ghost px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {!budgetLoading && budget && (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <BudgetCard label="Total Budget" value={fmt(budget.totalBudget)} color="text-white" />
                <BudgetCard
                  label="Total Expenses"
                  value={remaining ? fmt(remaining.totalExpenses) : "—"}
                  color="text-orange-400"
                />
                <BudgetCard
                  label="Remaining"
                  value={remaining ? fmt(remaining.remainingBudget) : fmt(budget.remainingBudget)}
                  color={remaining?.overBudget ? "text-red-400" : "text-green-400"}
                  badge={remaining?.overBudget ? "Over Budget" : undefined}
                />
              </div>

              {remaining && (
                <div className="mt-1">
                  <div className="flex justify-between text-xs text-white/50 mb-1.5">
                    <span>Spent</span>
                    <span className="font-semibold">
                      {((remaining.totalExpenses / remaining.totalBudget) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${remaining.overBudget ? "bg-red-500" : "bg-gradient-to-r from-orange-500 to-rose-500"}`}
                      style={{ width: `${Math.min((remaining.totalExpenses / remaining.totalBudget) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!budgetLoading && !budget && !showBudgetForm && (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
              <p className="text-sm text-white/40">
                No budget set yet. Click &quot;+ Set Budget&quot; to define your trip budget.
              </p>
            </div>
          )}
        </div>

        <div className="glass-card p-7 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <div className="glass-icon-chip">
              <Receipt className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-white/90">Expenses</span>
            </div>
            {!showExpenseForm && (
              <button
                onClick={() => { resetExpenseForm(); setShowExpenseForm(true); }}
                className="glass-btn-primary px-4 py-2 inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            )}
          </div>

          {showExpenseForm && (
            <form
              onSubmit={handleExpenseSubmit}
              className="mb-6 glass-form-sheet space-y-4"
            >
              <p className="glass-label">
                {editingExpenseId !== null ? "Edit Expense" : "New Expense"}
              </p>
              {expenseError && (
                <div className="glass-banner glass-banner--error text-sm flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{expenseError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="glass-label">Category *</label>
                  <select
                    required value={expenseForm.category}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, category: e.target.value }))}
                    className="glass-input bg-[#0f172a]/40"
                  >
                    <option value="">Select category…</option>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="glass-label">Amount * ({currency})</label>
                  <input
                    type="number" min="0.01" step="0.01" required value={expenseForm.amount || ""}
                    onChange={(e) => setExpenseForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                    className="glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="glass-label">Date *</label>
                <input
                  type="date" required value={expenseForm.expenseDate}
                  onChange={(e) => setExpenseForm((f) => ({ ...f, expenseDate: e.target.value }))}
                  className="glass-input"
                />
              </div>

              <div>
                <label className="glass-label">Description</label>
                <input
                  type="text" value={expenseForm.description ?? ""} placeholder="Optional description…"
                  onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
                  className="glass-input"
                />
              </div>

              <div>
                <label className="glass-label">Receipt URL</label>
                <input
                  type="url" value={expenseForm.receiptUrl ?? ""} placeholder="https://…"
                  onChange={(e) => setExpenseForm((f) => ({ ...f, receiptUrl: e.target.value }))}
                  className="glass-input"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit" disabled={savingExpense}
                  className="glass-btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingExpense ? "Saving…" : editingExpenseId !== null ? "Update" : "Add Expense"}
                </button>
                <button
                  type="button" onClick={resetExpenseForm}
                  className="glass-btn-ghost px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {expensesLoading && (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card-md p-4 flex items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-3 h-3 rounded-full bg-white/10 shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-white/10 rounded w-1/4" />
                      <div className="h-3 bg-white/5 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="w-16 h-6 bg-white/10 rounded-lg" />
                </div>
              ))}
            </div>
          )}

          {!expensesLoading && expenses.length === 0 && !showExpenseForm && (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
              <Receipt className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white/70">No expenses recorded yet</p>
              <p className="text-xs text-white/40 mt-0.5 mb-3">Track payments, split costs, and manage your budget effortlessly.</p>
              <button
                onClick={() => { setShowExpenseForm(true); setExpenseError(""); }}
                className="glass-btn-ghost px-4 py-1.5 text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Expense</span>
              </button>
            </div>
          )}

          {expenses.length > 0 && (
            <div className="space-y-2.5">
              <AnimatePresence>
                {expenses.map((ex) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="glass-card-md px-4 py-3.5 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span
                        className="mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white/10"
                        style={{ backgroundColor: CATEGORY_COLORS[ex.category] ?? "#9ca3af" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-white">{fmt(ex.amount)}</span>
                          <span className="text-xs bg-white/5 text-white/70 ring-1 ring-white/10 px-2 py-0.5 rounded-full font-medium">
                            {ex.category.charAt(0) + ex.category.slice(1).toLowerCase()}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-0.5">
                          {ex.expenseDate} · Paid by {ex.payerName}
                        </p>
                        {ex.description && (
                          <p className="text-xs text-white/70 mt-0.5 leading-relaxed">{ex.description}</p>
                        )}
                        {ex.receiptUrl && (
                          <a
                            href={ex.receiptUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-orange-400 hover:text-orange-300 hover:underline mt-0.5 inline-block font-medium transition-colors"
                          >
                            View Receipt ↗
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => startEditExpense(ex)}
                        className="glass-btn-ghost px-2.5 py-1 text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(ex.id)}
                        className="glass-btn-danger px-2.5 py-1 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {summary.length > 0 && (
          <div className="glass-card p-7 sm:p-8">
            <div className="glass-icon-chip mb-6">
              <PieChartIcon className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white/90">Spending by Category</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

              <div className="max-w-xs mx-auto w-full">
                <canvas ref={chartRef} />
              </div>

              <div className="space-y-3">
                {summary.map((s) => {
                  const total = summary.reduce((acc, x) => acc + Number(x.totalAmount), 0);
                  const pct = total > 0 ? ((Number(s.totalAmount) / total) * 100).toFixed(1) : "0";
                  return (
                    <div key={s.category} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 ring-2 ring-white/10"
                          style={{ backgroundColor: CATEGORY_COLORS[s.category] ?? "#9ca3af" }}
                        />
                        <span className="text-sm text-white/80 font-medium">
                          {s.category.charAt(0) + s.category.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-white">{fmt(Number(s.totalAmount))}</span>
                        <span className="text-xs text-white/40 ml-2">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-white/10 flex justify-between">
                  <span className="text-sm font-semibold text-white/70">Total</span>
                  <span className="text-sm font-bold text-white">
                    {fmt(summary.reduce((acc, s) => acc + Number(s.totalAmount), 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
}

function BudgetCard({
  label, value, color, badge,
}: {
  label: string; value: string; color: string; badge?: string;
}) {
  return (
    <div className="glass-card-md p-4">
      <p className="glass-label">{label}</p>
      <p className={`text-xl font-bold mt-1.5 ${color}`}>{value}</p>
      {badge && (
        <span className="glass-pill glass-pill--cancelled inline-block mt-1.5 text-xs">
          {badge}
        </span>
      )}
    </div>
  );
}

function emptyExpenseForm(): ExpenseRequest {
  return { category: "", amount: 0, expenseDate: new Date().toISOString().split("T")[0], description: "", receiptUrl: "" };
}
