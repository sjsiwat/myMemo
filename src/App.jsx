import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { LandingLayout } from "@/routes/landing/LandingLayout.jsx";
import Home from "@/routes/landing/Home.jsx";

// The app half pulls in TipTap, dnd-kit and the Supabase client. Next.js split
// those per route; keep the landing page from paying for them.
const About = lazy(() => import("@/routes/landing/About.jsx"));
const Signup = lazy(() => import("@/routes/landing/Signup.jsx"));
const AppLayout = lazy(() =>
  import("@/routes/app/AppLayout.jsx").then((m) => ({ default: m.AppLayout }))
);
const DashboardPage = lazy(() => import("@/routes/app/DashboardPage.jsx"));
const TasksPage = lazy(() => import("@/routes/app/TasksPage.jsx"));
const NotesPage = lazy(() => import("@/routes/app/NotesPage.jsx"));
const ExpensesPage = lazy(() => import("@/routes/app/ExpensesPage.jsx"));
const CalendarPage = lazy(() => import("@/routes/app/CalendarPage.jsx"));
const ReviewPage = lazy(() => import("@/routes/app/ReviewPage.jsx"));
const NotFound = lazy(() => import("@/routes/NotFound.jsx"));

// LIFF Web App routes
const LiffLayout = lazy(() =>
  import("@/routes/liff/LiffLayout.jsx").then((m) => ({ default: m.LiffLayout }))
);
const LiffDashboardPage = lazy(() => import("@/routes/liff/LiffDashboardPage.jsx"));
const LiffTasksPage = lazy(() => import("@/routes/liff/LiffTasksPage.jsx"));
const LiffIncomePage = lazy(() => import("@/routes/liff/LiffIncomePage.jsx"));
const LiffExpensesPage = lazy(() => import("@/routes/liff/LiffExpensesPage.jsx"));
const LiffTransactionsPage = lazy(() => import("@/routes/liff/LiffTransactionsPage.jsx"));
const LiffSummaryPage = lazy(() => import("@/routes/liff/LiffSummaryPage.jsx"));
const LiffMenuPage = lazy(() => import("@/routes/liff/LiffMenuPage.jsx"));

// Matches AppLayout's own pre-auth placeholder, so a chunk fetch does not flash.
const Blank = <div className="min-h-screen bg-paper" />;

// Handles double /liff prefix gracefully (e.g. /liff/liff/dashboard -> /liff/dashboard)
function LiffDoubleRedirect() {
  const location = useLocation();
  const cleanPath = location.pathname.replace(/^\/liff\/liff/, "/liff") || "/liff";
  return <Navigate to={`${cleanPath}${location.search}`} replace />;
}

export default function App() {
  return (
    <Suspense fallback={Blank}>
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Navigate to="/about#capabilities" replace />} />
          <Route path="/process" element={<Navigate to="/about#process" replace />} />
          <Route path="/work" element={<Navigate to="/about#index" replace />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/review" element={<ReviewPage />} />
        </Route>

        {/* ── LIFF Web App Mobile Shell ──────────────────────────────────── */}
        <Route path="/liff" element={<LiffLayout />}>
          <Route index element={<LiffDashboardPage />} />
          <Route path="dashboard" element={<LiffDashboardPage />} />
          <Route path="tasks" element={<LiffTasksPage />} />
          <Route path="income" element={<LiffIncomePage />} />
          <Route path="expenses" element={<LiffExpensesPage />} />
          <Route path="transactions" element={<LiffTransactionsPage />} />
          <Route path="summary" element={<LiffSummaryPage />} />
          <Route path="menu" element={<LiffMenuPage />} />
        </Route>

        {/* Safety catch for duplicate /liff prefix from concatenation */}
        <Route path="/liff/liff" element={<LiffDoubleRedirect />} />
        <Route path="/liff/liff/*" element={<LiffDoubleRedirect />} />

        <Route path="/index.html" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
