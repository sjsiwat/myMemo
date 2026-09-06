# Design Rules

Always reference:

src/styles/globals.css

Its `--c-*` token block is the source of truth for the visual design system.
`docs/DESIGN.md` is the prose companion, but it is gitignored and local-only —
never assume it is present, and never trust it over the CSS.

Extract and apply:

- colors (warm neutral canvas, one muted purple accent)
- spacing
- hierarchy
- typography (Mitr for Latin and Thai, Newsreader italic for numerals)
- component style
- visual rhythm

Apply them to Memo+.

Design style:

Swiss Minimal x Warm Luxury x Personal OS. Warm neutrals carry ~90% of the
surface, one muted purple accent ~8%, status colors ~2%. The accent (`#756580`
light / `#8A7899` dark) carries action, hover, focus, and brand emphasis — never
blue, never orange. Amber is priority and warning only, green success only, red
danger only. Zero border-radius, zero elevation, no gradients or glows; depth
comes from 1px hairlines and a small surface-to-canvas delta. Rounded shapes are
allowed only where documented: status dots, expense bar ends, the calendar day
disc, Kanban pill badges.

Light and dark are one system:

Components name a token; `:root` and `html[data-theme="dark"]` swap its value
underneath. Never write a `dark:` color utility — there are zero in `src/`, and
adding one is a regression. Never hardcode a hex in a component. Derive tints
from the same token as the solid (`rgb(var(--c-x) / 0.14)`); building one by
concatenating hex alpha onto a color has shipped as a bug four separate times.
Pair `bg-accent` with `text-accent-fg`, never `text-paper` — that reads fine in
light mode and fails contrast in dark.
