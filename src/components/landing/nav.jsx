import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { appUrl, navLinks, signupAppUrl } from "@/lib/content";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-edit items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-4">
          <NotifyLink />
          <span className="h-5 w-px bg-hairline" aria-hidden="true" />
          <Link
            to="/"
            className="font-grotesk text-lg font-semibold tracking-tight text-ink"
          >
            Memo+
          </Link>
        </div>

        <nav className="hidden items-center gap-10 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <NavItem key={link.href} label={link.label} href={link.href} />
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to={appUrl}
            className="inline-flex items-center px-5 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:text-accent"
          >
            Log in
          </Link>
          <Link
            to={signupAppUrl}
            className="inline-flex items-center px-5 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:text-accent"
          >
            Sign Up
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center p-2 text-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>

      <div
        id="mobile-menu"
        inert={!open}
        className={`grid overflow-hidden border-hairline bg-paper transition-[grid-template-rows,opacity] duration-300 ease-swiss md:hidden ${
 open ? "grid-rows-[1fr] border-t opacity-100" : "grid-rows-[0fr] border-t-0 opacity-0"
 }`}
      >
        <nav className="flex min-h-0 flex-col px-6" aria-label="Mobile">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setOpen(false)}
              className="border-b border-hairline py-4 text-base text-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to={appUrl}
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-ink"
          >
            Log in
          </Link>
          <Link
            to={signupAppUrl}
            onClick={() => setOpen(false)}
            className="mb-4 inline-flex items-center justify-center px-5 py-3 text-sm font-medium text-ink"
          >
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
}

// Shortcut to the companion app (notify.siwat.me) — its own login gate
// keeps anyone but the owner out, so this link is safe to show publicly.
function NotifyLink() {
  return (
    <a
      href="https://notify.siwat.me"
      target="_blank"
      rel="noopener noreferrer"
      title="notify"
      aria-label="Open notify"
      className="inline-flex shrink-0 transition-transform duration-200 hover:-rotate-6"
    >
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="7" fill="#fffbf2" stroke="#18130f" strokeWidth="2" />
        <path fill="#18130f" d="M6 14 3 3l10 7z" />
        <path fill="#18130f" d="M26 14 29 3l-10 7z" />
        <circle cx="16" cy="18" r="11" fill="#18130f" />
        <circle cx="12" cy="17" r="1.4" fill="#ff441c" />
        <circle cx="20" cy="17" r="1.4" fill="#ff441c" />
        <path d="M15 21l1 1 1-1z" fill="#fffbf2" />
      </svg>
    </a>
  );
}

function NavItem({ label, href }) {
  return (
    <Link
      to={href}
      className="group relative text-sm font-medium text-ink-muted transition-colors duration-200 hover:text-ink"
    >
      {label}
      <span className="absolute -bottom-1 left-0 h-px w-0 bg-accent transition-all duration-300 ease-swiss group-hover:w-full" />
    </Link>
  );
}
