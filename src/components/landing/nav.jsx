import { Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { appUrl, navLinks, signupAppUrl } from "@/lib/content";

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-edit items-center justify-between px-6 py-5 md:px-10">
        <Link
          to="/"
          className="font-grotesk text-lg font-semibold tracking-tight text-ink"
        >
          Memo+
        </Link>

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
