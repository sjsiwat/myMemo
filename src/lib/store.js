import { create } from "zustand";

export const defaultAppState = {
  theme: "light",
  tasks: [],
  notes: [],
  expenses: [],
  logs: [],
};

let localMutationListener = null;

export function setLocalMutationListener(fn) {
  localMutationListener = fn;
}

function emitLocalMutation(event) {
  localMutationListener?.(event);
}

function sortByCreatedDesc(items) {
  return [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export const useStore = create((set) => ({
  ...defaultAppState,
  syncStatus: "idle",
  syncErrorMessage: null,
  hydrated: false,

  setAll: (state) => set({ ...state }),
  setAllFromSync: (state) => set({ ...state }),
  setTheme: (theme) => {
    set({ theme });
    emitLocalMutation({ op: "theme", theme });
  },
  setSyncStatus: (syncStatus, message) => set({ syncStatus, syncErrorMessage: message ?? null }),
  setHydrated: (hydrated) => set({ hydrated }),
  resetToDefault: () => set({ ...defaultAppState, hydrated: false }),

  /* ── Local Mutations (emit to Outbox + Snapshot) ── */

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => {
    const now = Date.now();
    const item = { ...task, createdAt: task.createdAt ?? now, updatedAt: task.updatedAt ?? task.createdAt ?? now };
    set((s) => ({ tasks: [item, ...s.tasks] }));
    emitLocalMutation({ op: "upsert", table: "tasks", id: item.id, item });
  },
  updateTask: (id, patch) => {
    let updated = null;
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t;
        updated = { ...t, ...patch, updatedAt: Date.now() };
        return updated;
      }),
    }));
    if (updated) emitLocalMutation({ op: "upsert", table: "tasks", id, item: updated });
  },
  removeTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    emitLocalMutation({ op: "delete", table: "tasks", id });
  },

  setNotes: (notes) => set({ notes }),
  addNote: (note) => {
    const now = Date.now();
    const item = { ...note, createdAt: note.createdAt ?? now, updatedAt: note.updatedAt ?? note.createdAt ?? now };
    set((s) => ({ notes: [item, ...s.notes] }));
    emitLocalMutation({ op: "upsert", table: "notes", id: item.id, item });
  },
  updateNote: (id, patch) => {
    let updated = null;
    set((s) => ({
      notes: s.notes.map((n) => {
        if (n.id !== id) return n;
        updated = { ...n, ...patch, updatedAt: Date.now() };
        return updated;
      }),
    }));
    if (updated) emitLocalMutation({ op: "upsert", table: "notes", id, item: updated });
  },
  removeNote: (id) => {
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
    emitLocalMutation({ op: "delete", table: "notes", id });
  },

  setExpenses: (expenses) => set({ expenses }),
  addExpense: (expense) => {
    const now = Date.now();
    const item = {
      ...expense,
      createdAt: expense.createdAt ?? now,
      updatedAt: expense.updatedAt ?? expense.createdAt ?? now,
    };
    set((s) => ({ expenses: [item, ...s.expenses] }));
    emitLocalMutation({ op: "upsert", table: "expenses", id: item.id, item });
  },
  updateExpense: (id, patch) => {
    let updated = null;
    set((s) => ({
      expenses: s.expenses.map((e) => {
        if (e.id !== id) return e;
        updated = { ...e, ...patch, updatedAt: Date.now() };
        return updated;
      }),
    }));
    if (updated) emitLocalMutation({ op: "upsert", table: "expenses", id, item: updated });
  },
  removeExpense: (id) => {
    set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) }));
    emitLocalMutation({ op: "delete", table: "expenses", id });
  },

  /* ── Remote Sync Appliers (silent — never re-enqueue to Outbox) ── */

  applyRemoteUpsert: (table, item) => {
    set((s) => {
      const list = s[table];
      if (!Array.isArray(list)) return {};
      const existing = list.find((x) => x.id === item.id);
      if (existing) {
        const existingUpdated = existing.updatedAt ?? existing.createdAt ?? 0;
        const incomingUpdated = item.updatedAt ?? item.createdAt ?? 0;
        if (incomingUpdated < existingUpdated) return {};
        return { [table]: list.map((x) => (x.id === item.id ? item : x)) };
      }
      return { [table]: sortByCreatedDesc([item, ...list]) };
    });
  },

  applyRemoteDelete: (table, id) => {
    set((s) => {
      const list = s[table];
      if (!Array.isArray(list)) return {};
      if (!list.some((x) => x.id === id)) return {};
      return { [table]: list.filter((x) => x.id !== id) };
    });
  },
}));
