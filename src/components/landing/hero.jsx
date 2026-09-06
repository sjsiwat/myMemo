import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const flow = [
  {
    label: "Capture",
    detail: "A message on LINE, a tap in the app, one line of text.",
  },
  {
    label: "Organize",
    detail: "Sorted into a task, a note, or an expense — automatically.",
  },
  {
    label: "Recall",
    detail: "Surfaced on the dashboard exactly when it's needed.",
  },
];

const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1]  },
  }),
};

export function Hero() {
  return (
    <section id="top" className="relative border-b border-hairline">
      <div className="mx-auto grid max-w-edit grid-cols-1 gap-12 px-6 py-16 md:grid-cols-12 md:gap-8 md:px-10 md:py-24">
        {/* Left — masthead */}
        <div className="md:col-span-7">
          <motion.p
            initial="hidden"
            animate="show"
            custom={0}
            variants={reveal}
            className="mb-6 font-grotesk text-xs font-semibold uppercase tracking-[0.18em] text-accent"
          >
            Personal Operating System — 2026
          </motion.p>

          <motion.h1
            initial="hidden"
            animate="show"
            custom={1}
            variants={reveal}
            className="max-w-xl font-grotesk text-[13vw] font-semibold leading-[0.95] tracking-tight text-ink sm:text-6xl md:text-7xl"
          >
            Memo
            <br />
            +
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="show"
            custom={2}
            variants={reveal}
            className="mt-8 max-w-md text-lg leading-relaxed text-ink-muted"
          >
            A private workspace for one person&apos;s tasks, notes, and money —
            captured in a single line, on LINE or off it, and stored on your
            device before it ever touches a server.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="show"
            custom={3}
            variants={reveal}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/about#index"
              className="inline-flex items-center border border-hairline px-6 py-3 text-sm font-medium text-ink transition-colors duration-200 hover:bg-accent hover:text-accent-fg"
            >
              See what it does
            </Link>
          </motion.div>
        </div>

        {/* Right — mascot + real LINE QR, asymmetric, not centered */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-start gap-6 md:col-span-5 md:items-end"
        >
          <img
            src="/johny-cat.svg"
            alt="Johny, the Memo+ mascot cat"
            width={132}
            height={132}
            fetchPriority="high"
            className="opacity-95"
          />

          <div className="w-full max-w-[220px] border border-hairline/80 bg-paper p-4 text-left">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink">
              Add on LINE
            </p>
            <img
              src="https://qr-official.line.me/gs/M_324ywxny_GW.png?oat_content=qr"
              alt="QR code to add Memo+ as a LINE friend"
              width={220}
              height={220}
              loading="lazy"
              className="w-full grayscale contrast-125"
            />
            <p className="mt-3 text-[13px] text-ink-muted">
              Scan with LINE Camera, or{" "}
              <a
                href="https://line.me/R/ti/p/M_324ywxny"
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline decoration-hairline underline-offset-4 hover:decoration-accent"
              >
                open in LINE
              </a>
              .
            </p>
          </div>
        </motion.div>
      </div>

      {/* Constructed system diagram — no stock photo, no dashboard mockup */}
      <div className="border-t border-hairline bg-paper-dim">
        <div className="mx-auto max-w-edit px-6 py-10 md:px-10">
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
            How a thought becomes a record
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-0">
            {flow.map((step, i) => (
              <div key={step.label} className="relative flex items-start gap-4 md:block">
                <div className="flex items-center gap-3 md:mb-4">
                  <span className="font-serif text-2xl italic text-accent">
                    0{i + 1}
                  </span>
                  <span className="font-grotesk text-base font-semibold text-ink">
                    {step.label}
                  </span>
                </div>
                <p className="max-w-[26ch] text-sm leading-relaxed text-ink-muted md:pl-0">
                  {step.detail}
                </p>
                {i < flow.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute right-[-1rem] top-3 hidden h-px w-8 bg-ink-faint md:block"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
