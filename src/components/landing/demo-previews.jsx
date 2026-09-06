// Miniature, honest previews of each real surface inside Memo+ — not
// generic placeholder boxes. Deliberately monochrome; the accent shows up
// once per preview (a "today" marker, a highlighted stat), never painted
// across the whole thing.

const stats = [
  { value: "7", label: "Tasks", accent: false },
  { value: "4", label: "Pending", accent: true },
  { value: "3", label: "Done", accent: false },
  { value: "฿314", label: "Today", accent: false },
];

function DashboardPreview() {
  return (
    <div className="grid h-full grid-cols-4 gap-1.5 p-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col justify-between border border-hairline bg-paper p-2"
        >
          <span
            className={`font-grotesk text-base font-semibold leading-none ${
 stat.accent ? "text-accent" : "text-ink"
 }`}
          >
            {stat.value}
          </span>
          <span className="text-[9px] uppercase tracking-wide text-ink-faint">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}

const kanbanColumns = [
  {
    label: "To do",
    cards: [{ title: "Send monthly report", dot: "bg-danger" }],
  },
  {
    label: "Doing",
    cards: [
      { title: "Product review 2pm", dot: "bg-warning" },
      { title: "LINE bot integration", dot: "bg-data-6" },
    ],
  },
  { label: "Done", cards: [{ title: "Login system", dot: "bg-success" }] },
];

function TasksPreview() {
  return (
    <div className="grid h-full grid-cols-3 gap-1.5 p-2">
      {kanbanColumns.map((col) => (
        <div key={col.label} className="flex flex-col gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wide text-ink-faint">
            {col.label}
          </span>
          {col.cards.map((card) => (
            <div
              key={card.title}
              className="flex items-start gap-1 border border-hairline bg-paper p-1.5"
            >
              <span className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${card.dot}`} />
              <span className="text-[9px] leading-tight text-ink">{card.title}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const notes = [
  { title: "Feature Q3 idea", tag: "idea" },
  { title: "Sprint meeting notes", tag: "work" },
];

function NotesPreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-1.5 p-2">
      {notes.map((note) => (
        <div key={note.title} className="border border-hairline bg-paper p-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-[10px] font-semibold text-ink">{note.title}</p>
            <span className="shrink-0 border border-hairline px-1 py-px text-[8px] uppercase tracking-wide text-ink-faint">
              {note.tag}
            </span>
          </div>
          <div className="mt-1.5 space-y-1">
            <div className="h-1 w-[85%] bg-line" />
            <div className="h-1 w-[60%] bg-line" />
          </div>
        </div>
      ))}
    </div>
  );
}

const expenseRows = [
  { label: "สุขภาพ", amount: "฿800", width: "100%" },
  { label: "อาหาร", amount: "฿625", width: "78%" },
  { label: "เดินทาง", amount: "฿420", width: "52%" },
];

function ExpensesPreview() {
  return (
    <div className="flex h-full flex-col justify-center gap-2 p-3">
      {expenseRows.map((row) => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-[9px] text-ink-muted">{row.label}</span>
          <div className="h-1.5 flex-1 bg-line">
            <div className="h-full bg-ink" style={{ width: row.width }} />
          </div>
          <span className="w-10 shrink-0 text-right text-[9px] font-medium text-ink">
            {row.amount}
          </span>
        </div>
      ))}
    </div>
  );
}

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
const calendarCells = [null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const todayCell = 9;

function CalendarPreview() {
  // Rows split the fixed swatch height (header + 2 weeks) — never
  // aspect-square cells, which grow with column width and overflow the box.
  return (
    <div className="grid h-full grid-cols-7 grid-rows-[auto_1fr_1fr] gap-0.5 p-2">
      {weekdays.map((d, i) => (
        <span
          key={`${d}-${i}`}
          className="text-center text-[8px] font-semibold uppercase text-ink-faint"
        >
          {d}
        </span>
      ))}
      {calendarCells.map((cell, i) => (
        <span
          key={i}
          className={`flex items-center justify-center text-[9px] ${
 cell === todayCell
 ? "bg-accent font-semibold text-accent-fg"
 : cell
 ? "text-ink-muted"
 : ""
 }`}
        >
          {cell ?? ""}
        </span>
      ))}
    </div>
  );
}

const reviewStats = [
  { value: "12", label: "Tasks done" },
  { value: "8", label: "Notes written" },
  { value: "฿2,947", label: "Spent" },
];

function ReviewPreview() {
  return (
    <div className="grid h-full grid-cols-3 gap-2 p-3">
      {reviewStats.map((stat) => (
        <div key={stat.label} className="flex flex-col justify-center border-l border-hairline pl-2 first:border-l-0 first:pl-0">
          <span className="font-grotesk text-lg font-semibold leading-none text-ink">
            {stat.value}
          </span>
          <span className="mt-1 text-[9px] leading-tight text-ink-faint">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}

export const DEMO_PREVIEWS = {
  Dashboard: DashboardPreview,
  Tasks: TasksPreview,
  Notes: NotesPreview,
  Expenses: ExpensesPreview,
  Calendar: CalendarPreview,
  Review: ReviewPreview,
};
