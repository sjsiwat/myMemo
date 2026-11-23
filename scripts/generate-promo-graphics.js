#!/usr/bin/env node

/**
 * Generates official Social Media Promotional Graphics for Memo+
 * adhering strictly to Swiss Minimal × Warm Luxury × Personal OS design rules.
 *
 * Outputs:
 * 1. promo-01-cover.png (1080 × 1350 px, Instagram / Facebook Portrait Slide 1)
 * 2. promo-02-features.png (1080 × 1350 px, 4 Core Features Slide 2)
 * 3. promo-03-commands.png (1080 × 1350 px, LINE Bot Cheat Sheet Slide 3)
 * 4. promo-04-richmenu.png (1080 × 1350 px, Rich Menu & Quick Start Slide 4)
 * 5. promo-all-in-one.png (1200 × 1600 px, All-in-One Master Infographic)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../assets/promo');
const QR_PATH = path.resolve(__dirname, '../assets/qr-code.png');
const MASCOT_PATH = path.resolve(__dirname, '../public/johny-cat.svg');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read assets as data URI for 100% reliable offline rendering
let qrDataUri = '';
if (fs.existsSync(QR_PATH)) {
  const qrBuffer = fs.readFileSync(QR_PATH);
  qrDataUri = `data:image/png;base64,${qrBuffer.toString('base64')}`;
}

let mascotSvg = '';
if (fs.existsSync(MASCOT_PATH)) {
  mascotSvg = fs.readFileSync(MASCOT_PATH, 'utf8');
}

// Common styles & tokens from AGENTS.md
const commonHead = `
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Mitr:wght@300;400;500;600;700&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500;1,6..72,600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }

    :root {
      --c-canvas: #F7F6F2;
      --c-paper: #FFFFFF;
      --c-paper-dim: #F0EFEA;
      --c-hairline: #DDDAD2;
      --c-hairline-dark: #C9C5BB;
      --c-ink: #1C1C1C;
      --c-ink-muted: #6F6B63;
      --c-ink-faint: #9A968D;
      --c-accent: #756580;
      --c-accent-fg: #FFFFFF;
      --c-accent-dim: #63546D;
      --c-success: #2E7D32;
      --c-success-bg: rgba(46, 125, 50, 0.08);
      --c-danger: #C62828;
      --c-danger-bg: rgba(198, 40, 40, 0.08);
      --c-warning: #E65100;
      --c-warning-bg: rgba(230, 81, 0, 0.08);
    }

    body {
      background-color: var(--c-canvas);
      font-family: 'Mitr', -apple-system, BlinkMacSystemFont, 'Sukhumvit Set', sans-serif;
      color: var(--c-ink);
      overflow: hidden;
    }

    .font-num {
      font-family: 'Newsreader', Georgia, serif;
      font-style: italic;
    }

    .tag {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--c-accent);
    }

    .card {
      background-color: var(--c-paper);
      border: 1.5px solid var(--c-hairline);
    }

    .code-pill {
      display: inline-block;
      padding: 6px 14px;
      background-color: var(--c-paper-dim);
      border: 1px solid var(--c-hairline);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 16px;
      color: var(--c-ink);
      font-weight: 600;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
  </style>
`;

// ── Slide 1: Cover & Overview (1080 × 1350) ──────────────────────────────────
const slide1Html = `<!DOCTYPE html>
<html lang="th">
<head>
  <title>Memo+ Promo 1 - Cover</title>
  ${commonHead}
  <style>
    body {
      width: 1080px;
      height: 1350px;
      padding: 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid var(--c-hairline);
      padding-bottom: 24px;
    }

    .brand-title {
      font-size: 32px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--c-ink);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .brand-plus {
      color: var(--c-accent);
    }

    .hero-wrap {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 10px;
    }

    .mascot-row {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .mascot-box {
      width: 84px;
      height: 84px;
      background: var(--c-paper);
      border: 1.5px solid var(--c-hairline);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
    }

    .hero-title {
      font-size: 64px;
      font-weight: 700;
      line-height: 1.08;
      letter-spacing: -0.02em;
      color: var(--c-ink);
    }

    .hero-desc {
      font-size: 24px;
      line-height: 1.45;
      color: var(--c-ink-muted);
      max-width: 860px;
      font-weight: 400;
    }

    .pillars-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .pillar-card {
      padding: 26px 28px;
      background: var(--c-paper);
      border: 1.5px solid var(--c-hairline);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 195px;
    }

    .pillar-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .pillar-num {
      font-size: 28px;
      color: var(--c-accent);
    }

    .pillar-tag {
      font-size: 13px;
      letter-spacing: 0.14em;
      color: var(--c-ink-faint);
      font-weight: 600;
    }

    .pillar-title {
      font-size: 24px;
      font-weight: 600;
      color: var(--c-ink);
      margin-top: 8px;
    }

    .pillar-desc {
      font-size: 16px;
      line-height: 1.4;
      color: var(--c-ink-muted);
      margin-top: 6px;
    }

    .footer-bar {
      border-top: 1.5px solid var(--c-hairline);
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cta-box {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .qr-img {
      width: 90px;
      height: 90px;
      border: 1.5px solid var(--c-hairline);
      background: #FFFFFF;
      padding: 4px;
    }

    .cta-text-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--c-ink);
    }

    .cta-text-sub {
      font-size: 15px;
      color: var(--c-ink-muted);
      margin-top: 2px;
    }

    .line-id-pill {
      background: var(--c-accent);
      color: var(--c-accent-fg);
      padding: 10px 20px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.05em;
    }
  </style>
</head>
<body>

  <div class="header-bar">
    <div class="brand-title">
      Memo<span class="brand-plus">+</span>
    </div>
    <div class="tag">PERSONAL OPERATING SYSTEM</div>
  </div>

  <div class="hero-wrap">
    <div class="mascot-row">
      <div class="mascot-box">
        ${mascotSvg}
      </div>
      <div>
        <p class="tag">ALL-IN-ONE LINE ASSISTANT</p>
        <p style="font-size: 16px; color: var(--c-ink-faint); margin-top: 2px;">โดย Johny Chatbot</p>
      </div>
    </div>

    <h1 class="hero-title">
      ผู้ช่วยส่วนตัวบน LINE<br>
      จัดการทุกสิ่งในที่เดียว
    </h1>

    <p class="hero-desc">
      บันทึกรายรับ-รายจ่าย • ติดตามงานที่ต้องทำ • จดโน้ตความคิด<br>
      จบครบในห้องแชตเดียว รวดเร็ว ไร้สิ่งรบกวนตา พร้อมเชื่อมต่อ Web App ทันที
    </p>
  </div>

  <div class="pillars-grid">
    <div class="pillar-card">
      <div class="pillar-top">
        <span class="pillar-num font-num">01</span>
        <span class="pillar-tag">LINE CHATBOT</span>
      </div>
      <div>
        <h3 class="pillar-title">พิมพ์คุยเหมือนเพื่อน</h3>
        <p class="pillar-desc">ส่งข้อความภาษาไทยสั้นๆ ระบบแยกประเภทและบันทึกอัตโนมัติในเสี้ยววินาที</p>
      </div>
    </div>

    <div class="pillar-card">
      <div class="pillar-top">
        <span class="pillar-num font-num">02</span>
        <span class="pillar-tag">RICH MENU</span>
      </div>
      <div>
        <h3 class="pillar-title">เมนู 6 ช่องใช้งานง่าย</h3>
        <p class="pillar-desc">แตะดูสรุปยอดเงิน บอร์ดงาน และประวัติบันทึกได้ทันทีที่ด้านล่างห้องแชต</p>
      </div>
    </div>

    <div class="pillar-card">
      <div class="pillar-top">
        <span class="pillar-num font-num">03</span>
        <span class="pillar-tag">LIFF MICRO-APPS</span>
      </div>
      <div>
        <h3 class="pillar-title">เปิดบอร์ดงานใน LINE</h3>
        <p class="pillar-desc">ดูบอร์ดงาน Kanban และรายงานการเงินแบบโต้ตอบได้ โดยไม่ต้องออกจากแอป</p>
      </div>
    </div>

    <div class="pillar-card">
      <div class="pillar-top">
        <span class="pillar-num font-num">04</span>
        <span class="pillar-tag">CLOUD EDGE SYNC</span>
      </div>
      <div>
        <h3 class="pillar-title">ซิงก์เรียลไทม์ทุกอุปกรณ์</h3>
        <p class="pillar-desc">พัฒนาบน Cloudflare & Supabase ข้อมูลเชื่อมต่อกับเว็บ memo.siwat.me ปลอดภัย</p>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <div class="cta-box">
      <img src="${qrDataUri}" class="qr-img" alt="LINE QR Code">
      <div>
        <div class="cta-text-title">สแกนเพื่อเริ่มใช้งานฟรี</div>
        <div class="cta-text-sub">ค้นหา LINE ID: @324ywxny</div>
      </div>
    </div>

    <div class="line-id-pill">
      ADD LINE: @324ywxny
    </div>
  </div>

</body>
</html>`;

// ── Slide 2: 4 Core Features (1080 × 1350) ───────────────────────────────────
const slide2Html = `<!DOCTYPE html>
<html lang="th">
<head>
  <title>Memo+ Promo 2 - Features</title>
  ${commonHead}
  <style>
    body {
      width: 1080px;
      height: 1350px;
      padding: 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid var(--c-hairline);
      padding-bottom: 24px;
    }

    .brand-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--c-ink);
    }

    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 18px;
      margin: 18px 0;
    }

    .feature-item {
      background: var(--c-paper);
      border: 1.5px solid var(--c-hairline);
      padding: 24px 28px;
      display: grid;
      grid-template-columns: 80px 1fr 240px;
      gap: 20px;
      align-items: center;
    }

    .feature-num {
      font-size: 42px;
      color: var(--c-accent);
      line-height: 1;
    }

    .feature-name {
      font-size: 24px;
      font-weight: 600;
      color: var(--c-ink);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .feature-desc {
      font-size: 16px;
      color: var(--c-ink-muted);
      line-height: 1.45;
      margin-top: 6px;
    }

    .feature-preview {
      background: var(--c-paper-dim);
      border: 1px solid var(--c-hairline);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .preview-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.12em;
      color: var(--c-ink-faint);
      text-transform: uppercase;
    }

    .preview-val {
      font-size: 17px;
      font-weight: 600;
      color: var(--c-ink);
    }

    .footer-bar {
      border-top: 1.5px solid var(--c-hairline);
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <div class="header-bar">
    <div class="brand-title">Memo+</div>
    <div class="tag">4 CORE FEATURES</div>
  </div>

  <div>
    <p class="tag">CAPABILITIES</p>
    <h1 style="font-size: 52px; font-weight: 700; margin-top: 6px; letter-spacing: -0.02em;">
      4 ฟีเจอร์หลัก จัดการชีวิตประจำวัน
    </h1>
    <p style="font-size: 20px; color: var(--c-ink-muted); margin-top: 8px;">
      เปลี่ยนข้อความแชตสั้นๆ ให้กลายเป็นระบบจัดการข้อมูลส่วนตัวที่เป็นระเบียบ
    </p>
  </div>

  <div class="feature-list">

    <!-- Feature 1 -->
    <div class="feature-item">
      <div class="feature-num font-num">01</div>
      <div>
        <div class="feature-name">
          <span>💸 บันทึกรายจ่าย (Expenses Tracker)</span>
        </div>
        <div class="feature-desc">
          พิมพ์บอกบอท เช่น "จ่ายกาแฟ 65" หรือ "ค่าข้าว 80" ระบบแยกหมวดหมู่อาหาร เดินทาง ช้อปปิ้ง บิล ให้ทันที พร้อมคำนวณยอดรวมรายวัน
        </div>
      </div>
      <div class="feature-preview">
        <span class="preview-label">ตัวอย่างพิมพ์แชต</span>
        <span class="preview-val">"จ่าย ข้าวผัด 60"</span>
        <span style="font-size: 13px; color: var(--c-danger);">➔ บันทึกหมวด: อาหาร</span>
      </div>
    </div>

    <!-- Feature 2 -->
    <div class="feature-item">
      <div class="feature-num font-num">02</div>
      <div>
        <div class="feature-name">
          <span>💰 บันทึกรายรับ (Income Tracker)</span>
        </div>
        <div class="feature-desc">
          บันทึกเงินเดือน โบนัส หรือรายได้เสริม เช่น "รับเงินเดือน 30000" หรือ "ได้เงิน 500" ระบบคำนวณรายรับสุทธิเทียบกับรายจ่ายแบบเรียลไทม์
        </div>
      </div>
      <div class="feature-preview">
        <span class="preview-label">ตัวอย่างพิมพ์แชต</span>
        <span class="preview-val">"รับ เงินเดือน 30000"</span>
        <span style="font-size: 13px; color: var(--c-success);">➔ บันทึกหมวด: เงินเดือน</span>
      </div>
    </div>

    <!-- Feature 3 -->
    <div class="feature-item">
      <div class="feature-num font-num">03</div>
      <div>
        <div class="feature-name">
          <span>📋 จัดการงานค้าง (Tasks & Kanban)</span>
        </div>
        <div class="feature-desc">
          สร้างงานพร้อมติดแท็กความสำคัญ เช่น "เพิ่มงาน ส่งสไลด์ #urgent" เปิดดูกระดาน Kanban ใน LINE LIFF และเช็กสถานะความคืบหน้าได้ตลอดเวลา
        </div>
      </div>
      <div class="feature-preview">
        <span class="preview-label">ตัวอย่างพิมพ์แชต</span>
        <span class="preview-val">"เพิ่มงาน สรุปบัญชี #urgent"</span>
        <span style="font-size: 13px; color: var(--c-warning);">➔ บันทึกงานด่วนลงบอร์ด</span>
      </div>
    </div>

    <!-- Feature 4 -->
    <div class="feature-item">
      <div class="feature-num font-num">04</div>
      <div>
        <div class="feature-name">
          <span>📝 จดโน้ตความคิด (Quick Notes)</span>
        </div>
        <div class="feature-desc">
          บันทึกไอเดีย ข้อมูลสำคัญ เลขที่บัญชี หรือที่จอดรถ ผ่านแชต LINE ติดแท็กค้นหาง่าย ไม่ต้องกลัวข้อความสำคัญตกหล่น
        </div>
      </div>
      <div class="feature-preview">
        <span class="preview-label">ตัวอย่างพิมพ์แชต</span>
        <span class="preview-val">"โน้ต ที่จอดรถชั้น 3A #memo"</span>
        <span style="font-size: 13px; color: var(--c-accent);">➔ ค้นหาคืนได้ทันที</span>
      </div>
    </div>

  </div>

  <div class="footer-bar">
    <div style="font-size: 16px; color: var(--c-ink-muted);">
      Memo+ — Built for one person's everyday calm.
    </div>
    <div class="tag">
      LINE ID: @324ywxny
    </div>
  </div>

</body>
</html>`;

// ── Slide 3: LINE Bot Command Cheat-Sheet (1080 × 1350) ──────────────────────
const slide3Html = `<!DOCTYPE html>
<html lang="th">
<head>
  <title>Memo+ Promo 3 - Cheat Sheet</title>
  ${commonHead}
  <style>
    body {
      width: 1080px;
      height: 1350px;
      padding: 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid var(--c-hairline);
      padding-bottom: 24px;
    }

    .brand-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--c-ink);
    }

    .sections-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }

    .command-box {
      background: var(--c-paper);
      border: 1.5px solid var(--c-hairline);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .cmd-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--c-hairline);
      padding-bottom: 10px;
    }

    .cmd-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--c-ink);
    }

    .cmd-row {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .cmd-desc {
      font-size: 13px;
      color: var(--c-ink-muted);
    }

    .tip-box {
      background: var(--c-paper-dim);
      border: 1.5px solid var(--c-hairline);
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .footer-bar {
      border-top: 1.5px solid var(--c-hairline);
      padding-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <div class="header-bar">
    <div class="brand-title">Memo+</div>
    <div class="tag">COMMAND CHEAT-SHEET</div>
  </div>

  <div>
    <p class="tag">EASY TO USE</p>
    <h1 style="font-size: 50px; font-weight: 700; margin-top: 6px; letter-spacing: -0.02em;">
      รวมคำสั่งพิมพ์คุยกับบอท Johny
    </h1>
    <p style="font-size: 18px; color: var(--c-ink-muted); margin-top: 6px;">
      พิมพ์สั้นๆ บรรทัดเดียวในแชต LINE ระบบเข้าใจภาษาไทยและบันทึกอัตโนมัติทันที
    </p>
  </div>

  <div class="sections-grid">

    <!-- Box 1: รายจ่าย -->
    <div class="command-box">
      <div class="cmd-header">
        <span class="cmd-title">💸 บันทึกรายจ่าย</span>
        <span class="status-badge" style="background: var(--c-danger-bg); color: var(--c-danger);">EXPENSES</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">จ่าย กาแฟ 65</span>
        <span class="cmd-desc">บันทึกกาแฟ 65 บาท (หมวดอาหาร)</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">ค่าข้าว 80</span>
        <span class="cmd-desc">พิมพ์แค่ "ค่าข้าว" บอทก็เข้าใจ</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">เติมน้ำมัน 800</span>
        <span class="cmd-desc">จัดเข้าหมวดเดินทางให้อัตโนมัติ</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">ช้อปปิ้ง เสื้อ 450</span>
        <span class="cmd-desc">จัดเข้าหมวดช้อปปิ้ง</span>
      </div>
    </div>

    <!-- Box 2: รายรับ -->
    <div class="command-box">
      <div class="cmd-header">
        <span class="cmd-title">💰 บันทึกรายรับ</span>
        <span class="status-badge" style="background: var(--c-success-bg); color: var(--c-success);">INCOME</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">รับ เงินเดือน 30000</span>
        <span class="cmd-desc">บันทึกเงินเดือนเข้าบัญชี</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">ได้เงิน ค่าขนม 500</span>
        <span class="cmd-desc">บันทึกรายรับทั่วไป</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">ขายของได้ 1500</span>
        <span class="cmd-desc">บันทึกรายได้จากธุรกิจ/การขาย</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">โบนัส 10000</span>
        <span class="cmd-desc">บันทึกโบนัสหรือเงินรางวัล</span>
      </div>
    </div>

    <!-- Box 3: บันทึกงาน -->
    <div class="command-box">
      <div class="cmd-header">
        <span class="cmd-title">📋 บันทึกงาน & สิ่งที่ต้องทำ</span>
        <span class="status-badge" style="background: var(--c-warning-bg); color: var(--c-warning);">TASKS</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">เพิ่มงาน ส่งรายงาน #urgent</span>
        <span class="cmd-desc">สร้างงานใหม่พร้อมติดแท็กความสำคัญด่วน</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">ทำ ออกกำลังกาย วันพรุ่งนี้</span>
        <span class="cmd-desc">ระบุวันกำหนดส่งงานได้ในตัว</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">นัด ประชุมลูกค้า 14:00</span>
        <span class="cmd-desc">บันทึกนัดหมายหรือสิ่งที่ต้องติดตาม</span>
      </div>
    </div>

    <!-- Box 4: โน้ต & คำสั่งเรียกดู -->
    <div class="command-box">
      <div class="cmd-header">
        <span class="cmd-title">📝 โน้ต & สรุปภาพรวม</span>
        <span class="status-badge" style="background: rgba(117, 101, 128, 0.1); color: var(--c-accent);">QUICK NOTES</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">โน้ต ไอเดียโปรเจกต์ #idea</span>
        <span class="cmd-desc">จดโน้ตพร้อมติดแท็กค้นหา</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">สรุป</span>
        <span class="cmd-desc">ดูสรุปรายรับ-รายจ่ายและงานวันนี้</span>
      </div>

      <div class="cmd-row">
        <span class="code-pill">รายจ่าย / รายรับ / งาน</span>
        <span class="cmd-desc">พิมพ์ชื่อเพื่อดูประวัติล่าสุดแยกหมวด</span>
      </div>
    </div>

  </div>

  <div class="tip-box">
    <div>
      <span style="font-weight: 600; font-size: 16px;">💡 พิมพ์ติดกันได้ ไม่ต้องเว้นวรรค:</span>
      <span style="font-size: 15px; color: var(--c-ink-muted); margin-left: 8px;">
        เช่น "จ่ายกาแฟ65บาท", "รับเงินเดือน30000", "ค่าข้าว80" ระบบอ่านได้เหมือนกัน
      </span>
    </div>
    <span class="tag">AI PARSER</span>
  </div>

  <div class="footer-bar">
    <div style="font-size: 16px; color: var(--c-ink-muted);">
      ทดลองพิมพ์ได้เลยที่ LINE: @324ywxny
    </div>
    <div class="line-id-pill" style="padding: 6px 16px; font-size: 14px;">
      FREE TO USE
    </div>
  </div>

</body>
</html>`;

// ── Slide 4: Rich Menu & Quick Start (1080 × 1350) ───────────────────────────
const slide4Html = `<!DOCTYPE html>
<html lang="th">
<head>
  <title>Memo+ Promo 4 - Rich Menu & Start</title>
  ${commonHead}
  <style>
    body {
      width: 1080px;
      height: 1350px;
      padding: 64px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid var(--c-hairline);
      padding-bottom: 24px;
    }

    .brand-title {
      font-size: 32px;
      font-weight: 700;
      color: var(--c-ink);
    }

    .richmenu-preview-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: repeat(3, 86px);
      gap: 12px;
      background: var(--c-canvas);
      border: 2px solid var(--c-hairline);
      padding: 16px;
      margin: 16px 0;
    }

    .rm-tile {
      background: var(--c-paper);
      border: 1.5px solid var(--c-hairline);
      padding: 0 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .rm-tile.primary {
      border: 2px solid var(--c-accent);
      background: #FCFBF8;
    }

    .rm-tile-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .rm-icon {
      width: 44px;
      height: 44px;
      background: var(--c-paper-dim);
      border: 1px solid var(--c-hairline);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .rm-tile.primary .rm-icon {
      background: var(--c-accent);
      color: #FFFFFF;
    }

    .rm-title {
      font-size: 20px;
      font-weight: 600;
      color: var(--c-ink);
    }

    .rm-desc {
      font-size: 13px;
      color: var(--c-ink-muted);
    }

    .steps-container {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-top: 10px;
    }

    .step-card {
      background: var(--c-paper);
      border: 1.5px solid var(--c-hairline);
      padding: 22px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 180px;
    }

    .step-num {
      font-size: 32px;
      color: var(--c-accent);
      line-height: 1;
    }

    .step-title {
      font-size: 19px;
      font-weight: 600;
      color: var(--c-ink);
      margin-top: 10px;
    }

    .step-desc {
      font-size: 14px;
      line-height: 1.4;
      color: var(--c-ink-muted);
      margin-top: 4px;
    }

    .cta-card {
      background: var(--c-paper);
      border: 2px solid var(--c-accent);
      padding: 24px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .cta-qr {
      width: 110px;
      height: 110px;
      border: 1.5px solid var(--c-hairline);
      padding: 6px;
      background: #FFFFFF;
    }

    .footer-bar {
      border-top: 1.5px solid var(--c-hairline);
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <div class="header-bar">
    <div class="brand-title">Memo+</div>
    <div class="tag">RICH MENU & QUICK START</div>
  </div>

  <div>
    <p class="tag">TAP TO NAVIGATE</p>
    <h1 style="font-size: 48px; font-weight: 700; margin-top: 4px; letter-spacing: -0.02em;">
      เมนูนำทาง 6 ช่อง สะดวกในคลิกเดียว
    </h1>
    <p style="font-size: 18px; color: var(--c-ink-muted); margin-top: 4px;">
      แตะเมนูด้านล่างห้องแชต LINE เพื่อเปิดดูหน้าต่างๆ ได้ทันที ไม่ต้องพิมพ์เอง
    </p>
  </div>

  <!-- Rich Menu Replica -->
  <div class="richmenu-preview-grid">
    <div class="rm-tile primary">
      <div class="rm-tile-left">
        <div class="rm-icon">🏠</div>
        <div>
          <div class="rm-title">หน้าหลัก</div>
          <div class="rm-desc">ภาพรวมการเงินและงานค้าง</div>
        </div>
      </div>
      <span class="tag" style="font-size: 11px;">DASHBOARD</span>
    </div>

    <div class="rm-tile">
      <div class="rm-tile-left">
        <div class="rm-icon">💰</div>
        <div>
          <div class="rm-title">รายรับ</div>
          <div class="rm-desc">บันทึกเงินเดือน & รายได้</div>
        </div>
      </div>
      <span class="tag" style="font-size: 11px;">INCOME</span>
    </div>

    <div class="rm-tile">
      <div class="rm-tile-left">
        <div class="rm-icon">💸</div>
        <div>
          <div class="rm-title">รายจ่าย</div>
          <div class="rm-desc">บันทึกค่าใช้จ่าย หมวดหมู่</div>
        </div>
      </div>
      <span class="tag" style="font-size: 11px;">EXPENSES</span>
    </div>

    <div class="rm-tile">
      <div class="rm-tile-left">
        <div class="rm-icon">📋</div>
        <div>
          <div class="rm-title">งานค้าง</div>
          <div class="rm-desc">รายการงานและเช็กลิสต์</div>
        </div>
      </div>
      <span class="tag" style="font-size: 11px;">TASKS</span>
    </div>

    <div class="rm-tile">
      <div class="rm-tile-left">
        <div class="rm-icon">📊</div>
        <div>
          <div class="rm-title">สรุปภาพรวม</div>
          <div class="rm-desc">สถิติและยอดคงเหลือ</div>
        </div>
      </div>
      <span class="tag" style="font-size: 11px;">SUMMARY</span>
    </div>

    <div class="rm-tile">
      <div class="rm-tile-left">
        <div class="rm-icon">⚙️</div>
        <div>
          <div class="rm-title">เมนูคำสั่ง</div>
          <div class="rm-desc">คู่มือพิมพ์เร็ว & ตั้งค่า</div>
        </div>
      </div>
      <span class="tag" style="font-size: 11px;">COMMANDS</span>
    </div>
  </div>

  <!-- 3 Steps -->
  <div class="steps-container">
    <div class="step-card">
      <div class="step-num font-num">01</div>
      <div>
        <div class="step-title">แอดไลน์เพื่อน</div>
        <div class="step-desc">สแกน QR Code หรือเพิ่มเพื่อนด้วย ID @324ywxny</div>
      </div>
    </div>

    <div class="step-card">
      <div class="step-num font-num">02</div>
      <div>
        <div class="step-title">พิมพ์หรือแตะเมนู</div>
        <div class="step-desc">ลองส่ง "จ่ายกาแฟ 65" หรือกดเปิดดูบอร์ดงานได้ทันที</div>
      </div>
    </div>

    <div class="step-card">
      <div class="step-num font-num">03</div>
      <div>
        <div class="step-title">เชื่อมต่อ Web App</div>
        <div class="step-desc">พิมพ์ "เว็บ" เพื่อเปิดดูบนจอคอมพิวเตอร์ที่ memo.siwat.me</div>
      </div>
    </div>
  </div>

  <!-- Bottom CTA -->
  <div class="cta-card">
    <div style="display: flex; align-items: center; gap: 24px;">
      <img src="${qrDataUri}" class="cta-qr" alt="QR Code">
      <div>
        <div style="font-size: 26px; font-weight: 700; color: var(--c-ink);">แอด LINE แล้วลองใช้งานเลย!</div>
        <div style="font-size: 17px; color: var(--c-ink-muted); margin-top: 4px;">LINE Official Account: <strong>@324ywxny</strong> (มี @ ด้วยนะครับ)</div>
      </div>
    </div>

    <div style="text-align: right;">
      <div class="line-id-pill" style="font-size: 17px; padding: 12px 24px;">
        START FREE TODAY
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <div style="font-size: 15px; color: var(--c-ink-muted);">
      Personal Operating System for Everyday Life • memo.siwat.me
    </div>
    <div class="tag">
      POWERED BY MEMO+
    </div>
  </div>

</body>
</html>`;

// ── Slide 5: Master All-in-One Infographic (1200 × 1600) ────────────────────
const slideMasterHtml = `<!DOCTYPE html>
<html lang="th">
<head>
  <title>Memo+ Promo - Master Infographic</title>
  ${commonHead}
  <style>
    body {
      width: 1200px;
      height: 1600px;
      padding: 72px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid var(--c-hairline);
      padding-bottom: 24px;
    }

    .brand-title {
      font-size: 38px;
      font-weight: 700;
      color: var(--c-ink);
    }

    .hero-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: var(--c-paper);
      border: 2px solid var(--c-hairline);
      padding: 36px 44px;
      margin-top: 16px;
    }

    .hero-left {
      max-width: 720px;
    }

    .hero-headline {
      font-size: 46px;
      font-weight: 700;
      line-height: 1.15;
      color: var(--c-ink);
      margin-top: 8px;
      letter-spacing: -0.02em;
    }

    .hero-sub {
      font-size: 20px;
      color: var(--c-ink-muted);
      line-height: 1.45;
      margin-top: 10px;
    }

    .mascot-hero-box {
      width: 130px;
      height: 130px;
      border: 2px solid var(--c-hairline);
      background: var(--c-canvas);
      padding: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* 4 Pillars */
    .four-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin: 16px 0;
    }

    .mini-card {
      background: var(--c-paper);
      border: 1.5px solid var(--c-hairline);
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 175px;
    }

    .mini-card-icon {
      font-size: 24px;
    }

    .mini-card-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--c-ink);
      margin-top: 6px;
    }

    .mini-card-desc {
      font-size: 13px;
      line-height: 1.4;
      color: var(--c-ink-muted);
      margin-top: 4px;
    }

    /* Command Matrix */
    .cmd-matrix {
      background: var(--c-paper);
      border: 2px solid var(--c-hairline);
      padding: 28px 36px;
    }

    .cmd-matrix-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid var(--c-hairline);
      padding-bottom: 14px;
      margin-bottom: 20px;
    }

    .cmd-cols {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
    }

    .cmd-group-title {
      font-size: 17px;
      font-weight: 600;
      color: var(--c-ink);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .cmd-item-row {
      margin-bottom: 12px;
    }

    .cmd-text {
      font-size: 12px;
      color: var(--c-ink-muted);
      margin-top: 3px;
    }

    /* Bottom Section */
    .bottom-cta-banner {
      background: var(--c-paper);
      border: 2px solid var(--c-accent);
      padding: 28px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
    }

    .footer-bar {
      border-top: 1.5px solid var(--c-hairline);
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>

  <div class="header-bar">
    <div class="brand-title">
      Memo<span style="color: var(--c-accent);">+</span>
    </div>
    <div class="tag">PERSONAL OPERATING SYSTEM</div>
  </div>

  <div class="hero-banner">
    <div class="hero-left">
      <div class="tag">SMART CHATBOT & PERSONAL OS</div>
      <h1 class="hero-headline">
        ผู้ช่วยส่วนตัวบน LINE<br>
        บันทึกงาน เงิน โน้ต จบครบในแชตเดียว
      </h1>
      <p class="hero-sub">
        ส่งข้อความภาษาไทยธรรมดา ระบบจัดการแยกหมวดหมู่อัตโนมัติในเสี้ยววินาที<br>
        พร้อมเมนูนำทาง 6 ช่อง และแดชบอร์ดสรุปผลแบบเรียลไทม์
      </p>
    </div>

    <div class="mascot-hero-box">
      ${mascotSvg}
    </div>
  </div>

  <!-- 4 Features -->
  <div class="four-cards-grid">
    <div class="mini-card">
      <div>
        <div class="mini-card-icon">💸</div>
        <div class="mini-card-title">บันทึกรายจ่าย</div>
        <div class="mini-card-desc">พิมพ์ "จ่ายกาแฟ 65" แยกหมวดอาหาร เดินทาง ช้อปปิ้ง อัตโนมัติ</div>
      </div>
      <span class="status-badge" style="background: var(--c-danger-bg); color: var(--c-danger);">EXPENSES</span>
    </div>

    <div class="mini-card">
      <div>
        <div class="mini-card-icon">💰</div>
        <div class="mini-card-title">บันทึกรายรับ</div>
        <div class="mini-card-desc">พิมพ์ "รับเงินเดือน 30000" บันทึกรายได้และคำนวณเงินคงเหลือ</div>
      </div>
      <span class="status-badge" style="background: var(--c-success-bg); color: var(--c-success);">INCOME</span>
    </div>

    <div class="mini-card">
      <div>
        <div class="mini-card-icon">📋</div>
        <div class="mini-card-title">จัดการงานค้าง</div>
        <div class="mini-card-desc">สร้างงาน "ส่งสไลด์ #urgent" มีบอร์ด Kanban เช็กสถานะในตัว</div>
      </div>
      <span class="status-badge" style="background: var(--c-warning-bg); color: var(--c-warning);">TASKS</span>
    </div>

    <div class="mini-card">
      <div>
        <div class="mini-card-icon">📝</div>
        <div class="mini-card-title">จดโน้ตความคิด</div>
        <div class="mini-card-desc">จดไอเดียและข้อมูลสำคัญผ่านแชต ค้นหาและเปิดดูได้ตลอดเวลา</div>
      </div>
      <span class="status-badge" style="background: rgba(117,101,128,0.1); color: var(--c-accent);">NOTES</span>
    </div>
  </div>

  <!-- Command Cheat Sheet -->
  <div class="cmd-matrix">
    <div class="cmd-matrix-header">
      <div>
        <span class="tag">QUICK GUIDE</span>
        <h2 style="font-size: 24px; font-weight: 700; color: var(--c-ink); margin-top: 2px;">
          คู่มือพิมพ์คำสั่งคุยกับบอท (Command Cheat Sheet)
        </h2>
      </div>
      <span style="font-size: 13px; color: var(--c-ink-muted);">พิมพ์ติดกันได้ เช่น "จ่ายกาแฟ65บาท"</span>
    </div>

    <div class="cmd-cols">
      <!-- Col 1 -->
      <div>
        <div class="cmd-group-title">
          <span>💸 หมวดรายจ่าย</span>
        </div>
        <div class="cmd-item-row">
          <span class="code-pill">จ่าย กาแฟ 65</span>
          <div class="cmd-text">บันทึกกาแฟ 65฿ (อาหาร)</div>
        </div>
        <div class="cmd-item-row">
          <span class="code-pill">ค่าข้าว 80</span>
          <div class="cmd-text">บันทึกค่าข้าว (อาหาร)</div>
        </div>
        <div class="cmd-item-row">
          <span class="code-pill">เติมน้ำมัน 800</span>
          <div class="cmd-text">บันทึกค่าน้ำมัน (เดินทาง)</div>
        </div>
      </div>

      <!-- Col 2 -->
      <div>
        <div class="cmd-group-title">
          <span>💰 หมวดรายรับ</span>
        </div>
        <div class="cmd-item-row">
          <span class="code-pill">รับ เงินเดือน 30000</span>
          <div class="cmd-text">บันทึกเงินเดือนเข้า</div>
        </div>
        <div class="cmd-item-row">
          <span class="code-pill">ได้เงิน ค่าขนม 500</span>
          <div class="cmd-text">บันทึกเงินได้พิเศษ</div>
        </div>
        <div class="cmd-item-row">
          <span class="code-pill">ขายของได้ 1500</span>
          <div class="cmd-text">บันทึกรายได้จากธุรกิจ</div>
        </div>
      </div>

      <!-- Col 3 -->
      <div>
        <div class="cmd-group-title">
          <span>📋 งาน, โน้ต & คำสั่งสรุป</span>
        </div>
        <div class="cmd-item-row">
          <span class="code-pill">เพิ่มงาน ส่งงาน #urgent</span>
          <div class="cmd-text">สร้างงานด่วนลงกระดาน</div>
        </div>
        <div class="cmd-item-row">
          <span class="code-pill">โน้ต ไอเดียใหม่ #idea</span>
          <div class="cmd-text">จดบันทึกความคิด</div>
        </div>
        <div class="cmd-item-row">
          <span class="code-pill">สรุป / งาน / รายจ่าย</span>
          <div class="cmd-text">ดูสรุปสถิติล่าสุดทันที</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Bottom CTA -->
  <div class="bottom-cta-banner">
    <div style="display: flex; align-items: center; gap: 28px;">
      <img src="${qrDataUri}" style="width: 104px; height: 104px; border: 1.5px solid var(--c-hairline); background: #FFF; padding: 4px;" alt="QR">
      <div>
        <div style="font-size: 26px; font-weight: 700; color: var(--c-ink);">แอด LINE เริ่มใช้งานฟรีทันที!</div>
        <div style="font-size: 17px; color: var(--c-ink-muted); margin-top: 4px;">
          เพิ่มเพื่อน LINE ID: <strong style="color: var(--c-ink);">@324ywxny</strong> หรือสแกน QR Code ด้านซ้าย
        </div>
      </div>
    </div>

    <div class="line-id-pill" style="font-size: 16px; padding: 14px 28px;">
      ADD LINE: @324ywxny
    </div>
  </div>

  <div class="footer-bar">
    <div style="font-size: 15px; color: var(--c-ink-muted);">
      Memo+ — A private workspace, built for one person • Website: memo.siwat.me
    </div>
    <div class="tag">
      PERSONAL OS
    </div>
  </div>

</body>
</html>`;

// Write HTML templates
const files = [
  { name: 'promo-01-cover', html: slide1Html, w: 1080, h: 1350 },
  { name: 'promo-02-features', html: slide2Html, w: 1080, h: 1350 },
  { name: 'promo-03-commands', html: slide3Html, w: 1080, h: 1350 },
  { name: 'promo-04-richmenu', html: slide4Html, w: 1080, h: 1350 },
  { name: 'promo-all-in-one', html: slideMasterHtml, w: 1200, h: 1600 },
];

console.log('Writing HTML templates for promotional graphics...');
for (const item of files) {
  const htmlPath = path.resolve(OUTPUT_DIR, `${item.name}.html`);
  fs.writeFileSync(htmlPath, item.html, 'utf8');
  console.log(`  ✓ Wrote ${htmlPath}`);
}

// Render to PNG with Google Chrome Headless
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (fs.existsSync(chromePath)) {
  console.log('\n🎨 Rendering PNG images via Google Chrome Headless...');
  for (const item of files) {
    const htmlPath = path.resolve(OUTPUT_DIR, `${item.name}.html`);
    const pngPath = path.resolve(OUTPUT_DIR, `${item.name}.png`);
    const cmd = `"${chromePath}" --headless --disable-gpu --no-sandbox --user-data-dir="${path.resolve(__dirname, '../.chrome_tmp')}" --screenshot="${pngPath}" --window-size=${item.w},${item.h} --hide-scrollbars "file://${htmlPath}"`;
    try {
      execSync(cmd, { stdio: 'pipe' });
      const stats = fs.statSync(pngPath);
      console.log(`  ✅ Generated ${item.name}.png (${item.w}×${item.h}, ${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ❌ Error generating ${item.name}.png:`, err.message);
    }
  }
} else {
  console.warn(`⚠️ Google Chrome not found at ${chromePath}. HTML templates saved in ${OUTPUT_DIR}`);
}
