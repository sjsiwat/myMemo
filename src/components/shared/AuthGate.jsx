import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export function AuthGate({ auth }) {
  const [tab, setTab] = useState(auth.initialGateTab);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [localError, setLocalError] = useState(null);

  const error = localError ?? auth.gateError;

  async function handleLogin(e) {
    e.preventDefault();
    setLocalError(null);
    try {
      await auth.signInWithPassword(loginEmail, loginPassword);
    } catch {
      // gateError already set by the hook
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setLocalError(null);
    if (signupPassword !== signupConfirm) {
      setLocalError("รหัสผ่านไม่ตรงกัน");
      return;
    }
    try {
      await auth.signUp(signupEmail, signupPassword);
    } catch {
      // gateError already set by the hook
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12">
      <div className="mb-4 w-full max-w-sm">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted underline decoration-hairline underline-offset-4 hover:text-ink hover:decoration-accent"
        >
          <ArrowLeft size={12} aria-hidden />
          กลับหน้าแรก
        </Link>
      </div>
      <div className="w-full max-w-sm border border-hairline px-6 py-8">
        <img src="/johny-cat.svg" alt="" width={64} height={64} aria-hidden className="mx-auto opacity-90" />
        <h1 className="mt-4 text-center font-grotesk text-2xl font-semibold tracking-tight text-ink">
          Memo+
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-ink-muted">
          พื้นที่ทำงานส่วนตัว ต้องเข้าสู่ระบบก่อนใช้งาน Dashboard
        </p>

        {error && (
          <p role="alert" className="mt-4 border border-danger bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={auth.signInWithLine}
          className="mt-6 flex w-full items-center justify-center gap-2 bg-[#06C755] px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 2C6.48 2 2 6.06 2 11.07c0 4.49 3.66 8.25 8.6 8.93v2.77c0 .28.33.43.55.26l4.07-3.06c.07-.06.17-.09.27-.09C20.49 19.88 22 16.74 22 13.3 22 7.51 17.52 2 12 2z"
              fill="white"
            />
          </svg>
          Login with LINE
        </button>

        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-ink-faint">
          <span className="h-px flex-1 bg-hairline" />
          หรือ
          <span className="h-px flex-1 bg-hairline" />
        </div>

        <div role="tablist" className="flex border border-hairline">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "login"}
            onClick={() => setTab("login")}
            className={`flex-1 py-2 text-sm font-medium ${tab === "login" ? "bg-accent text-accent-fg" : "text-ink-muted"}`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "signup"}
            onClick={() => setTab("signup")}
            className={`flex-1 border-l border-accent py-2 text-sm font-medium ${tab === "signup" ? "bg-accent text-accent-fg" : "text-ink-muted"}`}
          >
            สมัครสมาชิก
          </button>
        </div>

        {tab === "login" ? (
          <form className="mt-4 flex flex-col gap-3" onSubmit={handleLogin}>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="อีเมล"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-hairline"
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="รหัสผ่าน"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              className="border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
            <button type="submit" className="bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-dim">
              เข้าสู่ระบบ
            </button>
          </form>
        ) : (
          <form className="mt-4 flex flex-col gap-3" onSubmit={handleSignup}>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="อีเมล"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              className="border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-hairline"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              className="border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-hairline"
            />
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="ยืนยันรหัสผ่าน"
              value={signupConfirm}
              onChange={(e) => setSignupConfirm(e.target.value)}
              className="border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-accent"
            />
            <button type="submit" className="bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:bg-accent-dim">
              สมัครสมาชิก
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
          ยังไม่ได้เพิ่ม LINE Bot?{" "}
          <a
            href="https://lin.ee/Z7Lx7qx"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline decoration-hairline underline-offset-4 hover:decoration-accent"
          >
            เพิ่มเพื่อนก่อน →
          </a>
        </p>
      </div>
    </div>
  );
}
