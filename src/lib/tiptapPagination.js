import { Extension, Node } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// Standard A4 @ 96 DPI (210mm x 297mm)
export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;
export const A4_GAP = 28;
export const A4_MARGIN_Y = 64;
export const A4_MARGIN_X = 64;
export const A4_STRIDE = A4_HEIGHT + A4_GAP;

const paginationPluginKey = new PluginKey("a4Pagination");

/**
 * Manual Page Break node (Ctrl/Cmd+Enter or Toolbar button).
 * Renders as a subtle hairline indicator and forces the next block onto a new A4 page.
 */
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  selectable: true,

  parseHTML() {
    return [{ tag: "hr[data-page-break]" }];
  },

  renderHTML() {
    return ["hr", { "data-page-break": "true", class: "doc-page-break" }];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ chain }) =>
          chain().insertContent([{ type: this.name }, { type: "paragraph" }]).run(),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.insertPageBreak(),
    };
  },
});

function computePagination(view) {
  const { doc } = view.state;
  const decorations = [];

  let page = 0;
  let cursorY = A4_MARGIN_Y;
  let maxPage = 0;

  doc.forEach((node, offset) => {
    const pos = offset;
    const dom = view.nodeDOM(pos);
    if (!(dom instanceof HTMLElement)) return;

    const style = window.getComputedStyle(dom);
    const marginBottom = parseFloat(style.marginBottom) || 0;
    const height = dom.getBoundingClientRect().height;

    const pageStart = page * A4_STRIDE + A4_MARGIN_Y;
    const pageContentBottom = page * A4_STRIDE + (A4_HEIGHT - A4_MARGIN_Y);

    if (node.type.name === "pageBreak") {
      // Advance directly to the top of the next A4 sheet
      const nextPage = page + 1;
      const nextPageStart = nextPage * A4_STRIDE + A4_MARGIN_Y;
      const pushAfter = Math.max(0, Math.round(nextPageStart - (cursorY + height)));
      if (pushAfter > 0) {
        decorations.push(
          Decoration.node(pos, pos + node.nodeSize, {
            style: `margin-bottom: ${pushAfter}px;`,
          })
        );
      }
      page = nextPage;
      cursorY = nextPageStart;
      maxPage = Math.max(maxPage, page);
      return;
    }

    // If this block overflows the current page's bottom margin (and isn't already
    // the very first block on the page), push it cleanly to the next A4 page.
    if (cursorY > pageStart + 1 && cursorY + height > pageContentBottom) {
      page += 1;
      const nextPageStart = page * A4_STRIDE + A4_MARGIN_Y;
      const extraMarginTop = Math.max(0, Math.round(nextPageStart - cursorY));
      if (extraMarginTop > 0) {
        decorations.push(
          Decoration.node(pos, pos + node.nodeSize, {
            style: `margin-top: ${extraMarginTop}px;`,
          })
        );
      }
      cursorY = nextPageStart + height + marginBottom;
    } else {
      cursorY += height + marginBottom;
    }

    const endPage = Math.floor(Math.max(0, cursorY - marginBottom - 1) / A4_STRIDE);
    if (endPage > page) page = endPage;
    maxPage = Math.max(maxPage, page);
  });

  const pageCount = Math.max(1, maxPage + 1);
  return {
    decorations: DecorationSet.create(doc, decorations),
    pageCount,
  };
}

/**
 * A4 Pagination extension: measures top-level block positions and applies
 * non-destructive ProseMirror node decorations so content flows across
 * discrete MS Word-style A4 sheets without mutating saved HTML.
 */
export const A4Pagination = Extension.create({
  name: "a4Pagination",

  addOptions() {
    return {
      onPageCountChange: null,
    };
  },

  addProseMirrorPlugins() {
    const onPageCountChange = this.options.onPageCountChange;

    return [
      new Plugin({
        key: paginationPluginKey,
        state: {
          init() {
            return { decorations: DecorationSet.empty, pageCount: 1 };
          },
          apply(tr, prev) {
            const meta = tr.getMeta(paginationPluginKey);
            if (meta) return meta;
            if (tr.docChanged) {
              return {
                ...prev,
                decorations: prev.decorations.map(tr.mapping, tr.doc),
              };
            }
            return prev;
          },
        },
        props: {
          decorations(state) {
            return paginationPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
          },
        },
        view(editorView) {
          let rafId = null;
          let lastSignature = "";
          let lastPageCount = 1;

          const scheduleMeasure = () => {
            if (rafId != null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
              rafId = null;
              if (editorView.isDestroyed) return;
              const next = computePagination(editorView);
              const sig = next.decorations
                .find()
                .map((d) => `${d.from}:${d.to}:${d.type?.attrs?.style || ""}`)
                .join("|");

              if (next.pageCount !== lastPageCount) {
                lastPageCount = next.pageCount;
                onPageCountChange?.(next.pageCount);
              }

              if (sig !== lastSignature) {
                lastSignature = sig;
                const tr = editorView.state.tr.setMeta(paginationPluginKey, next);
                tr.setMeta("addToHistory", false);
                editorView.dispatch(tr);
              }
            });
          };

          const resizeObserver = new ResizeObserver(scheduleMeasure);
          resizeObserver.observe(editorView.dom);
          scheduleMeasure();

          return {
            update(view, prevState) {
              if (!view.state.doc.eq(prevState.doc)) {
                scheduleMeasure();
              }
            },
            destroy() {
              if (rafId != null) cancelAnimationFrame(rafId);
              resizeObserver.disconnect();
            },
          };
        },
      }),
    ];
  },
});
