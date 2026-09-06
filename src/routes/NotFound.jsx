import { Link } from "react-router-dom";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Memo+ — ไม่พบหน้านี้");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-canvas px-6 text-center">
      <p className="font-grotesk text-xs font-semibold uppercase tracking-[0.18em] text-accent">404</p>
      <h1 className="font-grotesk text-3xl font-semibold tracking-tight text-ink">ไม่พบหน้าที่คุณต้องการ</h1>
      <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
        ลิงก์อาจเปลี่ยนไปแล้ว หรือพิมพ์ที่อยู่ผิด
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex items-center border border-accent bg-accent px-5 py-3 text-sm font-medium text-accent-fg transition-colors hover:border-accent-dim hover:bg-accent-dim"
      >
        กลับหน้าแรก
      </Link>
    </main>
  );
}
