import { useEffect, useState } from "react";
import { Search, Filter, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { LiffApi } from "@/lib/liffApi";

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function LiffTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);

  // Filters
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'income' | 'expense'
  const [dateRange, setDateRange] = useState("month"); // 'today' | '7d' | 'month' | 'all'
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [expData, incData] = await Promise.all([
        LiffApi.getExpenses(),
        LiffApi.getIncomes(),
      ]);
      setExpenses(expData || []);
      setIncomes(incData || []);
    } catch (err) {
      setError(err.message || "ไม่สามารถโหลดรายการธุรกรรมได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute date cutoffs
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + "-01";
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysStr = sevenDaysAgo.toISOString().slice(0, 10);

  // Combine transactions
  const allTransactions = [
    ...expenses.map((e) => ({
      type: "expense",
      id: e.id,
      title: e.title,
      amount: Number(e.amount),
      category: e.category,
      date: e.date,
      createdAt: e.created_at,
    })),
    ...incomes.map((i) => ({
      type: "income",
      id: i.id,
      title: i.title,
      amount: Number(i.amount),
      category: i.category,
      date: i.date,
      createdAt: i.created_at,
    })),
  ].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));

  // Filter
  const filtered = allTransactions.filter((item) => {
    // 1. Type
    if (typeFilter === "income" && item.type !== "income") return false;
    if (typeFilter === "expense" && item.type !== "expense") return false;

    // 2. Date Range
    if (dateRange === "today" && item.date !== today) return false;
    if (dateRange === "7d" && item.date < sevenDaysStr) return false;
    if (dateRange === "month" && item.date < monthStart) return false;

    // 3. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, i) => s + i.amount, 0);

  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold tracking-tight text-text">📑 รายการทั้งหมด</h1>
        <p className="text-xs text-text-muted">
          รายรับและรายจ่ายรวมในที่เดียว ({filtered.length} รายการ)
        </p>
      </div>

      {/* ── Summary Strip ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 border border-border bg-surface p-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center bg-surface-hover text-success">
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] text-text-muted">รายรับรวม</div>
            <div className="font-serif text-xs font-bold text-success">
              +฿{formatMoney(totalIncome)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-l border-border pl-2">
          <div className="flex h-7 w-7 items-center justify-center bg-surface-hover text-danger">
            <TrendingDown className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] text-text-muted">รายจ่ายรวม</div>
            <div className="font-serif text-xs font-bold text-danger">
              -฿{formatMoney(totalExpense)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ─────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="ค้นหาชื่อรายการ หรือหมวดหมู่..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-border bg-surface-hover/60 py-1.5 pl-8 pr-3 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex border border-border bg-surface text-xs">
          <button
            onClick={() => setTypeFilter("all")}
            className={`flex-1 py-1.5 font-medium transition ${
              typeFilter === "all"
                ? "bg-accent text-accent-fg font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => setTypeFilter("income")}
            className={`flex-1 py-1.5 font-medium transition ${
              typeFilter === "income"
                ? "bg-accent text-accent-fg font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            เฉพาะรายรับ
          </button>
          <button
            onClick={() => setTypeFilter("expense")}
            className={`flex-1 py-1.5 font-medium transition ${
              typeFilter === "expense"
                ? "bg-accent text-accent-fg font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            เฉพาะรายจ่าย
          </button>
        </div>

        {/* Date Range Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
          {[
            { id: "today", label: "วันนี้" },
            { id: "7d", label: "7 วัน" },
            { id: "month", label: "เดือนนี้" },
            { id: "all", label: "ทั้งหมด" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateRange(tab.id)}
              className={`border px-2.5 py-1 transition ${
                dateRange === tab.id
                  ? "border-accent bg-accent/10 font-semibold text-accent"
                  : "border-border bg-surface text-text-muted hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Transaction List ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-48 flex-col items-center justify-center space-y-2">
          <div className="h-6 w-6 animate-spin border-2 border-border border-t-accent" />
          <p className="text-xs text-text-muted">กำลังโหลดรายการ...</p>
        </div>
      ) : error ? (
        <div className="border border-border bg-surface p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-danger" />
          <p className="mt-2 text-xs font-medium text-text">{error}</p>
          <button
            onClick={fetchData}
            className="mt-3 bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg"
          >
            ลองใหม่
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-xs text-text-muted">
            {searchQuery ? "ไม่พบรายการที่ตรงกับคำค้นหา" : "ไม่มีรายการในช่วงเวลานี้"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border border border-border bg-surface">
          {filtered.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center justify-between px-3.5 py-2.5 transition hover:bg-surface-hover"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="text-base">{item.type === "income" ? "💰" : "💸"}</span>
                <div className="truncate">
                  <p className="truncate text-xs font-medium text-text">{item.title}</p>
                  <p className="text-[10px] text-text-muted">
                    {item.category || "อื่นๆ"} • {formatDate(item.date)}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span
                  className={`font-serif text-xs font-semibold ${
                    item.type === "income" ? "text-success" : "text-danger"
                  }`}
                >
                  {item.type === "income" ? "+" : "-"}฿{formatMoney(item.amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
