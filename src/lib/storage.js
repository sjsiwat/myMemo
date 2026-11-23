import { db } from "@/lib/supabaseClient";

const LOCAL_KEY = "memo-plus-lite-state";
const OUTBOX_KEY = "memo-plus-outbox-v1";
// Set the moment a real sign-in succeeds, cleared on sign-out. Lets the auth
// bootstrap decide — synchronously, before the async Supabase session check
// resolves — whether LOCAL_KEY is trustworthy cached account data.
const AUTH_HINT_KEY = "memo-plus-auth-hint";

let syncTimer = null;
let syncChangeListener = null;
let activeFlushPromise = null;
let flushAgainAfterCurrent = false;

function toTimestamp(val, fallback) {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val) {
    const parsed = new Date(val).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  return typeof fallback === "number" && Number.isFinite(fallback) ? fallback : Date.now();
}

function isOffline() {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

function localLoad() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function localSave(state) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("[storage] localSave failed:", err);
  }
}

function loadOutbox() {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOutbox(queue) {
  try {
    if (queue.length === 0) {
      localStorage.removeItem(OUTBOX_KEY);
    } else {
      localStorage.setItem(OUTBOX_KEY, JSON.stringify(queue));
    }
  } catch (err) {
    console.error("[storage] saveOutbox failed:", err);
  }
}

/* ── Cloud row mappers ── */

export function rowToTask(row) {
  const createdAt = toTimestamp(row.created_at);
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
    createdAt,
    updatedAt: toTimestamp(row.updated_at, createdAt),
  };
}

export function rowToNote(row) {
  const createdAt = toTimestamp(row.created_at);
  return {
    id: row.id,
    title: row.title,
    body: row.body || "",
    tags: row.tags || "",
    createdAt,
    updatedAt: toTimestamp(row.updated_at, createdAt),
  };
}

export function rowToExpense(row) {
  const createdAt = toTimestamp(row.created_at);
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    category: row.category,
    date: row.date || "",
    createdAt,
    updatedAt: toTimestamp(row.updated_at, createdAt),
  };
}

export const ROW_MAPPERS = {
  tasks: rowToTask,
  notes: rowToNote,
  expenses: rowToExpense,
};

function taskToRow(task, uid) {
  const createdAt = toTimestamp(task.createdAt);
  const updatedAt = toTimestamp(task.updatedAt, createdAt);
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
    created_at: new Date(createdAt).toISOString(),
    updated_at: new Date(updatedAt).toISOString(),
  };
}

function noteToRow(note, uid) {
  const createdAt = toTimestamp(note.createdAt);
  const updatedAt = toTimestamp(note.updatedAt, createdAt);
  return {
    id: note.id,
    user_id: uid,
    title: note.title,
    body: note.body || "",
    tags: note.tags || "",
    created_at: new Date(createdAt).toISOString(),
    updated_at: new Date(updatedAt).toISOString(),
  };
}

function expenseToRow(expense, uid) {
  const createdAt = toTimestamp(expense.createdAt);
  const updatedAt = toTimestamp(expense.updatedAt, createdAt);
  return {
    id: expense.id,
    user_id: uid,
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    date: expense.date || null,
    created_at: new Date(createdAt).toISOString(),
    updated_at: new Date(updatedAt).toISOString(),
  };
}

const TO_ROW_MAPPERS = {
  tasks: taskToRow,
  notes: noteToRow,
  expenses: expenseToRow,
};

/* ── Pure Outbox Coalescing & Row-Level LWW Merge ── */

export function coalesceOutbox(queue, entry) {
  const next = queue.filter((e) => !(e.table === entry.table && e.id === entry.id));
  next.push(entry);
  return next;
}

export function mergeCollection(table, localItems, cloudItems, outboxEntries) {
  const pendingById = new Map();
  for (const entry of outboxEntries) {
    if (entry.table === table) pendingById.set(entry.id, entry);
  }

  const localById = new Map();
  for (const item of localItems || []) {
    localById.set(item.id, item);
  }

  const merged = new Map();

  // 1. Reconcile rows present on Cloud
  for (const cloudItem of cloudItems || []) {
    const pending = pendingById.get(cloudItem.id);
    if (pending?.op === "delete") {
      // Pending local delete has not flushed yet — keep hidden locally
      continue;
    }
    if (pending?.op === "upsert") {
      const localItem = localById.get(cloudItem.id) || pending.data;
      const localUpdated = toTimestamp(pending.updatedAt, localItem?.createdAt);
      const cloudUpdated = toTimestamp(cloudItem.updatedAt, cloudItem.createdAt);
      merged.set(cloudItem.id, localUpdated >= cloudUpdated ? localItem : cloudItem);
      continue;
    }
    merged.set(cloudItem.id, cloudItem);
  }

  // 2. Keep local-only rows ONLY if they are pending offline upserts.
  //    Rows absent from Cloud and absent from Outbox were deleted on another device.
  for (const localItem of localItems || []) {
    if (merged.has(localItem.id)) continue;
    const pending = pendingById.get(localItem.id);
    if (pending?.op === "upsert") {
      merged.set(localItem.id, localItem);
    }
  }

  return [...merged.values()].sort((a, b) => toTimestamp(b.createdAt, 0) - toTimestamp(a.createdAt, 0));
}

/* ── Outbox Flush Engine ── */

async function flushTableOps(table, entries, uid) {
  const upserts = entries.filter((e) => e.op === "upsert" && e.data);
  const deletes = entries.filter((e) => e.op === "delete");
  const succeeded = [];
  const errors = [];

  if (upserts.length > 0) {
    const toRow = TO_ROW_MAPPERS[table];
    const rows = upserts.map((e) => toRow(e.data, uid));
    const { error } = await db.from(table).upsert(rows, { onConflict: "id" });
    if (error) {
      console.error(`[storage] upsert ${table}:`, error.message);
      errors.push(`upsert ${table}: ${error.message}`);
    } else {
      succeeded.push(...upserts);
    }
  }

  if (deletes.length > 0) {
    const ids = deletes.map((e) => e.id);
    const { error } = await db.from(table).delete().eq("user_id", uid).in("id", ids);
    if (error) {
      console.error(`[storage] delete ${table}:`, error.message);
      errors.push(`delete ${table}: ${error.message}`);
    } else {
      succeeded.push(...deletes);
    }
  }

  return { succeeded, errors };
}

function removeFlushedEntries(succeeded) {
  if (succeeded.length === 0) return;
  const succeededKey = new Map(
    succeeded.map((e) => [`${e.table}:${e.id}`, `${e.op}:${e.updatedAt}`])
  );
  const live = loadOutbox();
  // Only drop an entry if no newer local edit overwrote it while the request was in flight
  const remaining = live.filter((e) => {
    const sig = succeededKey.get(`${e.table}:${e.id}`);
    return sig !== `${e.op}:${e.updatedAt}`;
  });
  saveOutbox(remaining);
}

async function runFlush(uid) {
  if (!uid) return { ok: true, flushed: 0 };

  const snapshot = loadOutbox();
  if (snapshot.length === 0) return { ok: true, flushed: 0 };

  if (isOffline()) {
    syncChangeListener?.("offline");
    return { ok: false, offline: true, flushed: 0 };
  }

  syncChangeListener?.("syncing");
  try {
    const tables = ["tasks", "notes", "expenses"];
    const results = await Promise.all(
      tables.map((table) => {
        const entries = snapshot.filter((e) => e.table === table);
        return entries.length > 0
          ? flushTableOps(table, entries, uid)
          : Promise.resolve({ succeeded: [], errors: [] });
      })
    );

    const allSucceeded = results.flatMap((r) => r.succeeded);
    const allErrors = results.flatMap((r) => r.errors);

    removeFlushedEntries(allSucceeded);

    if (allErrors.length > 0) {
      const msg = allErrors.join("; ");
      syncChangeListener?.(isOffline() ? "offline" : "error", msg);
      return { ok: false, flushed: allSucceeded.length, error: msg };
    }

    // If new edits arrived while flushing, loop once more
    if (loadOutbox().length > 0) {
      return runFlush(uid);
    }

    syncChangeListener?.("synced");
    return { ok: true, flushed: allSucceeded.length };
  } catch (err) {
    console.error("[storage] flushOutbox failed:", err);
    const msg = err?.message || "Sync failed";
    syncChangeListener?.(isOffline() ? "offline" : "error", msg);
    return { ok: false, flushed: 0, error: msg };
  }
}

export const Storage = {
  loadLocal(defaultState) {
    const saved = localLoad();
    return saved ? { ...defaultState, ...saved } : defaultState;
  },

  saveSnapshot(state, isLoggedIn) {
    if (!isLoggedIn) return;
    localSave(state);
  },

  hasAuthHint() {
    return localStorage.getItem(AUTH_HINT_KEY) === "1";
  },

  setAuthHint(on) {
    if (on) localStorage.setItem(AUTH_HINT_KEY, "1");
    else localStorage.removeItem(AUTH_HINT_KEY);
  },

  // Wipe cached account snapshot + pending outbox on sign-out so the next
  // session can never inherit a previous account's data or mutations.
  clearLocal() {
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem(OUTBOX_KEY);
  },

  getOutbox() {
    return loadOutbox();
  },

  getPendingOp(table, id) {
    return loadOutbox().find((e) => e.table === table && e.id === id) || null;
  },

  enqueueUpsert(table, item, isLoggedIn, uid) {
    if (!isLoggedIn || !uid || !item?.id) return;
    const updatedAt = toTimestamp(item.updatedAt, item.createdAt);
    const queue = coalesceOutbox(loadOutbox(), {
      op: "upsert",
      table,
      id: item.id,
      data: { ...item, updatedAt },
      updatedAt,
    });
    saveOutbox(queue);
    this.scheduleFlush(uid, 1500);
  },

  enqueueDelete(table, id, isLoggedIn, uid) {
    if (!isLoggedIn || !uid || !id) return;
    const queue = coalesceOutbox(loadOutbox(), {
      op: "delete",
      table,
      id,
      updatedAt: Date.now(),
    });
    saveOutbox(queue);
    // Deletes flush right away so closing/refreshing the tab doesn't delay them
    this.flushOutbox(uid);
  },

  scheduleFlush(uid, delayMs = 1500) {
    if (!uid) return;
    if (syncTimer) clearTimeout(syncTimer);
    syncChangeListener?.(isOffline() ? "offline" : "pending");
    syncTimer = setTimeout(() => {
      syncTimer = null;
      this.flushOutbox(uid);
    }, delayMs);
  },

  async flushOutbox(uid) {
    if (!uid) return { ok: true, flushed: 0 };
    if (syncTimer) {
      clearTimeout(syncTimer);
      syncTimer = null;
    }
    if (activeFlushPromise) {
      flushAgainAfterCurrent = true;
      return activeFlushPromise;
    }
    activeFlushPromise = (async () => {
      try {
        let res = await runFlush(uid);
        while (flushAgainAfterCurrent) {
          flushAgainAfterCurrent = false;
          if (loadOutbox().length > 0 && !isOffline()) {
            res = await runFlush(uid);
          }
        }
        return res;
      } finally {
        activeFlushPromise = null;
      }
    })();
    return activeFlushPromise;
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
        tasks: (tasksRes.data || []).map(rowToTask),
        notes: (notesRes.data || []).map(rowToNote),
        expenses: (expensesRes.data || []).map(rowToExpense),
      };
    } catch (err) {
      console.error("[storage] loadCloud failed:", err);
      return null;
    }
  },

  async pullAndMerge(uid, localState) {
    const cloud = await this.loadCloud(uid);
    if (!cloud) return null;
    const outbox = loadOutbox();
    return {
      tasks: mergeCollection("tasks", localState.tasks, cloud.tasks, outbox),
      notes: mergeCollection("notes", localState.notes, cloud.notes, outbox),
      expenses: mergeCollection("expenses", localState.expenses, cloud.expenses, outbox),
    };
  },
};

export { LOCAL_KEY, OUTBOX_KEY, AUTH_HINT_KEY };
