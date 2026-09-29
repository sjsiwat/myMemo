import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { LiffApi } from "@/lib/liffApi";

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export default function LiffDashboardPage() {
  const { user } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    tasks: [],
    expenses: [],
    incomes: [],
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LiffApi.getBootstrap();
      setData({
        tasks: res.tasks || [],
        expenses: res.expenses || [],
        incomes: res.incomes || [],
      });
    } catch (err) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  // Computations
  const todayIncomes = data.incomes
    .filter((i) => i.date === today)
    .reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const monthIncomes = data.incomes
    .filter((i) => (i.date || "").startsWith(thisMonth))
    .reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const todayExpenses = data.expenses
    .filter((e) => e.date === today)
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const monthExpenses = data.expenses
    .filter((e) => (e.date || "").startsWith(thisMonth))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);

  const pendingTasks = data.tasks.filter((t) => t.status !== "done");

  // Recent unified activities
  const recentActivities = [
    ...data.expenses.slice(0, 5).map((e) => ({
      type: "expense",
      id: e.id,
      title: e.title,
      amount: e.amount,
      category: e.category,
      date: e.date,
      createdAt: e.created_at,
    })),
    ...data.incomes.slice(0, 5).map((i) => ({
      type: "income",
      id: i.id,
      title: i.title,
      amount: i.amount,
      category: i.category,
      date: i.date,
      createdAt: i.created_at,
    })),
    ...data.tasks.slice(0, 5).map((t) => ({
      type: "task",
      id: t.id,
      title: t.title,
      status: t.status,
      date: t.due || t.created_at?.slice(0, 10),
      createdAt: t.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
    .slice(0, 8);

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3">
        <div className="h-7 w-7 animate-spin border-2 border-border border-t-accent" />
        <p className="text-xs text-text-muted">กำลังโหลดข้อมูลแดชบอร์ด...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-border bg-surface p-5 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-danger" />
        <p className="mt-2 text-sm font-medium text-text">{error}</p>
        <button
          onClick={fetchData}
          className="mt-4 bg-accent px-4 py-2 text-xs font-semibold text-accent-fg active:scale-95"
        >
          ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Welcome Greeting ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-text">
            สวัสดี, {user?.displayName || "คุณ"} 👋
          </h1>
          <p className="text-xs text-text-muted">ภาพรวมบันทึกประจำวันของคุณ</p>
        </div>
        <Link
          to="/liff/summary"
          className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          สรุปยอด <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* ── Key Metric Tiles ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        {/* Income Card */}
        <Link
          to="/liff/income"
          className="border border-border bg-surface-hover/50 p-3 transition hover:border-accent/40 active:scale-95"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-medium uppercase tracking-wider">รายรับ</span>
            <TrendingUp className="h-3.5 w-3.5 text-success" />
          </div>
          <div className="mt-2 font-serif text-base font-semibold tracking-tight text-text">
            ฿{formatMoney(monthIncomes)}
          </div>
          <div className="mt-0.5 text-[9px] text-text-muted">
            วันนี้: ฿{formatMoney(todayIncomes)}
          </div>
        </Link>

        {/* Expense Card */}
        <Link
          to="/liff/expenses"
          className="border border-border bg-surface-hover/50 p-3 transition hover:border-accent/40 active:scale-95"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-medium uppercase tracking-wider">รายจ่าย</span>
            <TrendingDown className="h-3.5 w-3.5 text-danger" />
          </div>
          <div className="mt-2 font-serif text-base font-semibold tracking-tight text-text">
            ฿{formatMoney(monthExpenses)}
          </div>
          <div className="mt-0.5 text-[9px] text-text-muted">
            วันนี้: ฿{formatMoney(todayExpenses)}
          </div>
        </Link>

        {/* Pending Tasks Card */}
        <Link
          to="/liff/tasks"
          className="border border-border bg-surface-hover/50 p-3 transition hover:border-accent/40 active:scale-95"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[10px] font-medium uppercase tracking-wider">งานค้าง</span>
            <CheckSquare className="h-3.5 w-3.5 text-accent" />
          </div>
          <div className="mt-2 font-serif text-base font-semibold tracking-tight text-text">
            {pendingTasks.length} งาน
          </div>
          <div className="mt-0.5 text-[9px] text-text-muted">
            {data.tasks.filter((t) => t.status === "done").length} เสร็จแล้ว
          </div>
        </Link>
      </div>

      {/* ── Quick Action Buttons ─────────────────────────────────────────── */}
      <div className="flex gap-2">
        <Link
          to="/liff/income?action=add"
          className="flex flex-1 items-center justify-center gap-1.5 border border-border bg-surface py-2 text-xs font-medium text-text transition hover:bg-surface-hover active:scale-95"
        >
          <Plus className="h-3.5 w-3.5 text-success" />
          <span>+ รายรับ</span>
        </Link>
        <Link
          to="/liff/expenses?action=add"
          className="flex flex-1 items-center justify-center gap-1.5 border border-border bg-surface py-2 text-xs font-medium text-text transition hover:bg-surface-hover active:scale-95"
        >
          <Plus className="h-3.5 w-3.5 text-danger" />
          <span>+ รายจ่าย</span>
        </Link>
        <Link
          to="/liff/tasks?action=add"
          className="flex flex-1 items-center justify-center gap-1.5 border border-border bg-surface py-2 text-xs font-medium text-text transition hover:bg-surface-hover active:scale-95"
        >
          <Plus className="h-3.5 w-3.5 text-accent" />
          <span>+ งาน</span>
        </Link>
      </div>

      {/* ── Recent Activities List ────────────────────────────────────────── */}
      <div className="border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-text-muted" />
            <h2 className="text-xs font-semibold text-text">รายการล่าสุด</h2>
          </div>
          <Link
            to="/liff/transactions"
            className="text-[11px] font-medium text-accent hover:underline"
          >
            ดูทั้งหมด ({data.expenses.length + data.incomes.length})
          </Link>
        </div>

        {recentActivities.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            ยังไม่มีรายการใดๆ ในระบบ
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentActivities.map((item, idx) => (
              <div
                key={`${item.type}-${item.id || idx}`}
                className="flex items-center justify-between px-3.5 py-2.5 transition hover:bg-surface-hover"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <span className="text-sm">
                    {item.type === "expense"
                      ? "💸"
                      : item.type === "income"
                      ? "💰"
                      : "📋"}
                  </span>
                  <div className="truncate">
                    <p className="truncate text-xs font-medium text-text">{item.title}</p>
                    <p className="text-[10px] text-text-muted">
                      {item.category || (item.status === "done" ? "เสร็จสิ้น" : "รอดำเนินการ")} •{" "}
                      {formatDate(item.date)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {item.type === "expense" ? (
                    <span className="font-serif text-xs font-semibold text-danger">
                      -฿{formatMoney(item.amount)}
                    </span>
                  ) : item.type === "income" ? (
                    <span className="font-serif text-xs font-semibold text-success">
                      +฿{formatMoney(item.amount)}
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-medium ${
                        item.status === "done" ? "text-success" : "text-warning"
                      }`}
                    >
                      {item.status === "done" ? "เสร็จ" : "ค้าง"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
