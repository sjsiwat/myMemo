import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  Home,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  PieChart,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
  ArrowRight,
  User,
  ShieldCheck,
  X,
} from "lucide-react";
import { LiffAuth } from "@/lib/liff";

export default function LiffMenuPage() {
  const { user } = useOutletContext();
  const [copiedCmd, setCopiedCmd] = useState(null);

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const navLinks = [
    {
      to: "/liff/dashboard",
      title: "🏠 หน้าหลัก",
      desc: "แดชบอร์ดสรุปภาพรวมสถานะการเงินและงาน",
      icon: Home,
    },
    {
      to: "/liff/income",
      title: "💰 รายรับ",
      desc: "จัดการและบันทึกเงินเดือน โบนัส หรือรายได้",
      icon: TrendingUp,
    },
    {
      to: "/liff/expenses",
      title: "💸 รายจ่าย",
      desc: "บันทึกและตรวจสอบค่าใช้จ่ายประจำวัน",
      icon: TrendingDown,
    },
    {
      to: "/liff/tasks",
      title: "📋 งาน",
      desc: "รายการงานค้าง ติ๊กเสร็จ หรือเลือกลบพร้อมกัน",
      icon: CheckSquare,
    },
    {
      to: "/liff/summary",
      title: "📊 สรุป",
      desc: "สถิติและอัตราส่วนรายรับรายจ่ายแบบละเอียด",
      icon: PieChart,
    },
  ];

  const commandGroups = [
    {
      title: "💸 รายจ่าย (Expenses)",
      desc: "พิมพ์คำว่า จ่าย ตามด้วยชื่อและจำนวนเงิน",
      commands: [
        { text: "จ่าย กาแฟ 50", desc: "บันทึกรายจ่ายด่วน" },
        { text: "จ่าย ข้าวผัดแหนม 80 อาหาร", desc: "ระบุหมวดหมู่ต่อท้าย" },
        { text: "จ่ายปลาลุกฟู 70บาท", desc: "พิมพ์ติดกันได้" },
        { text: "รายจ่าย", desc: "ดูสรุปรายจ่ายวันนี้ในแชท" },
      ],
    },
    {
      title: "💰 รายรับ (Incomes)",
      desc: "พิมพ์คำว่า รับ ตามด้วยชื่อและจำนวนเงิน",
      commands: [
        { text: "รับ เงินเดือน 30000", desc: "บันทึกเงินเดือน" },
        { text: "รับ ค่าสอน 1500", desc: "บันทึกรายได้พิเศษ" },
        { text: "รับ 800 ขายของ", desc: "ใส่จำนวนเงินขึ้นก่อนได้" },
        { text: "รายรับ", desc: "เปิดดูหน้าจัดการรายรับ" },
      ],
    },
    {
      title: "📋 จัดการงาน (Tasks)",
      desc: "พิมพ์ +งาน หรือ เพิ่มงาน ตามด้วยชื่องาน",
      commands: [
        { text: "+งาน ส่งรายงานประจำสัปดาห์", desc: "เพิ่มงานใหม่ทันที" },
        { text: "งานค้าง", desc: "ดูรายการงานที่ยังค้างในแชท" },
        { text: "งานเสร็จ", desc: "ดูรายการงานที่เสร็จแล้ว" },
        { text: "สรุปงานค้าง", desc: "เปิดหน้าเว็บเพื่อเลือกลบหลายงาน" },
      ],
    },
    {
      title: "📊 สรุปและข้อมูลทั่วไป (Overview & General)",
      desc: "คำสั่งดูภาพรวมและเปิดแอป",
      commands: [
        { text: "สรุป", desc: "เปิดแดชบอร์ดสรุปภาพรวมทั้งหมด" },
        { text: "เมนู", desc: "เปิดหน้าเมนูและคำสั่ง" },
        { text: "คำสั่ง", desc: "ดูคู่มือคำสั่งในแชท" },
        { text: "สถานะ", desc: "ตรวจสอบสถานะบัญชีและการเชื่อมต่อ" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-border pb-4">
        <h1 className="font-sans text-lg font-bold text-text">⚙️ เมนูและคำสั่ง Memo+</h1>
        <p className="mt-1 text-xs text-text-secondary">
          ศูนย์รวมทางลัดการใช้งาน และคู่มือคำสั่งด่วนสำหรับ LINE Bot
        </p>
      </div>

      {/* ── Section 1: Navigation Shortcuts ─────────────────────────────────── */}
      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
          <span>🚀 ทางลัดหน้าเว็บ Memo+</span>
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center justify-between border border-border bg-surface p-3 transition hover:border-accent hover:bg-surface-hover active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center border border-border bg-canvas text-accent group-hover:bg-accent group-hover:text-accent-fg">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-text">{item.title}</h3>
                    <p className="text-[11px] text-text-secondary">{item.desc}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: LINE Bot Commands ────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>คำสั่งด่วนในแชท LINE (Quick Capture)</span>
          </h2>
          <span className="text-[10px] text-text-muted">แตะเพื่อคัดลอก</span>
        </div>

        {commandGroups.map((group, gIdx) => (
          <div key={gIdx} className="border border-border bg-surface p-3.5">
            <h3 className="text-xs font-bold text-text">{group.title}</h3>
            <p className="mt-0.5 text-[11px] text-text-secondary">{group.desc}</p>

            <div className="mt-3 space-y-1.5">
              {group.commands.map((cmd, cIdx) => {
                const isCopied = copiedCmd === cmd.text;
                return (
                  <button
                    key={cIdx}
                    onClick={() => copyToClipboard(cmd.text)}
                    className="flex w-full items-center justify-between border border-border/70 bg-canvas px-3 py-2 text-left transition hover:border-accent/50 hover:bg-surface-hover active:scale-[0.99]"
                  >
                    <div>
                      <div className="font-mono text-xs font-semibold text-text">
                        {cmd.text}
                      </div>
                      <div className="text-[10px] text-text-muted">{cmd.desc}</div>
                    </div>
                    <div className="ml-2 flex h-7 w-7 items-center justify-center text-text-muted transition">
                      {isCopied ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 hover:text-text" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Section 3: Smart Thai Parsing Tips ──────────────────────────────── */}
      <div className="border border-border bg-surface p-4">
        <h3 className="flex items-center gap-2 text-xs font-bold text-text">
          <HelpCircle className="h-4 w-4 text-accent" />
          <span>เคล็ดลับการพิมพ์สั่ง</span>
        </h3>
        <ul className="mt-2.5 space-y-1.5 text-[11px] leading-relaxed text-text-secondary">
          <li>
            • <strong className="text-text">พิมพ์ติดกันได้:</strong> ไม่จำเป็นต้องเว้นวรรค เช่น{" "}
            <code className="bg-canvas px-1 py-0.5 font-mono text-[10px]">รับเงินเดือน10000บาท</code> หรือ{" "}
            <code className="bg-canvas px-1 py-0.5 font-mono text-[10px]">จ่ายค่ากาแฟ50</code>
          </li>
          <li>
            • <strong className="text-text">สลับตำแหน่งได้:</strong> ใส่จำนวนเงินก่อนหรือหลังก็ได้ เช่น{" "}
            <code className="bg-canvas px-1 py-0.5 font-mono text-[10px]">จ่าย 50 กาแฟ</code>
          </li>
          <li>
            • <strong className="text-text">ใส่จุลภาคได้:</strong> เช่น{" "}
            <code className="bg-canvas px-1 py-0.5 font-mono text-[10px]">รับ เงินเดือน 30,000 บาท</code>
          </li>
          <li>
            • <strong className="text-text">คุยทั่วไปได้:</strong> สอบถามข้อมูล หรือคุยกับ Johny AI ได้ตลอดเวลา
          </li>
        </ul>
      </div>

      {/* ── Section 4: Account Info & Close ─────────────────────────────────── */}
      <div className="border border-border bg-surface p-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-canvas text-accent">
              <User className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-text">
                {user?.displayName || "ผู้ใช้งาน Memo+"}
              </div>
              <div className="text-[10px] text-text-muted">
                {user?.plan === "pro" ? "บัญชีระดับ PRO" : "บัญชี Memo+ สแตนดาร์ด"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-success">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>เชื่อมต่อแล้ว</span>
          </div>
        </div>

        {LiffAuth.isInClient() && (
          <button
            onClick={() => LiffAuth.close()}
            className="mt-4 flex w-full items-center justify-center gap-1.5 border border-border bg-canvas py-2 text-xs font-semibold text-text transition hover:bg-surface-hover active:scale-95"
          >
            <X className="h-3.5 w-3.5" /> ปิดหน้าต่าง Memo+
          </button>
        )}
      </div>
    </div>
  );
}
