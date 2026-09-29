import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  AlertCircle,
  X,
  Search,
} from "lucide-react";
import { LiffApi } from "@/lib/liffApi";

export default function LiffTasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter: 'open' | 'all' | 'done'
  const [filter, setFilter] = useState("open");
  const [searchQuery, setSearchQuery] = useState("");

  // Multi-selection state for batch delete
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    status: "todo",
    priority: "medium",
    due: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  // Confirm delete dialog state
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    ids: [],
    title: "",
    isBatch: false,
  });
  const [deleting, setDeleting] = useState(false);

  // Fetch tasks from backend API
  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await LiffApi.getTasks();
      setTasks(data || []);
    } catch (err) {
      setError(err.message || "ไม่สามารถโหลดรายการงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (searchParams.get("action") === "add") {
      openAddModal();
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  // ── Multi-select toggle ───────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    if (selectedIds.size === filteredTasks.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    }
  };

  // ── Optimistic Toggle Status (todo ↔ done) ────────────────────────────────
  const toggleStatus = async (task) => {
    const nextStatus = task.status === "done" ? "todo" : "done";
    // 1. Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );

    try {
      await LiffApi.updateTask(task.id, { status: nextStatus });
    } catch (err) {
      console.error("[toggleStatus error]", err);
      // Rollback on failure
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
      alert("เกิดข้อผิดพลาดในการอัปเดตสถานะงาน");
    }
  };

  // ── Form Modals ───────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      status: "todo",
      priority: "medium",
      due: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task, e) => {
    e.stopPropagation();
    setEditingTask(task);
    setFormData({
      title: task.title,
      status: task.status,
      priority: task.priority || "medium",
      due: task.due || "",
      description: task.description || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      if (editingTask) {
        // Update
        const updated = await LiffApi.updateTask(editingTask.id, formData);
        setTasks((prev) =>
          prev.map((t) => (t.id === editingTask.id ? { ...t, ...updated } : t))
        );
      } else {
        // Create
        const created = await LiffApi.createTask(formData);
        setTasks((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || "บันทึกงานไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete Confirmations ──────────────────────────────────────────────────
  const requestDeleteOne = (task, e) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      ids: [task.id],
      title: `"${task.title}"`,
      isBatch: false,
    });
  };

  const requestDeleteBatch = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirm({
      isOpen: true,
      ids: Array.from(selectedIds),
      title: `${selectedIds.size} รายการที่เลือก`,
      isBatch: true,
    });
  };

  const executeDelete = async () => {
    setDeleting(true);
    const { ids } = deleteConfirm;
    try {
      if (ids.length === 1) {
        await LiffApi.deleteTask(ids[0]);
      } else {
        await LiffApi.batchDeleteTasks(ids);
      }
      setTasks((prev) => prev.filter((t) => !ids.includes(t.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteConfirm({ isOpen: false, ids: [], title: "", isBatch: false });
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบงาน");
    } finally {
      setDeleting(false);
    }
  };

  // ── Filter & Search Logic ─────────────────────────────────────────────────
  const filteredTasks = tasks.filter((t) => {
    if (filter === "open" && t.status === "done") return false;
    if (filter === "done" && t.status !== "done") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* ── Page Header & Filter Tabs ────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-text">📋 รายการงาน</h1>
          <p className="text-xs text-text-muted">
            {filter === "open"
              ? `ค้างอยู่ ${tasks.filter((t) => t.status !== "done").length} งาน`
              : `ทั้งหมด ${tasks.length} งาน`}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>เพิ่มงาน</span>
        </button>
      </div>

      {/* ── Search Bar & Filter Tabs ──────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
          <input
            type="text"
            placeholder="ค้นหางาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-border bg-surface-hover/60 py-1.5 pl-8 pr-3 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div className="flex border border-border bg-surface text-xs">
          <button
            onClick={() => setFilter("open")}
            className={`flex-1 py-1.5 font-medium transition ${
              filter === "open"
                ? "bg-accent text-accent-fg font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            งานค้าง ({tasks.filter((t) => t.status !== "done").length})
          </button>
          <button
            onClick={() => setFilter("done")}
            className={`flex-1 py-1.5 font-medium transition ${
              filter === "done"
                ? "bg-accent text-accent-fg font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            เสร็จแล้ว ({tasks.filter((t) => t.status === "done").length})
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-1.5 font-medium transition ${
              filter === "all"
                ? "bg-accent text-accent-fg font-semibold"
                : "text-text-muted hover:text-text"
            }`}
          >
            ทั้งหมด ({tasks.length})
          </button>
        </div>
      </div>

      {/* ── Multi-select Action Bar ───────────────────────────────────────── */}
      {filteredTasks.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs">
          <button
            onClick={selectAllFiltered}
            className="text-[11px] text-text-muted hover:text-text underline"
          >
            {selectedIds.size === filteredTasks.length && filteredTasks.length > 0
              ? "ยกเลิกเลือกทั้งหมด"
              : "เลือกทั้งหมด"}
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={requestDeleteBatch}
              className="flex items-center gap-1 text-xs font-semibold text-danger hover:underline active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>ลบ {selectedIds.size} รายการ</span>
            </button>
          )}
        </div>
      )}

      {/* ── Task List ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-48 flex-col items-center justify-center space-y-2">
          <div className="h-6 w-6 animate-spin border-2 border-border border-t-accent" />
          <p className="text-xs text-text-muted">กำลังโหลดรายการงาน...</p>
        </div>
      ) : error ? (
        <div className="border border-border bg-surface p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-danger" />
          <p className="mt-2 text-xs font-medium text-text">{error}</p>
          <button
            onClick={fetchTasks}
            className="mt-3 bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg"
          >
            ลองใหม่
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-xs text-text-muted">
            {searchQuery
              ? "ไม่พบงานที่ตรงกับคำค้นหา"
              : filter === "open"
              ? "ไม่มีงานค้างเลย 🎉 เยี่ยมมาก!"
              : "ยังไม่มีรายการงาน"}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredTasks.map((t, index) => {
            const isSelected = selectedIds.has(t.id);
            const isDone = t.status === "done";

            return (
              <div
                key={t.id}
                onClick={() => toggleSelect(t.id)}
                className={`flex items-start gap-2.5 border p-3 transition active:scale-[0.99] cursor-pointer ${
                  isSelected
                    ? "border-accent bg-accent/5"
                    : isDone
                    ? "border-border/60 bg-surface/60 opacity-70"
                    : "border-border bg-surface hover:bg-surface-hover"
                }`}
              >
                {/* Simulated Checkbox for Selection (☐ / ☑) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelect(t.id);
                  }}
                  className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center border transition ${
                    isSelected
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border-strong bg-surface"
                  }`}
                >
                  {isSelected && <span className="text-[10px] font-bold">✓</span>}
                </button>

                {/* Task Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-medium break-words ${
                        isDone ? "line-through text-text-muted" : "text-text"
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>

                  {t.description && (
                    <p className="mt-0.5 text-[11px] text-text-muted line-clamp-1">
                      {t.description}
                    </p>
                  )}

                  <div className="mt-1 flex items-center gap-2 text-[10px] text-text-muted">
                    {t.due && <span>กำหนด: {t.due}</span>}
                    {t.priority && (
                      <span
                        className={`capitalize ${
                          t.priority === "high"
                            ? "text-danger font-medium"
                            : t.priority === "medium"
                            ? "text-warning"
                            : "text-text-muted"
                        }`}
                      >
                        {t.priority}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Status Toggle, Edit, Delete */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Complete Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStatus(t);
                    }}
                    title={isDone ? "ทำเครื่องหมายเป็นยังไม่เสร็จ" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
                    className="p-1 text-text-muted hover:text-success active:scale-95"
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <Circle className="h-4 w-4 hover:text-accent" />
                    )}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={(e) => openEditModal(t, e)}
                    title="แก้ไข"
                    className="p-1 text-text-muted hover:text-text active:scale-95"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => requestDeleteOne(t, e)}
                    title="ลบ"
                    className="p-1 text-text-muted hover:text-danger active:scale-95"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Fixed Bottom Delete Bar when tasks are selected ───────────────── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-20 px-4">
          <div className="mx-auto flex max-w-md items-center justify-between border border-border bg-surface p-3 shadow-lg backdrop-blur-md">
            <span className="text-xs font-medium text-text">
              เลือกอยู่ {selectedIds.size} รายการ
            </span>
            <button
              onClick={requestDeleteBatch}
              className="flex items-center gap-1.5 bg-danger px-4 py-2 text-xs font-semibold text-white transition active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>ลบ {selectedIds.size} รายการ</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Add / Edit Task Modal ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm border border-border bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text">
                {editingTask ? "แก้ไขงาน" : "เพิ่มงานใหม่"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-text-secondary">
                  ชื่องาน *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ทำ API Login"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full border border-border bg-surface-hover/60 px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-secondary">
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  rows={2}
                  placeholder="บันทึกรายละเอียดงาน..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="mt-1 w-full border border-border bg-surface-hover/60 px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary">
                    สถานะ
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 w-full border border-border bg-surface-hover/60 px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                  >
                    <option value="todo">ค้าง (Todo)</option>
                    <option value="in_progress">กำลังทำ</option>
                    <option value="done">เสร็จแล้ว</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-secondary">
                    ความสำคัญ
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                    className="mt-1 w-full border border-border bg-surface-hover/60 px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                  >
                    <option value="low">ต่ำ</option>
                    <option value="medium">ปานกลาง</option>
                    <option value="high">ด่วน</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-secondary">
                  กำหนดส่ง (Due Date)
                </label>
                <input
                  type="date"
                  value={formData.due}
                  onChange={(e) => setFormData({ ...formData, due: e.target.value })}
                  className="mt-1 w-full border border-border bg-surface-hover/60 px-2.5 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border border-border bg-surface py-2 text-xs font-medium text-text transition hover:bg-surface-hover"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-accent py-2 text-xs font-semibold text-accent-fg transition active:scale-95 disabled:opacity-50"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal for Deletion ──────────────────────────────── */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xs border border-border bg-surface p-5 text-center shadow-xl">
            <Trash2 className="mx-auto h-7 w-7 text-danger" />
            <h4 className="mt-3 text-sm font-bold text-text">ยืนยันการลบ</h4>
            <p className="mt-1.5 text-xs text-text-secondary">
              ต้องการลบ {deleteConfirm.title}?
            </p>
            <p className="mt-0.5 text-[10px] text-danger">การกระทำนี้ไม่สามารถย้อนกลับได้</p>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setDeleteConfirm({ isOpen: false, ids: [], title: "", isBatch: false })
                }
                className="flex-1 border border-border bg-surface py-2 text-xs font-medium text-text transition hover:bg-surface-hover"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={executeDelete}
                className="flex-1 bg-danger py-2 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
              >
                {deleting ? "กำลังลบ..." : "ลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
