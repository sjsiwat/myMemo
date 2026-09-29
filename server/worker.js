/**
 * Cloudflare Worker entry point for mymemo
 * Handles /api/auth/line-callback, /api/liff/* endpoints, and serves static assets.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle CORS preflight for API routes
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return handleCors();
    }

    // Route: LINE OAuth callback (legacy web auth)
    if (url.pathname === '/api/auth/line-callback') {
      return handleLineCallback(request, env);
    }

    // Routes: LIFF API
    if (url.pathname.startsWith('/api/liff/')) {
      return handleLiffApi(request, env, url);
    }

    // Everything else → serve static assets
    const response = await env.ASSETS.fetch(request);
    if (url.pathname.startsWith('/liff') || url.searchParams.has('liff.state')) {
      const headers = new Headers(response.headers);
      headers.delete('X-Frame-Options');
      headers.set(
        'Content-Security-Policy',
        "frame-ancestors 'self' https://*.line.me https://line.me https://*.line-apps.com;"
      );
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }
    return response;
  },
};

// ── CORS Helper ─────────────────────────────────────────────────────────────

function handleCors(response) {
  const headers = new Headers(response ? response.headers : undefined);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return new Response(response ? response.body : null, {
    status: response ? response.status : 204,
    statusText: response ? response.statusText : 'No Content',
    headers,
  });
}

function jsonResponse(data, status = 200) {
  return handleCors(
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

// ── Cryptographic Session Helpers (Web Crypto HMAC-SHA256) ───────────────────

function base64UrlEncode(str) {
  return btoa(str).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return atob(base64);
}

async function signJwt(payload, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = enc.encode(`${header}.${body}`);
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, dataToSign);
  const signature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signatureBuffer)));
  return `${header}.${body}.${signature}`;
}

async function verifyJwt(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigStr = base64UrlDecode(signature);
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) sigBytes[i] = sigStr.charCodeAt(i);

    const dataToSign = enc.encode(`${header}.${body}`);
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, dataToSign);
    if (!valid) return null;

    const payload = JSON.parse(base64UrlDecode(body));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Supabase Helper with Service Role ───────────────────────────────────────

async function supaFetch(env, path, opts = {}) {
  const url = `${env.SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error(`[supaFetch error] ${res.status}:`, errText);
    return { ok: false, status: res.status, error: errText };
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  return { ok: true, status: res.status, data };
}

// ── Authentication Verification for LIFF ────────────────────────────────────

async function getAuthUser(request, env) {
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;

  const secret = env.LINE_CHANNEL_SECRET || 'memo-channel-secret';

  // 1. First, check if it's our signed session JWT
  const jwtPayload = await verifyJwt(token, secret);
  if (jwtPayload?.userId) {
    return { userId: jwtPayload.userId, lineUserId: jwtPayload.lineUserId };
  }

  // 2. Fallback: if caller sent a raw LINE ID token directly, verify with LINE Platform
  try {
    const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        id_token: token,
        client_id: env.LINE_CHANNEL_ID || '2010502491',
      }),
    });
    if (verifyRes.ok) {
      const data = await verifyRes.json();
      if (data.sub) {
        const lookup = await supaFetch(
          env,
          `line_users?line_user_id=eq.${encodeURIComponent(data.sub)}&select=user_id`
        );
        if (lookup.ok && lookup.data?.[0]?.user_id) {
          return { userId: lookup.data[0].user_id, lineUserId: data.sub };
        }
      }
    }
  } catch (err) {
    console.error('[getAuthUser verify error]', err);
  }

  return null;
}

// ── LIFF API Handler Router ─────────────────────────────────────────────────

async function handleLiffApi(request, env, url) {
  const pathname = url.pathname;
  const method = request.method;

  // ── 1. POST /api/liff/auth (Verify LINE ID token or Access Token) ───────────
  if (pathname === '/api/liff/auth' && method === 'POST') {
    try {
      const body = await request.json().catch(() => ({}));
      const { idToken, accessToken } = body;
      if (!idToken && !accessToken) {
        return jsonResponse({ error: 'idToken or accessToken is required' }, 400);
      }

      let lineUserId = null;
      let displayName = 'ผู้ใช้งาน';
      let pictureUrl = null;

      // 1. Try verifying ID token with LINE Platform if present
      if (idToken) {
        try {
          const verifyRes = await fetch('https://api.line.me/oauth2/v2.1/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              id_token: idToken,
              client_id: env.LINE_CHANNEL_ID || '2010502491',
            }),
          });
          if (verifyRes.ok) {
            const verified = await verifyRes.json();
            lineUserId = verified.sub;
            displayName = verified.name || displayName;
            pictureUrl = verified.picture || pictureUrl;
          }
        } catch (e) {
          console.warn('[LIFF Auth] ID token verification failed:', e);
        }
      }

      // 2. Fallback: Verify Access Token with LINE Platform (e.g. if openid scope is not enabled)
      if (!lineUserId && accessToken) {
        try {
          const profileRes = await fetch('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (profileRes.ok) {
            const prof = await profileRes.json();
            lineUserId = prof.userId;
            displayName = prof.displayName || displayName;
            pictureUrl = prof.pictureUrl || pictureUrl;
          }
        } catch (e) {
          console.warn('[LIFF Auth] Access token profile fetch failed:', e);
        }
      }

      if (!lineUserId) {
        return jsonResponse({ error: 'Invalid or expired LINE authentication tokens' }, 401);
      }

      // Look up user in line_users table
      let lookup = await supaFetch(
        env,
        `line_users?line_user_id=eq.${encodeURIComponent(lineUserId)}&select=user_id,plan,display_name,picture_url`
      );

      let userId = lookup.data?.[0]?.user_id;
      let plan = lookup.data?.[0]?.plan || 'free';

      if (!userId) {
        // Auto-create Supabase auth user
        const lineEmail = `line_${lineUserId}@memo.internal`;
        const createRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: lineEmail, email_confirm: true }),
        });
        const newUser = await createRes.json();

        if (newUser.id) {
          userId = newUser.id;
        } else if (newUser.error_code === 'email_exists') {
          const listRes = await fetch(
            `${env.SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(lineEmail)}&page=1&per_page=1`,
            {
              headers: {
                apikey: env.SUPABASE_SERVICE_ROLE_KEY,
                Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
              },
            }
          );
          const listData = await listRes.json();
          userId = listData?.users?.[0]?.id;
        }

        if (!userId) {
          return jsonResponse({ error: 'Failed to provision user' }, 500);
        }

        // Insert line_users record
        await supaFetch(env, 'line_users', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({
            line_user_id: lineUserId,
            user_id: userId,
            display_name: displayName,
            picture_url: pictureUrl,
            plan: 'free',
          }),
        });
      } else {
        // Update profile in background
        supaFetch(env, `line_users?line_user_id=eq.${encodeURIComponent(lineUserId)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ display_name: displayName, picture_url: pictureUrl }),
        }).catch(() => {});
      }

      // Generate session token (valid 24h)
      const secret = env.LINE_CHANNEL_SECRET || 'memo-channel-secret';
      const sessionToken = await signJwt(
        { userId, lineUserId, exp: Date.now() + 24 * 3600 * 1000 },
        secret
      );

      return jsonResponse({
        token: sessionToken,
        user: {
          id: userId,
          lineUserId,
          displayName,
          pictureUrl,
          plan,
        },
      });
    } catch (err) {
      console.error('[handleLiffApi auth error]', err);
      return jsonResponse({ error: err.message }, 500);
    }
  }

  // ── Authenticate all other /api/liff/* endpoints ────────────────────────────
  const user = await getAuthUser(request, env);
  if (!user?.userId) {
    return jsonResponse({ error: 'Unauthorized: Valid LINE authentication token required' }, 401);
  }
  const uid = user.userId;

  try {
    // ── 2. GET /api/liff/bootstrap (Single fast round-trip) ───────────────────
    if (pathname === '/api/liff/bootstrap' && method === 'GET') {
      const [userRes, tasksRes, expensesRes, incomesRes] = await Promise.all([
        supaFetch(env, `line_users?user_id=eq.${uid}&select=display_name,picture_url,plan`),
        supaFetch(env, `tasks?user_id=eq.${uid}&order=created_at.desc&limit=100`),
        supaFetch(env, `expenses?user_id=eq.${uid}&order=date.desc,created_at.desc&limit=100`),
        supaFetch(env, `incomes?user_id=eq.${uid}&order=date.desc,created_at.desc&limit=100`),
      ]);

      const profile = userRes.data?.[0] || {};
      return jsonResponse({
        user: {
          id: uid,
          lineUserId: user.lineUserId,
          displayName: profile.display_name || 'ผู้ใช้งาน',
          pictureUrl: profile.picture_url || null,
          plan: profile.plan || 'free',
        },
        tasks: tasksRes.data || [],
        expenses: expensesRes.data || [],
        incomes: incomesRes.data || [],
      });
    }

    // ── 3. Tasks Endpoints ──────────────────────────────────────────────────
    if (pathname === '/api/liff/tasks') {
      if (method === 'GET') {
        const status = url.searchParams.get('status');
        let query = `tasks?user_id=eq.${uid}&order=created_at.desc`;
        if (status === 'open') query += '&status=neq.done';
        if (status === 'done') query += '&status=eq.done';
        const res = await supaFetch(env, query);
        return jsonResponse(res.data || []);
      }

      if (method === 'POST') {
        const body = await request.json().catch(() => ({}));
        if (!body.title?.trim()) {
          return jsonResponse({ error: 'Task title is required' }, 400);
        }
        const newTask = {
          id: crypto.randomUUID(),
          user_id: uid,
          title: body.title.trim(),
          description: body.description || '',
          priority: body.priority || 'medium',
          status: body.status || 'todo',
          due: body.due || null,
          labels: Array.isArray(body.labels) ? body.labels : [],
          target_value: body.target_value ? Number(body.target_value) : null,
          target_unit: body.target_unit || '',
          progress_value: Number(body.progress_value) || 0,
          created_at: new Date().toISOString(),
        };

        const res = await supaFetch(env, 'tasks', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(newTask),
        });
        if (!res.ok) return jsonResponse({ error: res.error }, 500);
        return jsonResponse(res.data?.[0] || newTask, 201);
      }
    }

    // Tasks Batch Delete: POST /api/liff/tasks/batch-delete
    if (pathname === '/api/liff/tasks/batch-delete' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
      if (ids.length === 0) {
        return jsonResponse({ error: 'ids array is required' }, 400);
      }
      const safeIds = ids.map((id) => `"${encodeURIComponent(id)}"`).join(',');
      const res = await supaFetch(env, `tasks?user_id=eq.${uid}&id=in.(${safeIds})`, {
        method: 'DELETE',
      });
      if (!res.ok) return jsonResponse({ error: res.error }, 500);
      return jsonResponse({ success: true, count: ids.length });
    }

    // Task Item: /api/liff/tasks/:id
    const taskMatch = pathname.match(/^\/api\/liff\/tasks\/([a-zA-Z0-9-]+)$/);
    if (taskMatch) {
      const taskId = taskMatch[1];
      if (method === 'PATCH') {
        const body = await request.json().catch(() => ({}));
        const allowed = ['title', 'description', 'priority', 'status', 'due', 'labels', 'progress_value'];
        const patch = {};
        for (const k of allowed) {
          if (k in body) patch[k] = body[k];
        }
        const res = await supaFetch(env, `tasks?id=eq.${taskId}&user_id=eq.${uid}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) return jsonResponse({ error: res.error }, 500);
        return jsonResponse(res.data?.[0] || { id: taskId, ...patch });
      }

      if (method === 'DELETE') {
        const res = await supaFetch(env, `tasks?id=eq.${taskId}&user_id=eq.${uid}`, {
          method: 'DELETE',
        });
        if (!res.ok) return jsonResponse({ error: res.error }, 500);
        return jsonResponse({ success: true, id: taskId });
      }
    }

    // ── 4. Expenses Endpoints ───────────────────────────────────────────────
    if (pathname === '/api/liff/expenses') {
      if (method === 'GET') {
        const res = await supaFetch(env, `expenses?user_id=eq.${uid}&order=date.desc,created_at.desc&limit=100`);
        return jsonResponse(res.data || []);
      }

      if (method === 'POST') {
        const body = await request.json().catch(() => ({}));
        if (!body.title?.trim() || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
          return jsonResponse({ error: 'Valid title and amount required' }, 400);
        }
        const category = body.category && body.category !== 'อื่นๆ'
          ? body.category
          : autoExpenseCategory(body.title.trim());

        const newExpense = {
          id: crypto.randomUUID(),
          user_id: uid,
          title: body.title.trim(),
          amount: Number(body.amount),
          category,
          date: body.date || new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString(),
        };
        const res = await supaFetch(env, 'expenses', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(newExpense),
        });
        if (!res.ok) return jsonResponse({ error: res.error }, 500);
        return jsonResponse(res.data?.[0] || newExpense, 201);
      }
    }

    // Expenses Batch Delete: POST /api/liff/expenses/batch-delete
    if (pathname === '/api/liff/expenses/batch-delete' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
      if (ids.length === 0) return jsonResponse({ error: 'ids array is required' }, 400);
      const safeIds = ids.map((id) => `"${encodeURIComponent(id)}"`).join(',');
      const res = await supaFetch(env, `expenses?user_id=eq.${uid}&id=in.(${safeIds})`, {
        method: 'DELETE',
      });
      if (!res.ok) return jsonResponse({ error: res.error }, 500);
      return jsonResponse({ success: true, count: ids.length });
    }

    // Expense Item: /api/liff/expenses/:id
    const expMatch = pathname.match(/^\/api\/liff\/expenses\/([a-zA-Z0-9-]+)$/);
    if (expMatch) {
      const expId = expMatch[1];
      if (method === 'PATCH') {
        const body = await request.json().catch(() => ({}));
        const allowed = ['title', 'amount', 'category', 'date'];
        const patch = {};
        for (const k of allowed) {
          if (k in body) patch[k] = k === 'amount' ? Number(body[k]) : body[k];
        }
        const res = await supaFetch(env, `expenses?id=eq.${expId}&user_id=eq.${uid}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) return jsonResponse({ error: res.error }, 500);
        return jsonResponse(res.data?.[0] || { id: expId, ...patch });
      }

      if (method === 'DELETE') {
        const res = await supaFetch(env, `expenses?id=eq.${expId}&user_id=eq.${uid}`, {
          method: 'DELETE',
        });
        if (!res.ok) return jsonResponse({ error: res.error }, 500);
        return jsonResponse({ success: true, id: expId });
      }
    }

    // ── 5. Incomes Endpoints ────────────────────────────────────────────────
    if (pathname === '/api/liff/incomes') {
      if (method === 'GET') {
        const res = await supaFetch(env, `incomes?user_id=eq.${uid}&order=date.desc,created_at.desc&limit=100`);
        // If table does not exist yet (404), return empty array gracefully
        if (!res.ok && res.status === 404) return jsonResponse([]);
        return jsonResponse(res.data || []);
      }

      if (method === 'POST') {
        const body = await request.json().catch(() => ({}));
        if (!body.title?.trim() || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
          return jsonResponse({ error: 'Valid title and amount required' }, 400);
        }
        const category = body.category && body.category !== 'อื่นๆ'
          ? body.category
          : autoIncomeCategory(body.title.trim());

        const newIncome = {
          id: crypto.randomUUID(),
          user_id: uid,
          title: body.title.trim(),
          amount: Number(body.amount),
          category,
          date: body.date || new Date().toISOString().slice(0, 10),
          created_at: new Date().toISOString(),
        };
        const res = await supaFetch(env, 'incomes', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(newIncome),
        });
        if (!res.ok) return jsonResponse({ error: res.error }, 500);
        return jsonResponse(res.data?.[0] || newIncome, 201);
      }
    }

    // Incomes Batch Delete: POST /api/liff/incomes/batch-delete
    if (pathname === '/api/liff/incomes/batch-delete' && method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
      if (ids.length === 0) return jsonResponse({ error: 'ids array is required' }, 400);
      const safeIds = ids.map((id) => `"${encodeURIComponent(id)}"`).join(',');
      const res = await supaFetch(env, `incomes?user_id=eq.${uid}&id=in.(${safeIds})`, {
        method: 'DELETE',
      });
      if (!res.ok) return jsonResponse({ error: res.error }, 500);
      return jsonResponse({ success: true, count: ids.length });
    }

    // Income Item: /api/liff/incomes/:id
    const incMatch = pathname.match(/^\/api\/liff\/incomes\/([a-zA-Z0-9-]+)$/);
    if (incMatch) {
      const incId = incMatch[1];
      if (method === 'PATCH') {
        const body = await request.json().catch(() => ({}));
        const allowed = ['title', 'amount', 'category', 'date'];
        const patch = {};
        for (const k of allowed) {
          if (k in body) patch[k] = k === 'amount' ? Number(body[k]) : body[k];
        }
        const res = await supaFetch(env, `incomes?id=eq.${incId}&user_id=eq.${uid}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(patch),
        });
        if (!res.ok) return jsonResponse({ error: res.error }, 500);
        return jsonResponse(res.data?.[0] || { id: incId, ...patch });
      }

      if (method === 'DELETE') {
        const res = await supaFetch(env, `incomes?id=eq.${incId}&user_id=eq.${uid}`, {
          method: 'DELETE',
        });
        if (!res.ok) return jsonResponse({ error: res.error }, 500);
        return jsonResponse({ success: true, id: incId });
      }
    }

    // ── 6. Summary Endpoint: GET /api/liff/summary ──────────────────────────
    if (pathname === '/api/liff/summary' && method === 'GET') {
      const range = url.searchParams.get('range') || 'month'; // 'today' | '7d' | 'month' | 'all'
      const today = new Date().toISOString().slice(0, 10);
      let fromDate = null;

      if (range === 'today') {
        fromDate = today;
      } else if (range === '7d') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        fromDate = d.toISOString().slice(0, 10);
      } else if (range === 'month') {
        fromDate = today.slice(0, 7) + '-01';
      }

      let expQuery = `expenses?user_id=eq.${uid}&select=amount,category,date`;
      let incQuery = `incomes?user_id=eq.${uid}&select=amount,category,date`;
      if (fromDate) {
        expQuery += `&date=gte.${fromDate}`;
        incQuery += `&date=gte.${fromDate}`;
      }

      const [expRes, incRes, tasksRes] = await Promise.all([
        supaFetch(env, expQuery),
        supaFetch(env, incQuery),
        supaFetch(env, `tasks?user_id=eq.${uid}&select=status`),
      ]);

      const expenses = expRes.data || [];
      const incomes = incRes.data || [];
      const tasks = tasksRes.data || [];

      const totalExpense = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const totalIncome = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const balance = totalIncome - totalExpense;

      const pendingTasks = tasks.filter((t) => t.status !== 'done').length;
      const completedTasks = tasks.filter((t) => t.status === 'done').length;

      return jsonResponse({
        range,
        totalIncome,
        totalExpense,
        balance,
        pendingTasks,
        completedTasks,
        totalTasks: tasks.length,
      });
    }

    return jsonResponse({ error: 'Endpoint not found' }, 404);
  } catch (err) {
    console.error('[LIFF API Error]', pathname, err);
    return jsonResponse({ error: err.message }, 500);
  }
}

// ── Auto-Categorization Helpers ─────────────────────────────────────────────

function autoExpenseCategory(title) {
  if (!title) return 'อื่นๆ';
  const t = title.toLowerCase();

  // 1. เดินทาง (Check fuel & transport before drinks/bills)
  if (/รถ|taxi|แท็กซี่|บัส|ตั๋ว|เดินทาง|bts|mrt|grab|bolt|ราคา|น้ำมัน|ทางด่วน|ค่าน้ำมัน|วิน|มอเตอร์ไซค์|เครื่องบิน|รถไฟ|เรือ|ค่าที่จอด|จอดรถ|เติมน้ำมัน|gasoline|ปั๊ม/.test(t)) return 'เดินทาง';

  // 2. บิล / ที่พัก (Check utilities before drinks)
  if (/ค่าไฟ|ค่าน้ำ(?!ตก)|น้ำประปา|อินเตอร์เน็ต|ค่าเช่า|ค่าห้อง|บิล|โทรศัพท์|มือถือ|เน็ต|ส่วนกลาง|คอนโด|หอพัก|ค่าเน็ต|ค่าโทร|บัตรเครดิต/.test(t)) return 'บิล/ที่พัก';

  // 3. สุขภาพ
  if (/ยา|หมอ|โรงพยาบาล|คลินิก|สุขภาพ|นวด|ฟิตเนส|วิตามิน|รักษา|ตรวจสุขภาพ|หมอฟัน|ทำฟัน|คอนแทคเลนส์|ค่ายา/.test(t)) return 'สุขภาพ';

  // 4. เครื่องดื่ม (Drinks)
  if (/กาแฟ|ชา(?!บู)|น้ำ(?!มัน|ประปา|ตก)|เครื่องดื่ม|ชานม|coffee|tea|boba|โอเลี้ยง|สมูทตี้|smoothie|เป๊ปซี่|pepsi|โค้ก|coke|เบียร์|beer|ไวน์|เหล้า|นม|นมสด|milk|น้ำผลไม้|น้ำเปล่า|ลาเต้|เอสเปรสโซ|คาปูชิโน|มัทฉะ|อเมริกาโน|โกโก้|ช็อกโกแลต|ม็อกค่า|สไปรท์|แฟนต้า|เก๊กฮวย|โออิชิ|อิชิตัน|โซดา/.test(t)) return 'เครื่องดื่ม';

  // 5. บันเทิง (Entertainment & Gaming)
  if (/หนัง|เกม|เที่ยว|คอนเสิร์ต|ท่อง|netflix|spotify|youtube|ดูหนัง|คาราโอเกะ|สวนสนุก|ตั๋วหนัง|steam|เติมเกม|webtoon|เว็บตูน|นิยาย|การ์ตูน|disney/.test(t)) return 'บันเทิง';

  // 6. เสื้อผ้า / ช้อปปิ้ง / เครื่องสำอาง
  if (/เสื้อ|กางเกง|รองเท้า|กระเป๋า|แต่งตัว|เครื่องสำอาง|สกินแคร์|ครีม|ซักผ้า|ช้อปปิ้ง|shopping|ลิป|น้ำหอม|skincare|makeup/.test(t)) return 'เสื้อผ้า';

  // 7. อาหาร (Food - comprehensive menus, snacks & meals)
  if (/ข้าว|อาหาร|กินข้าว|ทานข้าว|ของกิน|กับข้าว|ก๋วยเตี๋ยว|บะหมี่|ราเมง|ราเม็ง|ramen|อุด้ง|udon|สปาเกตตี้|สปาเก็ตตี้|spaghetti|pasta|พาสต้า|มักกะโรนี|ผัดไทย|ผัดซีอิ๊ว|ราดหน้า|ขนมจีน|เกี๊ยว|ยากิโซบะ|หมู|ไก่|ปลา|กุ้ง|เป็ด|เนื้อ|ซีฟู้ด|แซลมอน|ทูน่า|ผัด|ต้ม|แกง|ยำ|ทอด|ปิ้ง|ย่าง|อบ|นึ่ง|ลวก|ลาบ|น้ำตก|ส้มตำ|ต้มยำ|แกงส้ม|สุกี้|ชาบู|shabu|หมูกระทะ|ปิ้งย่าง|บาร์บีคิว|bbq|บุฟเฟต์|buffet|hotpot|pizza|พิซซ่า|burger|เบอร์เกอร์|สเต็ก|steak|ซูชิ|sushi|ซาชิมิ|ทาโกยากิ|เกี๊ยวซ่า|ติ่มซำ|ซาลาเปา|ขนมจีบ|ลูกชิ้น|ไส้กรอก|หมูยอ|กุนเชียง|ฮอตดอก|เฟรนช์ฟรายส์|นักเก็ต|หมูปิ้ง|ไก่ทอด|โรตี|ขนมปัง|แซนวิช|sandwich|โทสต์|toast|วาฟเฟิล|เค้ก|cake|บราวนี่|ไอศกรีม|ไอติม|บิงซู|ขนม|เบเกอรี่|โดนัท|ครัวซองต์|ผลไม้|ร้านอาหาร|มื้อเช้า|มื้อเที่ยง|มื้อเย็น|อาหารเช้า|อาหารเย็น|อาหารกลางวัน/.test(t)) return 'อาหาร';

  return 'อื่นๆ';
}

function autoIncomeCategory(title) {
  if (!title) return 'อื่นๆ';
  const t = title.toLowerCase();
  if (/เงินเดือน|salary|wage|ค่าจ้างประจำ|เงินออก/.test(t)) return 'เงินเดือน';
  if (/โบนัส|bonus|คอมมิชชั่น|commission|ค่าคอม|รางวัล|incentive/.test(t)) return 'โบนัส';
  if (/ขาย|order|ออเดอร์|shopee|lazada|tiktok|ลูกค้า|เปิดบิล|ขายของ/.test(t)) return 'ขายของ';
  if (/ปันผล|หุ้น|crypto|ดอกเบี้ย|กองทุน|กำไร|dividend|invest|เหรียญ|คริปโต/.test(t)) return 'ลงทุน';
  if (/ฟรีแลนซ์|จ้าง|freelance|งานนอก|ค่าสอน|ot|โอที|จ๊อบ|สอนพิเศษ|เขียนบทความ|ถ่ายภาพ|ออกแบบ|กราฟิก/.test(t)) return 'ฟรีแลนซ์';
  if (/ของขวัญ|แต๊ะเอีย|อั่งเปา|ช่วย|ให้เงิน|เงินให้|มรดก|พ่อให้|แม่ให้|แฟนให้|เงินคืน|refund/.test(t)) return 'ของขวัญ';
  return 'อื่นๆ';
}

// ── Legacy LINE OAuth Callback Handler ──────────────────────────────────────

async function handleLineCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const origin = url.origin;

  if (error || !code) {
    return redirect(origin, `auth_error=${encodeURIComponent(error || 'no_code')}`);
  }

  const supaUrl = env.SUPABASE_URL;
  const supaKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supaUrl || !supaKey || !env.LINE_CHANNEL_ID || !env.LINE_CHANNEL_SECRET) {
    return redirect(origin, 'auth_error=server_misconfigured');
  }

  const supaHeaders = {
    apikey: supaKey,
    Authorization: `Bearer ${supaKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Exchange code for LINE access token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${origin}/api/auth/line-callback`,
        client_id: env.LINE_CHANNEL_ID,
        client_secret: env.LINE_CHANNEL_SECRET,
      }).toString(),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error('LINE token exchange failed');

    // 2. Get LINE user profile
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    const { userId: lineUserId, displayName, pictureUrl } = profile;
    if (!lineUserId) throw new Error('No LINE user ID in profile');

    // 3. Look up user in line_users table
    const lookupRes = await fetch(
      `${supaUrl}/rest/v1/line_users?line_user_id=eq.${encodeURIComponent(lineUserId)}&select=user_id`,
      { headers: { apikey: supaKey, Authorization: `Bearer ${supaKey}` } }
    );
    const lineUsers = await lookupRes.json();

    const lineEmail = `line_${lineUserId}@memo.internal`;
    let userId;
    let userEmail;

    if (Array.isArray(lineUsers) && lineUsers.length > 0) {
      userId = lineUsers[0].user_id;
      await fetch(
        `${supaUrl}/rest/v1/line_users?line_user_id=eq.${encodeURIComponent(lineUserId)}`,
        {
          method: 'PATCH',
          headers: { ...supaHeaders, Prefer: 'return=minimal' },
          body: JSON.stringify({ display_name: displayName, picture_url: pictureUrl }),
        }
      );
      const userRes = await fetch(`${supaUrl}/auth/v1/admin/users/${userId}`, {
        headers: supaHeaders,
      });
      const userData = await userRes.json();
      userEmail = userData.email;
      if (!userEmail) throw new Error(`Could not get email for user ${userId}`);
    } else {
      const createRes = await fetch(`${supaUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: supaHeaders,
        body: JSON.stringify({ email: lineEmail, email_confirm: true }),
      });
      const newUser = await createRes.json();

      if (newUser.id) {
        userId = newUser.id;
        userEmail = lineEmail;
      } else if (newUser.error_code === 'email_exists') {
        const listRes = await fetch(
          `${supaUrl}/auth/v1/admin/users?email=${encodeURIComponent(lineEmail)}&page=1&per_page=1`,
          { headers: supaHeaders }
        );
        const listData = await listRes.json();
        userId = listData?.users?.[0]?.id;
        userEmail = listData?.users?.[0]?.email ?? lineEmail;
        if (!userId) throw new Error('email_exists but could not find existing user');
      } else {
        throw new Error(`Failed to create Supabase user: ${JSON.stringify(newUser)}`);
      }

      await fetch(`${supaUrl}/rest/v1/line_users`, {
        method: 'POST',
        headers: { ...supaHeaders, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          line_user_id: lineUserId,
          user_id: userId,
          display_name: displayName,
          picture_url: pictureUrl,
        }),
      });
    }

    // 4. Generate magic link using the user's actual registered email
    const linkRes = await fetch(`${supaUrl}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: supaHeaders,
      body: JSON.stringify({
        type: 'magiclink',
        email: userEmail,
        options: { redirect_to: `${origin}/dashboard` },
      }),
    });
    const linkData = await linkRes.json();
    if (!linkData.action_link) throw new Error('Failed to generate magic link');

    return Response.redirect(linkData.action_link, 302);
  } catch (err) {
    console.error('[line-callback]', err.message);
    return redirect(origin, `auth_error=${encodeURIComponent(err.message)}`);
  }
}

function redirect(origin, query) {
  return Response.redirect(`${origin}/dashboard?${query}`, 302);
}
