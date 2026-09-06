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
      "The daily command surface — today's tasks, spending, notes, and calendar collapsed into one glance.",
    category: "Personal OS · Overview",
    outcome: "Daily planning down to under five minutes.",
  },
  {
    number: "02",
    name: "Tasks",
    description:
      "A kanban board with priority, due dates, and labels — built for a queue of one person's real work.",
    category: "Personal OS · Execution",
    outcome: "Every open commitment visible in one board, none of it held in your head.",
  },
  {
    number: "03",
    name: "Notes",
    description:
      "Fast capture for ideas and half-formed thoughts, tagged and searchable, writable from inside LINE.",
    category: "Personal OS · Capture",
    outcome: "An idea takes as long to save as it takes to have.",
  },
  {
    number: "04",
    name: "Expenses",
    description:
      "Categorized spending records, logged in one line — \"จ่ายกาแฟ 80\" becomes a record instantly.",
    category: "Personal OS · Money",
    outcome: "Spending logged the moment it happens, not reconstructed at month-end.",
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
      "Daily and weekly summaries — tasks done, overdue, notes written, money spent.",
    category: "Personal OS · Reflection",
    outcome: "A five-minute weekly check-in instead of a guess.",
  },
];

 

export const capabilities = [
  {
    number: "A",
    title: "Instant capture",
    description:
      "Add a task, note, or expense in one line, from anywhere. No modal, no multi-step form standing between a thought and the record of it.",
  },
  {
    number: "B",
    title: "LINE-native input",
    description:
      "Message Memo+ directly — \"เพิ่มงาน ส่งรายงาน #urgent\" — and it lands in the right place without opening the app.",
  },
  {
    number: "C",
    title: "Local-first storage",
    description:
      "Everything works offline, immediately, stored on the device first. Speed isn't a network round-trip away.",
  },
  {
    number: "D",
    title: "Cloud sync, by choice",
    description:
      "Sign in with LINE when you want your data to follow you across devices. Until then, nothing leaves your browser.",
  },
];

 

export const processSteps = [
  {
    number: "01",
    title: "Start from the moment, not the feature",
    description:
      "Every decision starts with one question: how fast can a real thought — a task, a note, an expense — become a saved record? The interface exists to answer that, not to look complete.",
  },
  {
    number: "02",
    title: "Local first, cloud second",
    description:
      "The app is built to work fully offline before it's built to sync. Reliability isn't a feature added later — it's the floor everything else stands on.",
  },
  {
    number: "03",
    title: "Meet the user where they already are",
    description:
      "Instead of asking for another app to be opened, Memo+ listens inside LINE — where the day is already happening — and turns a message into structured data.",
  },
  {
    number: "04",
    title: "Ship the calm version",
    description:
      "Every screen is checked against one standard: does this reduce what has to be held in the user's head today? If a feature adds decisions without removing any, it doesn't ship.",
  },
];

export const pointOfView =
  "Good products are not created by adding more. They are created by deciding what matters.";

export const testimonial = {
  quote:
    "I built Memo+ because nothing else fit the way I actually work. It captures a task, a note, or an expense in a single line — from LINE, or from the app — and it keeps everything on my device until I decide to sync. It removes the friction between having a thought and saving it, so my head stays clear for the work that matters.",
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
  body: "Sign up once, and Memo+ syncs your tasks, notes, and expenses across every device you use — LINE included.",
  action: "Continue to Sign Up",
};

export const footer = {
  company: "Memo+",
  email: "sj.siwat@gmail.com",
  linkedin: "https://www.linkedin.com/in/siwat-sujjawanich",
  github: "https://github.com/sjsiwat",
  note: "Built by one person, for one person's day.",
};
