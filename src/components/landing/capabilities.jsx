import { capabilities } from "@/lib/content";

export function Capabilities() {
  return (
    <section
      id="capabilities"
      className="border-b border-hairline bg-paper-dim px-6 py-20 md:px-10 md:py-28"
    >
      <div className="mx-auto grid max-w-edit grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4">
          <p className="mb-3 font-grotesk text-xs font-semibold uppercase tracking-[0.18em] text-accent">
            Services & Capabilities
          </p>
          <h2 className="font-grotesk text-4xl font-semibold tracking-tight text-ink md:text-5xl">
            What it actually does
          </h2>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ink-muted">
            Four pillars the system is built around — instant capture,
            conversational LINE bot, embedded LIFF micro-apps, and real-time edge sync.
          </p>
        </div>

        <div className="md:col-span-8">
          {capabilities.map((cap) => (
            <div
              key={cap.number}
              className="grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-2 border-t border-hairline/70 py-7 first:border-t-2"
            >
              <span className="font-grotesk text-sm font-semibold text-accent">
                {cap.number}
              </span>
              <div>
                <h3 className="font-grotesk text-lg font-semibold text-ink">
                  {cap.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                  {cap.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
