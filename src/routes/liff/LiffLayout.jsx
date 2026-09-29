import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  CheckSquare,
  TrendingDown,
  TrendingUp,
  PieChart,
  RefreshCw,
  X,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { LiffAuth } from "@/lib/liff";

export function LiffLayout() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginFn, setLoginFn] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function runAuth() {
      setLoading(true);
      setError(null);
      setNeedsLogin(false);

      try {
        const res = await LiffAuth.init();
        if (!active) return;

        if (res.success) {
          setUser(res.user);

          // Handle page redirection from query string (e.g. ?page=tasks or liff.state)
          const params = new URLSearchParams(window.location.search);
          const page = params.get("page");
          const liffState = params.get("liff.state");

          let targetPath = null;
          if (page) {
            targetPath = page.startsWith("/liff") ? page : `/liff/${page.replace(/^\//, "")}`;
          } else if (liffState) {
            targetPath = liffState.startsWith("/liff") ? liffState : `/liff/${liffState.replace(/^\//, "")}`;
          }

          if (targetPath) {
            targetPath = targetPath.replace(/^\/liff\/liff/, "/liff");
          }

          if (targetPath && targetPath !== location.pathname) {
            navigate(targetPath, { replace: true });
          }
        } else if (res.needsLogin) {
          setNeedsLogin(true);
          setLoginFn(() => res.login);
        } else {
          setError(res.error || "ไม่สามารถเชื่อมต่อกับ LINE ได้");
        }
      } catch (err) {
        if (active) {
          setError(err.message || "เกิดข้อผิดพลาดในการโหลดระบบ");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    runAuth();

    return () => {
      active = false;
    };
  }, []);

  // ── Loading Screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
        <div className="h-10 w-10 animate-spin border-2 border-border border-t-accent" />
        <p className="mt-4 font-sans text-sm text-text-secondary">กำลังเชื่อมต่อกับ Memo+...</p>
      </div>
    );
  }

  // ── Needs Login in External Browser ───────────────────────────────────────
  if (needsLogin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
        <div className="w-full max-w-sm border border-border bg-surface p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-surface-hover text-accent">
            <LogIn className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-sans text-lg font-bold text-text">เข้าสู่ระบบ Memo+</h2>
          <p className="mt-2 text-xs text-text-secondary">
            กรุณาเข้าสู่ระบบด้วยบัญชี LINE เพื่อจัดการงานและรายรับรายจ่ายของคุณ
          </p>
          <button
            onClick={() => loginFn && loginFn()}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-[#06C755] py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            เข้าสู่ระบบด้วย LINE
          </button>
        </div>
      </div>
    );
  }

  // ── Error Screen ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
        <div className="w-full max-w-sm border border-border bg-surface p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center bg-surface-hover text-danger">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-4 font-sans text-base font-bold text-text">เกิดข้อผิดพลาด</h2>
          <p className="mt-2 text-xs text-text-secondary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 flex w-full items-center justify-center gap-2 bg-accent py-2.5 text-xs font-medium text-accent-fg transition active:scale-95"
          >
            <RefreshCw className="h-4 w-4" /> ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: "/liff/dashboard", label: "หน้าแรก", icon: Home },
    { to: "/liff/income", label: "รายรับ", icon: TrendingUp },
    { to: "/liff/expenses", label: "รายจ่าย", icon: TrendingDown },
    { to: "/liff/tasks", label: "งาน", icon: CheckSquare },
    { to: "/liff/summary", label: "สรุป", icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-canvas font-sans text-text antialiased">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-sm">
        {/* ── Top Header ───────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            {user?.pictureUrl ? (
              <img
                src={user.pictureUrl}
                alt="Profile"
                className="h-8 w-8 rounded-full border border-border object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-hover text-xs font-semibold text-text">
                {user?.displayName?.charAt(0) || "M"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-text">Memo+</span>
                {user?.plan === "pro" && (
                  <span className="border border-accent/40 bg-accent/10 px-1 py-0.2 text-[9px] font-bold text-accent">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-[11px] text-text-muted">
                {user?.displayName ? `สวัสดี, ${user.displayName}` : "ผู้ช่วยส่วนตัว"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => window.location.reload()}
              title="รีเฟรชข้อมูล"
              className="flex h-8 w-8 items-center justify-center text-text-muted hover:text-text active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            {LiffAuth.isInClient() && (
              <button
                onClick={() => LiffAuth.close()}
                title="ปิดหน้าต่าง"
                className="flex h-8 w-8 items-center justify-center text-text-muted hover:text-danger active:scale-95"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </header>

        {/* ── Main Scrollable Page Content ─────────────────────────────────── */}
        <main className="flex-1 px-4 py-4 pb-24">
          <Outlet context={{ user }} />
        </main>

        {/* ── Mobile-first Bottom Navigation Bar ────────────────────────────── */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-md items-center justify-around py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to ||
                (item.to === "/liff/dashboard" && location.pathname === "/liff");
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex flex-col items-center justify-center px-3 py-1 text-center transition-colors active:scale-95 ${
                    isActive
                      ? "text-accent font-semibold"
                      : "text-text-muted hover:text-text"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
                  <span className="mt-1 text-[10px] tracking-tight">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
