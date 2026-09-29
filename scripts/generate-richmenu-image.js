#!/usr/bin/env node

/**
 * Generates the official LINE Rich Menu image (2500 × 1686 px)
 * for Memo+ according to Swiss Minimal × Warm Luxury design rules.
 *
 * Enlarged layout: Button cards expand to 1204 × 516 px (filling ~90% of each cell)
 * for maximum legibility and tactile touch area on mobile screens.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../assets');
const OUTPUT_PNG = path.resolve(OUTPUT_DIR, 'memo-rich-menu.png');
const HTML_FILE = path.resolve(OUTPUT_DIR, 'memo-rich-menu.html');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ── HTML Template with Swiss Minimal × Warm Luxury Aesthetics ─────────────────
const htmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>Memo+ Rich Menu</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Mitr:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
    }

    body {
      width: 2500px;
      height: 1686px;
      background-color: #F7F6F2;
      font-family: 'Mitr', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1C1C1C;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1250px 1250px;
      grid-template-rows: 562px 562px 562px;
    }

    .cell {
      width: 1250px;
      height: 562px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #F7F6F2;
      position: relative;
    }

    /* Enlarged button card: fills 1204px × 516px of the 1250px × 562px cell */
    .content-box {
      width: 1204px;
      height: 516px;
      padding: 0 68px;
      background-color: #FFFFFF;
      border: 2.5px solid #DDDAD2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: relative;
    }

    .card-main {
      display: flex;
      align-items: center;
      gap: 52px;
    }

    .icon-container {
      width: 200px;
      height: 200px;
      background-color: #F7F6F2;
      border: 2.5px solid #DDDAD2;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-container svg {
      width: 110px;
      height: 110px;
      stroke: #756580;
      stroke-width: 2.2;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* Primary Accent on Home */
    .cell.primary-cell .icon-container {
      background-color: #756580;
      border-color: #756580;
    }

    .cell.primary-cell .icon-container svg {
      stroke: #FFFFFF;
    }

    .cell.primary-cell .content-box {
      border: 2.5px solid #756580;
      background-color: #FCFBF8;
    }

    .text-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .tag {
      font-size: 26px;
      font-weight: 600;
      color: #756580;
      letter-spacing: 3.5px;
      text-transform: uppercase;
    }

    .title {
      font-size: 82px;
      font-weight: 600;
      color: #1C1C1C;
      letter-spacing: -0.5px;
      line-height: 1.1;
      margin-top: 4px;
    }

    .subtitle {
      font-size: 32px;
      font-weight: 400;
      color: #6F6B63;
      margin-top: 10px;
      line-height: 1.25;
      letter-spacing: 0.2px;
    }

    .card-action {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      flex-shrink: 0;
    }

    .card-action svg {
      width: 52px;
      height: 52px;
      stroke: #C9C5BB;
      stroke-width: 2.8;
      fill: none;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    .cell.primary-cell .card-action svg {
      stroke: #756580;
    }

    .brand-mark {
      position: absolute;
      top: 26px;
      right: 36px;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 3.5px;
      color: #9A968D;
      text-transform: uppercase;
    }
  </style>
</head>
<body>

  <!-- Cell 1: 🏠 หน้าหลัก -->
  <div class="cell primary-cell">
    <div class="content-box">
      <div class="card-main">
        <div class="icon-container">
          <svg viewBox="0 0 24 24">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
        <div class="text-container">
          <div class="tag">DASHBOARD</div>
          <div class="title">หน้าหลัก</div>
          <div class="subtitle">ภาพรวมการเงินและงานค้างทั้งหมด</div>
        </div>
      </div>
      <div class="card-action">
        <svg viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
      <div class="brand-mark">MEMO+</div>
    </div>
  </div>

  <!-- Cell 2: 💰 รายรับ -->
  <div class="cell">
    <div class="content-box">
      <div class="card-main">
        <div class="icon-container">
          <svg viewBox="0 0 24 24">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
            <polyline points="17 6 23 6 23 12"/>
          </svg>
        </div>
        <div class="text-container">
          <div class="tag">INCOME</div>
          <div class="title">รายรับ</div>
          <div class="subtitle">บันทึกเงินเดือน โบนัส และรายได้</div>
        </div>
      </div>
      <div class="card-action">
        <svg viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  </div>

  <!-- Cell 3: 💸 รายจ่าย -->
  <div class="cell">
    <div class="content-box">
      <div class="card-main">
        <div class="icon-container">
          <svg viewBox="0 0 24 24">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
            <polyline points="17 18 23 18 23 12"/>
          </svg>
        </div>
        <div class="text-container">
          <div class="tag">EXPENSES</div>
          <div class="title">รายจ่าย</div>
          <div class="subtitle">บันทึกค่าใช้จ่าย หมวดหมู่ ยอดรวม</div>
        </div>
      </div>
      <div class="card-action">
        <svg viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  </div>

  <!-- Cell 4: 📋 งานค้าง -->
  <div class="cell">
    <div class="content-box">
      <div class="card-main">
        <div class="icon-container">
          <svg viewBox="0 0 24 24">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </div>
        <div class="text-container">
          <div class="tag">TASKS</div>
          <div class="title">งานค้าง</div>
          <div class="subtitle">รายการงานและเช็กลิสต์ เลือกลบได้</div>
        </div>
      </div>
      <div class="card-action">
        <svg viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  </div>

  <!-- Cell 5: 📊 สรุปภาพรวม -->
  <div class="cell">
    <div class="content-box">
      <div class="card-main">
        <div class="icon-container">
          <svg viewBox="0 0 24 24">
            <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
            <path d="M22 12A10 10 0 0 0 12 2v10z"/>
          </svg>
        </div>
        <div class="text-container">
          <div class="tag">SUMMARY</div>
          <div class="title">สรุปภาพรวม</div>
          <div class="subtitle">สถิติรายรับรายจ่าย และยอดคงเหลือ</div>
        </div>
      </div>
      <div class="card-action">
        <svg viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  </div>

  <!-- Cell 6: ⚙️ เมนูคำสั่ง -->
  <div class="cell">
    <div class="content-box">
      <div class="card-main">
        <div class="icon-container">
          <svg viewBox="0 0 24 24">
            <line x1="4" y1="21" x2="4" y2="14"/>
            <line x1="4" y1="10" x2="4" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12" y2="3"/>
            <line x1="20" y1="21" x2="20" y2="16"/>
            <line x1="20" y1="12" x2="20" y2="3"/>
            <line x1="1" y1="14" x2="7" y2="14"/>
            <line x1="9" y1="8" x2="15" y2="8"/>
            <line x1="17" y1="16" x2="23" y2="16"/>
          </svg>
        </div>
        <div class="text-container">
          <div class="tag">COMMANDS</div>
          <div class="title">เมนูคำสั่ง</div>
          <div class="subtitle">คู่มือพิมพ์เร็ว และตั้งค่าระบบ</div>
        </div>
      </div>
      <div class="card-action">
        <svg viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(HTML_FILE, htmlContent, 'utf8');
console.log(`📄 Wrote HTML template to: ${HTML_FILE}`);

// ── Render to 2500x1686 PNG using Google Chrome Headless ─────────────────────
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

if (fs.existsSync(chromePath)) {
  console.log('🎨 Rendering enlarged 2500 × 1686 PNG image via Google Chrome...');
  try {
    const cmd = `"${chromePath}" --headless --disable-gpu --screenshot="${OUTPUT_PNG}" --window-size=2500,1686 --hide-scrollbars "file://${HTML_FILE}"`;
    execSync(cmd, { stdio: 'inherit' });

    if (fs.existsSync(OUTPUT_PNG)) {
      const stats = fs.statSync(OUTPUT_PNG);
      console.log(`✅ Enlarged Rich Menu image generated successfully!`);
      console.log(`   Path: ${OUTPUT_PNG}`);
      console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB (LINE limit: 1024 KB)`);
    }
  } catch (err) {
    console.error('❌ Chrome rendering error:', err.message);
  }
} else {
  console.warn(`⚠️ Chrome not found at ${chromePath}. HTML template saved at ${HTML_FILE}`);
}
