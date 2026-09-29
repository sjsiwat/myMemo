// Dashboard lives on the same domain at /dashboard (not a separate app.
// subdomain — root = this landing page, /dashboard = the app).
export const appUrl = "/dashboard";

// Opens the Dashboard app directly on its Sign Up form (see auth-gate in the app).
export const signupAppUrl = `${appUrl}?auth=signup`;

 

// These sections now live on the About Me page, so anchors are cross-page.
export const navLinks = [
  { label: "Work", href: "/about#index" },
  { label: "Services", href: "/about#capabilities" },
  { label: "Process", href: "/about#process" },
];

 

export const indexEntries = [
  {
    number: "01",
    name: "Dashboard",
    description:
      "The daily command surface — today's tasks, cashflow, notes, and calendar collapsed into one glance.",
    category: "Personal OS · Overview",
    outcome: "Daily planning down to under five minutes.",
  },
  {
    number: "02",
    name: "Tasks",
    description:
      "A kanban board with priority, due dates, and labels — accessible on desktop and via LINE LIFF.",
    category: "Personal OS · Execution",
    outcome: "Every open commitment visible in one board, none of it held in your head.",
  },
  {
    number: "03",
    name: "Notes",
    description:
      "Fast capture for ideas and half-formed thoughts, tagged and searchable, writable directly inside LINE.",
    category: "Personal OS · Capture",
    outcome: "An idea takes as long to save as it takes to have.",
  },
  {
    number: "04",
    name: "Expenses",
    description:
      "Categorized spending and income records, logged in one line — \"จ่ายกาแฟ 80\" or \"รับเงินเดือน 30000\" balanced instantly.",
    category: "Personal OS · Money",
    outcome: "Cashflow tracked the moment it happens, not reconstructed at month-end.",
  },
  {
    number: "05",
    name: "Calendar",
    description: "A month view of tasks and due dates, so nothing quietly slips past.",
    category: "Personal OS · Time",
    outcome: "One view answers what's due, and when.",
  },
  {
    number: "06",
    name: "Review",
    description:
      "Daily and weekly summaries — tasks completed, overdue items, notes taken, income, and spending.",
    category: "Personal OS · Reflection",
    outcome: "A five-minute weekly check-in instead of a guess.",
  },
];

export const capabilities = [
  {
    number: "A",
    title: "Instant omni-capture",
    description:
      "Add a task, note, expense, or income in one natural line. No modal, no multi-step form standing between a thought and the record of it.",
  },
  {
    number: "B",
    title: "LINE Bot & Rich Menu",
    description:
      "Message Memo+ naturally — \"จ่ายกาแฟ 65\", \"รับเงินเดือน 30000\", \"เพิ่มงาน ส่งสไลด์ #urgent\". Auto-categorized instantly, with a full 6-tile Rich Menu ready on tap.",
  },
  {
    number: "C",
    title: "Embedded LIFF Micro-Apps",
    description:
      "Open interactive Kanban boards, transaction logs, and financial summaries directly inside LINE without switching apps or logging in again.",
  },
  {
    number: "D",
    title: "Real-time edge sync",
    description:
      "Powered by Cloudflare Workers and Supabase PostgreSQL. Every record stays synchronized across LINE chat, LIFF, and the web workspace in sub-second time.",
  },
];

export const processSteps = [
  {
    number: "01",
    title: "Start from the moment, not the feature",
    description:
      "Every decision starts with one question: how fast can a real thought — a task, a note, an expense, or an income — become a saved record? The interface exists to answer that with zero friction, not to look complicated.",
  },
  {
    number: "02",
    title: "Meet you where your day happens",
    description:
      "Instead of demanding a separate app to be opened, Memo+ lives right inside LINE. A conversational bot, an always-ready Rich Menu, and embedded LIFF micro-apps turn daily chat into an effortless personal OS.",
  },
  {
    number: "03",
    title: "Zero-latency edge architecture",
    description:
      "Engineered on Cloudflare Workers edge network and real-time cloud data. Instant webhook replies, sub-second LIFF loads, and continuous sync ensure your records are always immediate and reliable.",
  },
  {
    number: "04",
    title: "Ship the calm, unified workspace",
    description:
      "Every screen is checked against one standard: does this reduce what has to be held in your head today? Swiss minimal design, warm luxury tones, and zero noise — giving you clarity instead of clutter.",
  },
];

export const pointOfView =
  "Good products are not created by adding more. They are created by deciding what matters.";

export const testimonial = {
  quote:
    "I built Memo+ because nothing else fit the way I actually work. It captures tasks, notes, expenses, and income in a single line — from LINE chat, LIFF, or the web workspace — and keeps everything synced in real time. It removes the friction between having a thought and saving it, so my head stays clear for the work that matters.",
  name: "Siwat J.",
  role: "Developer, Memo+",
};

export const finalCta = {
  heading: "Looking for a private workspace?",
  body: "No team, no seats, no setup call — just a workspace that starts working the moment you do.",
  action: "Log in with LINE",
};

export const signup = {
  heading: "Create your workspace",
  body: "Sign up once, and Memo+ syncs your tasks, notes, income, and expenses across every device you use — LINE included.",
  action: "Continue to Sign Up",
};

export const footer = {
  company: "Memo+",
  email: "sj.siwat@gmail.com",
  linkedin: "https://www.linkedin.com/in/siwat-sujjawanich",
  github: "https://github.com/sjsiwat",
  note: "Built by one person, for one person's day.",
};
