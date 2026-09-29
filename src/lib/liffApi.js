import { LiffAuth } from "./liff";

const API_BASE = import.meta.env.VITE_API_BASE || "";

async function request(path, options = {}) {
  const token = LiffAuth.getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Token might be expired, clear cached session
      sessionStorage.removeItem("memo_liff_session");
    }
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const LiffApi = {
  // ── Bootstrap ─────────────────────────────────────────────────────────────
  async getBootstrap() {
    return request("/api/liff/bootstrap");
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────
  async getTasks(status) {
    const q = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/api/liff/tasks${q}`);
  },

  async createTask(task) {
    return request("/api/liff/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  },

  async updateTask(id, patch) {
    return request(`/api/liff/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async deleteTask(id) {
    return request(`/api/liff/tasks/${id}`, {
      method: "DELETE",
    });
  },

  async batchDeleteTasks(ids) {
    return request("/api/liff/tasks/batch-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  async getExpenses() {
    return request("/api/liff/expenses");
  },

  async createExpense(expense) {
    return request("/api/liff/expenses", {
      method: "POST",
      body: JSON.stringify(expense),
    });
  },

  async updateExpense(id, patch) {
    return request(`/api/liff/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async deleteExpense(id) {
    return request(`/api/liff/expenses/${id}`, {
      method: "DELETE",
    });
  },

  async batchDeleteExpenses(ids) {
    return request("/api/liff/expenses/batch-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  },

  // ── Incomes ───────────────────────────────────────────────────────────────
  async getIncomes() {
    return request("/api/liff/incomes");
  },

  async createIncome(income) {
    return request("/api/liff/incomes", {
      method: "POST",
      body: JSON.stringify(income),
    });
  },

  async updateIncome(id, patch) {
    return request(`/api/liff/incomes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },

  async deleteIncome(id) {
    return request(`/api/liff/incomes/${id}`, {
      method: "DELETE",
    });
  },

  async batchDeleteIncomes(ids) {
    return request("/api/liff/incomes/batch-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    });
  },

  // ── Summary ───────────────────────────────────────────────────────────────
  async getSummary(range = "month") {
    return request(`/api/liff/summary?range=${encodeURIComponent(range)}`);
  },
};
