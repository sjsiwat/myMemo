import { db } from "@/lib/supabaseClient";

const LOCAL_KEY = "memo-plus-lite-state";
// Set the moment a real sign-in succeeds, cleared on sign-out. Lets the auth
// bootstrap decide — synchronously, before the async Supabase session check
// resolves — whether LOCAL_KEY is trustworthy cached account data.
const AUTH_HINT_KEY = "memo-plus-auth-hint";

let syncTimer = null;
let syncChangeListener = null;

function localLoad() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function localSave(state) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

/* ── Cloud row mappers ── */

function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || "",
    priority: row.priority,
    due: row.due || "",
    status: row.status,
    labels: Array.isArray(row.labels) ? row.labels : [],
    target_value: row.target_value != null ? Number(row.target_value) : null,
    target_unit: row.target_unit || "",
    progress_value: Number(row.progress_value) || 0,
    createdAt: new Date(row.created_at).getTime(),
  };
}

function rowToNote(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body || "",
    tags: row.tags || "",
    createdAt: new Date(row.created_at).getTime(),
  };
}

function rowToExpense(row) {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    date: row.date || "",
    createdAt: new Date(row.created_at).getTime(),
  };
}

// Re-applied now that supabase_migration_task_fields.sql has been run against
// the live `tasks` table (description/labels/target_value/target_unit/
// progress_value columns now exist) — see git history for the earlier
// revert + the empirical 400 that prompted it.
function taskToRow(task, uid) {
  return {
    id: task.id,
    user_id: uid,
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    due: task.due || null,
    status: task.status,
    labels: task.labels || [],
    target_value: task.target_value,
    target_unit: task.target_unit || "",
    progress_value: task.progress_value || 0,
    created_at: new Date(task.createdAt).toISOString(),
  };
}

function noteToRow(note, uid) {
  return {
    id: note.id,
    user_id: uid,
    title: note.title,
    body: note.body || "",
    tags: note.tags || "",
    created_at: new Date(note.createdAt).toISOString(),
  };
}

function expenseToRow(expense, uid) {
  return {
    id: expense.id,
    user_id: uid,
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    date: expense.date || null,
    created_at: new Date(expense.createdAt).toISOString(),
  };
}

/* ── Deduplicate items by title — keeps latest createdAt per unique title ── */
function dedupeByTitle(items) {
  const map = new Map();
  items.forEach((item) => {
    const key = item.title.trim().toLowerCase();
    const existing = map.get(key);
    if (!existing || item.createdAt > existing.createdAt) {
      map.set(key, item);
    }
  });
  return [...map.values()].sort((a, b) => b.createdAt - a.createdAt);
}

/* ── Cloud sync: upsert current items, delete orphans ── */
async function syncTable(
  table,
  items,
  toRow,
  uid
) {
  // Safety: never touch cloud when local is empty — prevents accidental wipe from bad merges
  if (items.length === 0) return;
  const { error: upsertErr } = await db.from(table).upsert(items.map((i) => toRow(i, uid)));
  if (upsertErr) {
    console.error(`[storage] upsert ${table}:`, upsertErr.message);
    throw new Error(`upsert ${table}: ${upsertErr.message}`);
  }
  const currentIds = items.map((i) => i.id);
  const { data: existing } = await db.from(table).select("id").eq("user_id", uid);
  const toDelete = (existing || []).map((r) => r.id).filter((id) => !currentIds.includes(id));
  if (toDelete.length > 0) {
    const { error } = await db.from(table).delete().in("id", toDelete);
    if (error) console.error(`[storage] delete ${table}:`, error.message);
  }
}

async function pushToCloud(state, uid) {
  syncChangeListener?.("syncing");
  try {
    const results = await Promise.allSettled([
      syncTable("tasks", state.tasks, taskToRow, uid),
      syncTable("notes", state.notes, noteToRow, uid),
      syncTable("expenses", state.expenses, expenseToRow, uid),
    ]);
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      const msg = failed.map((r) => (r.reason )?.message).filter(Boolean).join("; ");
      console.error("[storage] partial sync failure:", msg);
      syncChangeListener?.("error", msg);
    } else {
      syncChangeListener?.("synced");
    }
  } catch (err) {
    console.error("[storage] cloud sync failed:", err);
    syncChangeListener?.("error", (err ).message);
  }
}

export const Storage = {
  loadLocal(defaultState) {
    const saved = localLoad();
    return saved ? { ...defaultState, ...saved } : defaultState;
  },

  hasAuthHint() {
    return localStorage.getItem(AUTH_HINT_KEY) === "1";
  },

  setAuthHint(on) {
    if (on) localStorage.setItem(AUTH_HINT_KEY, "1");
    else localStorage.removeItem(AUTH_HINT_KEY);
  },

  // Wipe the cached account snapshot — used on sign-out so the next
  // not-logged-in view can never inherit a previous account's data.
  clearLocal() {
    localStorage.removeItem(LOCAL_KEY);
  },

  // Guest/signed-out is ephemeral — no persistence anywhere, no cloud sync.
  save(state, isLoggedIn, uid) {
    if (!isLoggedIn || !uid) return;
    localSave(state);
    if (syncTimer) clearTimeout(syncTimer);
    syncChangeListener?.("pending");
    syncTimer = setTimeout(() => pushToCloud(state, uid), 1500);
  },

  onSyncChange(fn) {
    syncChangeListener = fn;
  },

  async loadCloud(uid) {
    try {
      const [tasksRes, notesRes, expensesRes] = await Promise.all([
        db.from("tasks").select("*").eq("user_id", uid),
        db.from("notes").select("*").eq("user_id", uid),
        db.from("expenses").select("*").eq("user_id", uid),
      ]);
      if (tasksRes.error || notesRes.error || expensesRes.error) return null;
      return {
        tasks: dedupeByTitle((tasksRes.data ).map(rowToTask)),
        notes: dedupeByTitle((notesRes.data ).map(rowToNote)),
        expenses: dedupeByTitle((expensesRes.data ).map(rowToExpense)),
      };
    } catch (err) {
      console.error("[storage] loadCloud failed:", err);
      return null;
    }
  },

  // Immediate, targeted delete — bypasses the debounced diff-sync so a
  // deletion reaches Supabase right away, even if the tab closes/refreshes
  // before the next debounced push (and even if it was the last item).
  async deleteRow(table, id, uid) {
    if (!uid) return;
    try {
      const { error } = await db.from(table).delete().eq("id", id).eq("user_id", uid);
      if (error) console.error(`[storage] deleteRow ${table}:`, error.message);
    } catch (err) {
      console.error(`[storage] deleteRow ${table} failed:`, err);
    }
  },
};

export { LOCAL_KEY, AUTH_HINT_KEY };
