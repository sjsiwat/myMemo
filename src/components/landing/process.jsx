import { processSteps } from "@/lib/content";

export function Process() {
  return (
    <section id="process" className="border-b border-hairline px-6 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-edit">
        <p className="mb-4 font-grotesk text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Process & Principles
        </p>
        <h2 className="max-w-2xl font-grotesk text-4xl font-semibold tracking-tight text-ink md:text-5xl">
          Not just how it looks —
          <br />
          how it thinks.
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-ink-muted">
          Four principles the system answers to before any screen or webhook gets shipped.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-x-8 gap-y-14 border-t border-hairline pt-10 md:grid-cols-2">
          {processSteps.map((step) => (
            <div key={step.number}>
              <span className="font-serif text-3xl italic text-ink-faint">
                {step.number}
              </span>
              <h3 className="mt-3 font-grotesk text-xl font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
