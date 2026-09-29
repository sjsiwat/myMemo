#!/usr/bin/env node

/**
 * LINE Rich Menu Management Utility for Memo+
 *
 * Capabilities:
 * - list: List all rich menus in the LINE Channel
 * - create: Idempotently creates the 2x3 Rich Menu, uploads image, sets as default
 * - delete [richMenuId]: Delete a specific rich menu or all Memo+ menus
 * - set-default <richMenuId>: Set a specific rich menu as default
 * - unset-default: Remove the default rich menu
 *
 * Zero external dependencies: Uses native Node.js fetch and fs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const DEFAULT_LIFF_ID = '2010502491-uIBFxjTa';
const RICH_MENU_NAME = 'Memo+ Main Navigation';
const CHAT_BAR_TEXT = 'เมนู Memo+';
const DEFAULT_IMAGE_PATH = path.resolve(__dirname, '../assets/memo-rich-menu.png');

// Try loading environment variables from .env or .dev.vars if present
function loadEnv() {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.dev.vars'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../johny-line-bot/.dev.vars'),
    path.resolve(__dirname, '../../johny-line-bot/.env'),
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            const key = k.trim();
            const val = v.join('=').trim().replace(/^["']|["']$/g, '');
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      } catch {}
    }
  }
}

loadEnv();

function getAccessToken() {
  const token =
    process.env.LINE_CHANNEL_ACCESS_TOKEN ||
    process.env.LINE_ACCESS_TOKEN ||
    process.argv.find((a) => a.startsWith('--token='))?.split('=')[1];

  if (!token) {
    console.error('\n❌ ERROR: LINE_CHANNEL_ACCESS_TOKEN is required.');
    console.error('Please set it in your environment or run with:');
    console.error('  LINE_CHANNEL_ACCESS_TOKEN=your_token npm run richmenu:create');
    console.error('  or: node scripts/richmenu.js create --token=your_token\n');
    process.exit(1);
  }
  return token;
}

function getLiffId() {
  return (
    process.env.LINE_LIFF_ID ||
    process.env.VITE_LIFF_ID ||
    DEFAULT_LIFF_ID
  );
}

// ── Rich Menu Specification ──────────────────────────────────────────────────
// 2 Columns × 3 Rows:
// Width: 2500, Height: 1686
// Each Cell: Width: 1250, Height: 562
export function buildRichMenuObject(liffId) {
  const baseUrl = `https://liff.line.me/${liffId}`;

  return {
    size: {
      width: 2500,
      height: 1686,
    },
    selected: true,
    name: RICH_MENU_NAME,
    chatBarText: CHAT_BAR_TEXT,
    areas: [
      // Row 1, Col 1: 🏠 หน้าหลัก
      {
        bounds: { x: 0, y: 0, width: 1250, height: 562 },
        action: {
          type: 'uri',
          label: 'หน้าหลัก',
          uri: `${baseUrl}/dashboard`,
        },
      },
      // Row 1, Col 2: 💰 รายรับ
      {
        bounds: { x: 1250, y: 0, width: 1250, height: 562 },
        action: {
          type: 'uri',
          label: 'รายรับ',
          uri: `${baseUrl}/income`,
        },
      },
      // Row 2, Col 1: 💸 รายจ่าย
      {
        bounds: { x: 0, y: 562, width: 1250, height: 562 },
        action: {
          type: 'uri',
          label: 'รายจ่าย',
          uri: `${baseUrl}/expenses`,
        },
      },
      // Row 2, Col 2: 📋 งาน
      {
        bounds: { x: 1250, y: 562, width: 1250, height: 562 },
        action: {
          type: 'uri',
          label: 'งานค้าง',
          uri: `${baseUrl}/tasks`,
        },
      },
      // Row 3, Col 1: 📊 สรุป
      {
        bounds: { x: 0, y: 1124, width: 1250, height: 562 },
        action: {
          type: 'uri',
          label: 'สรุปภาพรวม',
          uri: `${baseUrl}/summary`,
        },
      },
      // Row 3, Col 2: ⚙️ เมนู / คำสั่ง
      {
        bounds: { x: 1250, y: 1124, width: 1250, height: 562 },
        action: {
          type: 'uri',
          label: 'เมนูคำสั่ง',
          uri: `${baseUrl}/menu`,
        },
      },
    ],
  };
}

// ── LINE Messaging API Client Functions ──────────────────────────────────────

export async function getRichMenuList(token) {
  const res = await fetch('https://api.line.me/v2/bot/richmenu/list', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to list rich menus (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.richmenus || [];
}

export async function getDefaultRichMenuId(token) {
  try {
    const res = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    return data.richMenuId || null;
  } catch {
    return null;
  }
}

export async function createRichMenu(token, liffId) {
  const body = buildRichMenuObject(liffId);
  const res = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create rich menu (${res.status}): ${err}`);
  }
  const data = await res.json();
  return data.richMenuId;
}

export async function uploadRichMenuImage(token, richMenuId, imagePath) {
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image file not found at: ${imagePath}`);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const isJpeg = imagePath.endsWith('.jpg') || imagePath.endsWith('.jpeg');
  const contentType = isJpeg ? 'image/jpeg' : 'image/png';

  const res = await fetch(
    `https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType,
      },
      body: imageBuffer,
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to upload rich menu image (${res.status}): ${err}`);
  }
  return true;
}

export async function setDefaultRichMenu(token, richMenuId) {
  const res = await fetch(
    `https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to set default rich menu (${res.status}): ${err}`);
  }
  return true;
}

export async function unsetDefaultRichMenu(token) {
  const res = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Failed to unset default rich menu (${res.status}): ${err}`);
  }
  return true;
}

export async function deleteRichMenu(token, richMenuId) {
  const res = await fetch(
    `https://api.line.me/v2/bot/richmenu/${richMenuId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`Failed to delete rich menu (${res.status}): ${err}`);
  }
  return true;
}

// ── High-Level Workflow: Idempotent Setup ────────────────────────────────────

export async function setupMemoRichMenu({
  token,
  liffId,
  imagePath = DEFAULT_IMAGE_PATH,
}) {
  console.log('🔄 Checking existing LINE Rich Menus for Memo+...');
  const existingMenus = await getRichMenuList(token);
  const defaultId = await getDefaultRichMenuId(token);

  console.log(`📋 Found ${existingMenus.length} existing rich menu(s) in channel.`);
  if (defaultId) {
    console.log(`📌 Current default Rich Menu ID: ${defaultId}`);
  }

  // Identify previous Memo+ rich menus
  const memoMenus = existingMenus.filter((m) => m.name === RICH_MENU_NAME);

  console.log(`\n📦 Creating new Memo+ Rich Menu (LIFF ID: ${liffId})...`);
  const newRichMenuId = await createRichMenu(token, liffId);
  console.log(`✅ Rich Menu created: ${newRichMenuId}`);

  // Upload image if file exists
  if (fs.existsSync(imagePath)) {
    console.log(`🖼️ Uploading Rich Menu image from: ${imagePath}...`);
    await uploadRichMenuImage(token, newRichMenuId, imagePath);
    console.log('✅ Image uploaded successfully (2500x1686).');
  } else {
    console.warn(`⚠️ Warning: Image file not found at ${imagePath}.`);
    console.warn('   Image upload skipped. Upload image later with:');
    console.warn(`   node scripts/richmenu.js upload ${newRichMenuId} <path_to_image>`);
  }

  // Set as default
  console.log('🌟 Setting Rich Menu as default for all users...');
  await setDefaultRichMenu(token, newRichMenuId);
  console.log('✅ Default Rich Menu set successfully!');

  // Clean up old Memo+ rich menus to maintain idempotency
  if (memoMenus.length > 0) {
    console.log(`🧹 Cleaning up ${memoMenus.length} old Memo+ rich menu(s)...`);
    for (const oldMenu of memoMenus) {
      if (oldMenu.richMenuId !== newRichMenuId) {
        try {
          await deleteRichMenu(token, oldMenu.richMenuId);
          console.log(`   Deleted old menu: ${oldMenu.richMenuId}`);
        } catch (e) {
          console.warn(`   Could not delete ${oldMenu.richMenuId}: ${e.message}`);
        }
      }
    }
  }

  console.log('\n🎉 Memo+ Rich Menu setup complete!');
  console.log(`   Rich Menu ID: ${newRichMenuId}`);
  console.log('   All 6 buttons are active and mapped to LIFF routes.\n');
  return newRichMenuId;
}

// ── CLI Command Dispatcher ──────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'list': {
      const token = getAccessToken();
      const list = await getRichMenuList(token);
      const defaultId = await getDefaultRichMenuId(token);
      console.log(`\n📋 Rich Menus in Channel (${list.length}):`);
      for (const m of list) {
        const isDef = m.richMenuId === defaultId ? ' [DEFAULT]' : '';
        console.log(`• ID: ${m.richMenuId}${isDef}`);
        console.log(`  Name: ${m.name} | ChatBar: ${m.chatBarText}`);
        console.log(`  Areas: ${m.areas?.length || 0} buttons\n`);
      }
      break;
    }

    case 'create': {
      const token = getAccessToken();
      const liffId = getLiffId();
      const customImg = args.find((a) => a.endsWith('.png') || a.endsWith('.jpg'));
      const imgPath = customImg ? path.resolve(process.cwd(), customImg) : DEFAULT_IMAGE_PATH;
      await setupMemoRichMenu({ token, liffId, imagePath: imgPath });
      break;
    }

    case 'set-default': {
      const token = getAccessToken();
      const id = args[1];
      if (!id) {
        console.error('Usage: node scripts/richmenu.js set-default <richMenuId>');
        process.exit(1);
      }
      await setDefaultRichMenu(token, id);
      console.log(`✅ Set default Rich Menu to: ${id}`);
      break;
    }

    case 'unset-default': {
      const token = getAccessToken();
      await unsetDefaultRichMenu(token);
      console.log('✅ Default Rich Menu removed.');
      break;
    }

    case 'upload': {
      const token = getAccessToken();
      const id = args[1];
      const img = args[2] || DEFAULT_IMAGE_PATH;
      if (!id) {
        console.error('Usage: node scripts/richmenu.js upload <richMenuId> [imagePath]');
        process.exit(1);
      }
      await uploadRichMenuImage(token, id, img);
      console.log(`✅ Image uploaded to Rich Menu: ${id}`);
      break;
    }

    case 'delete': {
      const token = getAccessToken();
      const id = args[1];
      if (id === 'all') {
        const list = await getRichMenuList(token);
        const memoMenus = list.filter((m) => m.name === RICH_MENU_NAME);
        for (const m of memoMenus) {
          await deleteRichMenu(token, m.richMenuId);
          console.log(`Deleted: ${m.richMenuId}`);
        }
        console.log(`✅ Deleted ${memoMenus.length} Memo+ menus.`);
      } else if (id) {
        await deleteRichMenu(token, id);
        console.log(`✅ Deleted Rich Menu: ${id}`);
      } else {
        console.error('Usage: node scripts/richmenu.js delete <richMenuId|all>');
        process.exit(1);
      }
      break;
    }

    default:
      console.log(`
📖 Memo+ Rich Menu CLI

Commands:
  npm run richmenu:create       Idempotently create/update Rich Menu, upload image & set default
  npm run richmenu:list         List all rich menus in the LINE Channel
  npm run richmenu:delete <id>  Delete a specific rich menu (or 'all' for Memo+ menus)
  npm run richmenu:set-default  Set a specific rich menu as default
  npm run richmenu:unset-default Remove the default rich menu (rollback)

Options:
  --token=YOUR_TOKEN           Specify LINE Channel Access Token directly
`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}
