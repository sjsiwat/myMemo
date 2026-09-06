import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { EmptyState } from "@/components/shared/EmptyState";
import { PRIORITY_COLORS, PRIORITY_RANK, PRIORITY_TINTS, expenseBarColor } from "@/lib/constants";
import { formatDate, formatMoney, getMonthKey, getTodayKey, relativeTime, parseTags } from "@/lib/format";
import { isTaskDone } from "@/lib/actions";

export function FocusList() {
  const tasks = useStore((s) => s.tasks);
  const focus = [...tasks]
    .filter((t) => !isTaskDone(t))
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority])
    .slice(0, 5);

  return (
    <div className="border border-hairline bg-paper p-5">
      <h3 className="font-grotesk text-sm font-semibold uppercase tracking-[0.08em] text-ink-faint">Focus</h3>
      <div className="mt-3 flex flex-col gap-2">
        {focus.length === 0 ? (
          <EmptyState message="ยังไม่มีงานค้าง ลองกดเพิ่มงานแรกเพื่อเริ่มจัดลำดับวันของคุณ" href="/tasks" action="เพิ่มงานแรก" />
        ) : (
          focus.map((task) => {
            const color = PRIORITY_COLORS[task.priority];
            return (
              <div key={task.id} className="flex items-center gap-3 border-t border-hairline pt-2 first:border-t-0 first:pt-0">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{task.title}</span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: PRIORITY_TINTS[task.priority], color }}
                >
                  {task.priority}
                </span>
                {task.due && <span className="shrink-0 text-xs text-ink-faint">{formatDate(task.due)}</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function TodayCalendarPanel() {
  const tasks = useStore((s) => s.tasks);
  const todayKey = getTodayKey();
  const todayTasks = tasks.filter((t) => t.due === todayKey);
  const headingText = new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date()
  );

  return (
    <div className="border border-hairline bg-paper p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-grotesk text-sm font-semibold uppercase tracking-[0.08em] text-ink-faint">วันนี้</h3>
        <span className="text-xs text-ink-faint">{headingText}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {todayTasks.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-faint">ไม่มีกำหนดการวันนี้</p>
        ) : (
          todayTasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 border-t border-hairline pt-2 first:border-t-0 first:pt-0">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: PRIORITY_COLORS[t.priority] }} aria-hidden />
              <span className={`min-w-0 flex-1 truncate text-sm text-ink ${isTaskDone(t) ? "line-through opacity-50" : ""}`}>
                {t.title}
              </span>
              <span className="shrink-0 text-[11px] text-ink-faint">{t.priority}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ExpenseBarsPanel() {
  const expenses = useStore((s) => s.expenses);
  const totals = new Map();
  expenses.forEach((e) => totals.set(e.category, (totals.get(e.category) ?? 0) + Number(e.amount)));
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const max = top.length ? top[0][1] : 0;
  const min = top.length ? top[top.length - 1][1] : 0;

  return (
    <div className="border border-hairline bg-paper p-5">
      <h3 className="font-grotesk text-sm font-semibold uppercase tracking-[0.08em] text-ink-faint">รายจ่ายตามหมวด</h3>
      <div className="mt-3 flex flex-col gap-3">
        {top.length === 0 ? (
          <EmptyState
            message="ยังไม่มีรายจ่ายให้สรุป ลองบันทึกกาแฟ มื้อกลางวัน หรือค่าเดินทางรายการแรก"
            href="/expenses"
            action="บันทึกรายจ่าย"
          />
        ) : (
          top.map(([category, total]) => {
            const ratio = max ? total / max : 0;
            const width = Math.round(ratio * 100);
            return (
              <div key={category}>
                <div className="flex items-center justify-between text-xs text-ink-muted">
                  <span>{category}</span>
                  <strong className="text-ink">{formatMoney(total)}</strong>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-[4px] bg-paper-dim">
                  <div
                    className="h-full rounded-[4px]"
                    style={{ width: `${width}%`, background: expenseBarColor(total, max, min) }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function RecentNotesPanel() {
  const notes = useStore((s) => s.notes);
  const recent = [...notes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  return (
    <div className="border border-hairline bg-paper p-5 md:col-span-2">
      <h3 className="font-grotesk text-sm font-semibold uppercase tracking-[0.08em] text-ink-faint">โน้ตล่าสุด</h3>
      <div className="mt-3 flex flex-col gap-2">
        {recent.length === 0 ? (
          <EmptyState message="ยังไม่มีโน้ต ลองบันทึกไอเดียหรือความคิดแรกของ Memo+" href="/notes" action="เขียนโน้ต" />
        ) : (
          recent.map((note) => {
            const tags = parseTags(note.tags);
            return (
              <Link
                key={note.id}
                to="/notes"
                className="flex items-center gap-3 border-t border-hairline py-2 first:border-t-0"
              >
                <FileText size={14} className="shrink-0 text-ink-faint" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{note.title}</span>
                {tags.slice(0, 2).map((t) => (
                  <span key={t} className="shrink-0 border border-hairline px-1.5 py-0.5 text-[11px] text-ink-muted">
                    {t}
                  </span>
                ))}
                <span className="shrink-0 text-xs text-ink-faint">{relativeTime(note.createdAt)}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

export function MonthlyReviewWidget() {
  const tasks = useStore((s) => s.tasks);
  const expenses = useStore((s) => s.expenses);
  const notes = useStore((s) => s.notes);

  const monthKey = getMonthKey();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartKey = weekStart.toISOString().slice(0, 10);

  const weekDone = tasks.filter((t) => isTaskDone(t) && t.due && t.due >= weekStartKey).length;
  const monthExpense = expenses.filter((e) => e.date?.startsWith(monthKey)).reduce((s, e) => s + Number(e.amount), 0);
  const monthNotes = notes.filter(
    (n) => n.createdAt && new Date(n.createdAt).toISOString().slice(0, 7) === monthKey
  ).length;

  return (
    <div className="border border-hairline bg-paper p-5">
      <h3 className="font-grotesk text-sm font-semibold uppercase tracking-[0.08em] text-ink-faint">สรุปช่วงนี้</h3>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="font-grotesk text-lg font-semibold text-ink">{weekDone}</p>
          <p className="mt-1 text-[11px] text-ink-faint">งานเสร็จสัปดาห์นี้</p>
        </div>
        <div>
          <p className="font-grotesk text-lg font-semibold text-ink">{formatMoney(monthExpense)}</p>
          <p className="mt-1 text-[11px] text-ink-faint">รายจ่ายเดือนนี้</p>
        </div>
        <div>
          <p className="font-grotesk text-lg font-semibold text-ink">{monthNotes}</p>
          <p className="mt-1 text-[11px] text-ink-faint">โน้ตเดือนนี้</p>
        </div>
      </div>
    </div>
  );
}
