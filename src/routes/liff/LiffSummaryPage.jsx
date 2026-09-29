import { useEffect, useState } from "react";
import { PieChart, TrendingUp, TrendingDown, CheckSquare, Clock, AlertCircle } from "lucide-react";
import { LiffApi } from "@/lib/liffApi";

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function LiffSummaryPage() {
  const [range, setRange] = useState("month"); // 'today' | '7d' | 'month' | 'all'
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = async (selectedRange) => {
    setLoading(true);
    setError(null);
    try {
      const data = await LiffApi.getSummary(selectedRange);
      setSummary(data);
    } catch (err) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลสรุปได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(range);
  }, [range]);

  const rangeLabels = {
    today: "วันนี้",
    "7d": "7 วันล่าสุด",
    month: "เดือนนี้",
    all: "ทั้งหมด",
  };

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-bold tracking-tight text-text">📊 สรุปภาพรวม</h1>
        <p className="text-xs text-text-muted">
          สรุปการเงินและสถานะงานในช่วง {rangeLabels[range]}
        </p>
      </div>

      {/* ── Time Range Tabs ──────────────────────────────────────────────── */}
      <div className="flex border border-border bg-surface text-xs">
        {[
          { id: "today", label: "วันนี้" },
          { id: "7d", label: "7 วัน" },
          { id: "month", label: "เดือนนี้" },
          { id: "all", label: "ทั้งหมด" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRange(tab.id)}
            className={`flex-1 py-1.5 font-medium transition ${
              range === tab.id
                ? "bg-accent text-accent-fg font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 flex-col items-center justify-center space-y-2">
          <div className="h-6 w-6 animate-spin border-2 border-border border-t-accent" />
          <p className="text-xs text-text-muted">กำลังคำนวณข้อมูลสรุป...</p>
        </div>
      ) : error ? (
        <div className="border border-border bg-surface p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-danger" />
          <p className="mt-2 text-xs font-medium text-text">{error}</p>
          <button
            onClick={() => fetchSummary(range)}
            className="mt-3 bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg"
          >
            ลองใหม่
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Financial Summary Card ─────────────────────────────────────── */}
          <div className="border border-border bg-surface p-4">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <PieChart className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                สรุปการเงิน
              </h2>
            </div>

            <div className="mt-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <TrendingUp className="h-3.5 w-3.5 text-success" />
                  <span>รายรับรวม</span>
                </div>
                <span className="font-serif text-sm font-bold text-success">
                  +฿{formatMoney(summary?.totalIncome)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <TrendingDown className="h-3.5 w-3.5 text-danger" />
                  <span>รายจ่ายรวม</span>
                </div>
                <span className="font-serif text-sm font-bold text-danger">
                  -฿{formatMoney(summary?.totalExpense)}
                </span>
              </div>

              <div className="border-t border-border pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text">คงเหลือสุทธิ</span>
                  <span
                    className={`font-serif text-base font-bold ${
                      (summary?.balance || 0) >= 0 ? "text-text" : "text-danger"
                    }`}
                  >
                    ฿{formatMoney(summary?.balance)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Tasks Status Summary Card ──────────────────────────────────── */}
          <div className="border border-border bg-surface p-4">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <CheckSquare className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                สรุปสถานะงาน
              </h2>
            </div>

            <div className="mt-3.5 grid grid-cols-2 gap-2 text-center">
              <div className="border border-border bg-surface-hover/60 p-3">
                <div className="text-[10px] uppercase tracking-wider text-text-muted">
                  งานค้างอยู่
                </div>
                <div className="mt-1 font-serif text-xl font-bold text-warning">
                  {summary?.pendingTasks || 0}
                </div>
              </div>

              <div className="border border-border bg-surface-hover/60 p-3">
                <div className="text-[10px] uppercase tracking-wider text-text-muted">
                  งานที่เสร็จแล้ว
                </div>
                <div className="mt-1 font-serif text-xl font-bold text-success">
                  {summary?.completedTasks || 0}
                </div>
              </div>
            </div>

            <div className="mt-2.5 text-center text-[10px] text-text-muted">
              งานทั้งหมดในระบบ: {summary?.totalTasks || 0} รายการ
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
