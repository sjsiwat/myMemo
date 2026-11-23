import { useStore } from "@/lib/store";
import { getTodayKey } from "@/lib/format";

/**
 * Shared create/delete helpers.
 * Every mutation flows through Zustand's local mutation actions, which
 * automatically persist to localStorage and enqueue into the Outbox queue.
 */

export function addTask(
  title,
  priority = "Medium",
  due = "",
  status = "todo",
  description = "",
  labels = [],
  targetValue = null,
  targetUnit = ""
) {
  const now = Date.now();
  const task = {
    id: crypto.randomUUID(),
    title,
    description,
    priority,
    due,
    status,
    labels,
    target_value: targetValue ? Number(targetValue) : null,
    target_unit: targetUnit || "",
    progress_value: 0,
    createdAt: now,
    updatedAt: now,
  };
  useStore.getState().addTask(task);
  return task;
}

export function addNote(title, body = "", tags = "") {
  const now = Date.now();
  const note = {
    id: crypto.randomUUID(),
    title,
    body,
    tags,
    createdAt: now,
    updatedAt: now,
  };
  useStore.getState().addNote(note);
  return note;
}

export function addExpense(
  title,
  amount,
  category = "อื่นๆ",
  date = getTodayKey()
) {
  const now = Date.now();
  const expense = {
    id: crypto.randomUUID(),
    title,
    amount: Number(amount),
    category,
    date,
    createdAt: now,
    updatedAt: now,
  };
  useStore.getState().addExpense(expense);
  return expense;
}

export function deleteTask(id) {
  useStore.getState().removeTask(id);
}

export function deleteNote(id) {
  useStore.getState().removeNote(id);
}

export function deleteExpense(id) {
  useStore.getState().removeExpense(id);
}

export function isTaskDone(t) {
  return t.status === "done";
}
