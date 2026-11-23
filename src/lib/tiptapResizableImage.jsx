import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight, X } from "lucide-react";
import { useCallback, useRef } from "react";

const MIN_SIZE = 48;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

const ALIGN_FLEX = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

function ResizableImageView({ node, updateAttributes, selected, editor, deleteNode, getPos }) {
  const { src, alt, width, height, align = "left" } = node.attrs;
  const resizeState = useRef(null);

  const onResizePointerDown = useCallback(
    (e) => {
      if (!editor.isEditable) return;
      e.preventDefault();
      e.stopPropagation();
      editor.commands.setNodeSelection(getPos());

      const editorEl = editor.view.dom;
      const computed = window.getComputedStyle(editorEl);
      const padX = (parseFloat(computed.paddingLeft) || 0) + (parseFloat(computed.paddingRight) || 0);
      const maxW = Math.max(MIN_SIZE, editorEl.clientWidth - padX);

      resizeState.current = {
        startX: e.clientX,
        origW: width,
        ratio: width / height || 1,
        maxW,
      };

      function onMove(ev) {
        const s = resizeState.current;
        if (!s) return;
        const nextW = clamp(s.origW + (ev.clientX - s.startX), MIN_SIZE, s.maxW);
        const nextH = Math.max(MIN_SIZE, Math.round(nextW / s.ratio));
        updateAttributes({ width: Math.round(nextW), height: nextH });
      }
      function onUp() {
        resizeState.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [editor, updateAttributes, getPos, width, height]
  );

  return (
    <NodeViewWrapper
      as="div"
      data-resizable-image-wrapper=""
      className={`my-3 flex w-full ${ALIGN_FLEX[align] || ALIGN_FLEX.left}`}
    >
      <div
        style={{ width, maxWidth: "100%" }}
        onClick={() => editor.isEditable && editor.commands.setNodeSelection(getPos())}
        className={`relative inline-block ${selected ? "outline outline-2 outline-accent outline-offset-2" : ""
          }`}
      >
        <img
          src={src}
          alt={alt || ""}
          draggable={false}
          style={{ width: "100%", height: "auto", display: "block" }}
        />

        {selected && editor.isEditable && (
          <>
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute -top-9 right-0 z-20 flex items-center gap-0.5 border border-hairline bg-paper p-0.5"
            >
              {[
                { key: "left", label: "ชิดซ้าย", Icon: AlignLeft },
                { key: "center", label: "กึ่งกลาง", Icon: AlignCenter },
                { key: "right", label: "ชิดขวา", Icon: AlignRight },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  aria-label={label}
                  title={label}
                  onClick={() => updateAttributes({ align: key })}
                  className={`flex h-6 w-6 items-center justify-center border ${align === key
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-transparent text-ink-muted hover:border-hairline"
                    }`}
                >
                  <Icon size={12} aria-hidden />
                </button>
              ))}
              <button
                type="button"
                aria-label="ลบรูปภาพ"
                title="ลบรูปภาพ"
                onClick={() => deleteNode()}
                className="ml-0.5 flex h-6 w-6 items-center justify-center border border-transparent text-ink-muted hover:border-danger hover:text-danger"
              >
                <X size={12} aria-hidden />
              </button>
            </div>

            <div
              onPointerDown={onResizePointerDown}
              title="ลากเพื่อปรับขนาด"
              className="absolute -bottom-1.5 -right-1.5 z-20 h-3.5 w-3.5 cursor-nwse-resize border border-paper bg-accent"
            />
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

export const ResizableImage = Image.extend({
  name: "resizableImage",
  group: "block",
  inline: false,
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 360,
        parseHTML: (element) => parseFloat(element.getAttribute("data-width") || "360") || 360,
        renderHTML: (attributes) => ({ "data-width": attributes.width }),
      },
      height: {
        default: 240,
        parseHTML: (element) => parseFloat(element.getAttribute("data-height") || "240") || 240,
        renderHTML: (attributes) => ({ "data-height": attributes.height }),
      },
      align: {
        default: "left",
        parseHTML: (element) => element.getAttribute("data-align") || "left",
        renderHTML: (attributes) => ({ "data-align": attributes.align || "left" }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[data-resizable-image]" }, { tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const width = HTMLAttributes["data-width"] || 360;
    const align = HTMLAttributes["data-align"] || "left";
    const marginStyle =
      align === "center"
        ? "margin:0.75rem auto;"
        : align === "right"
          ? "margin:0.75rem 0 0.75rem auto;"
          : "margin:0.75rem auto 0.75rem 0;";
    const style = `display:block;width:${width}px;max-width:100%;height:auto;${marginStyle}`;
    return ["img", { ...HTMLAttributes, "data-resizable-image": "", style }];
  },

  addCommands() {
    return {
      setResizableImage:
        (options) =>
          ({ commands }) => {
            return commands.insertContent({ type: this.name, attrs: options });
          },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
