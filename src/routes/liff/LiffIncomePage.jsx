import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Trash2, Edit2, AlertCircle, X, Search, TrendingUp } from "lucide-react";
import { LiffApi } from "@/lib/liffApi";

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const INCOME_CATEGORIES = ["เงินเดือน", "โบนัส", "ขายของ", "ลงทุน", "ฟรีแลนซ์", "ของขวัญ", "อื่นๆ"];

export default function LiffIncomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "เงินเดือน",
    date: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  // Confirm delete dialog
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    ids: [],
    title: "",
  });
  const [deleting, setDeleting] = useState(false);

  const fetchIncomes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await LiffApi.getIncomes();
      setIncomes(data || []);
    } catch (err) {
      setError(err.message || "ไม่สามารถโหลดข้อมูลรายรับได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
    if (searchParams.get("action") === "add") {
      openAddModal();
      searchParams.delete("action");
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredIncomes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIncomes.map((i) => i.id)));
    }
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: "",
      amount: "",
      category: "เงินเดือน",
      date: new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item, e) => {
    e.stopPropagation();
    setEditingItem(item);
    setFormData({
      title: item.title,
      amount: String(item.amount),
      category: item.category || "เงินเดือน",
      date: item.date || new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount);
    if (!formData.title.trim() || isNaN(amt) || amt <= 0) {
      alert("กรุณากรอกชื่อและจำนวนเงินที่ถูกต้อง");
      return;
    }

    setSaving(true);
    try {
      if (editingItem) {
        const updated = await LiffApi.updateIncome(editingItem.id, {
          ...formData,
          amount: amt,
        });
        setIncomes((prev) =>
          prev.map((i) => (i.id === editingItem.id ? { ...i, ...updated } : i))
        );
      } else {
        const created = await LiffApi.createIncome({
          ...formData,
          amount: amt,
        });
        setIncomes((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.message || "บันทึกรายรับไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const requestDeleteOne = (item, e) => {
    e.stopPropagation();
    setDeleteConfirm({
      isOpen: true,
      ids: [item.id],
      title: `"${item.title}" (฿${formatMoney(item.amount)})`,
    });
  };

  const requestDeleteBatch = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirm({
      isOpen: true,
      ids: Array.from(selectedIds),
      title: `${selectedIds.size} รายการที่เลือก`,
    });
  };

  const executeDelete = async () => {
    setDeleting(true);
    const { ids } = deleteConfirm;
    try {
      if (ids.length === 1) {
        await LiffApi.deleteIncome(ids[0]);
      } else {
        await LiffApi.batchDeleteIncomes(ids);
      }
      setIncomes((prev) => prev.filter((i) => !ids.includes(i.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setDeleteConfirm({ isOpen: false, ids: [], title: "" });
    } catch (err) {
      alert(err.message || "เกิดข้อผิดพลาดในการลบรายรับ");
    } finally {
      setDeleting(false);
    }
  };

  const filteredIncomes = incomes.filter((i) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      i.title?.toLowerCase().includes(q) ||
      i.category?.toLowerCase().includes(q)
    );
  });

  const totalFiltered = filteredIncomes.reduce(
    (s, i) => s + (Number(i.amount) || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-text">💰 รายรับ</h1>
          <p className="text-xs text-text-muted">
            รวม: <span className="font-serif font-semibold text-success">฿{formatMoney(totalFiltered)}</span>
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-fg transition active:scale-95"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>เพิ่มรายรับ</span>
        </button>
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-text-muted" />
        <input
          type="text"
          placeholder="ค้นหารายรับ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full border border-border bg-surface-hover/60 py-1.5 pl-8 pr-3 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {/* ── Multi-select actions ─────────────────────────────────────────── */}
      {filteredIncomes.length > 0 && (
        <div className="flex items-center justify-between px-1 text-xs">
          <button
            onClick={selectAll}
            className="text-[11px] text-text-muted hover:text-text underline"
          >
            {selectedIds.size === filteredIncomes.length && filteredIncomes.length > 0
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

      {/* ── Income List ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex h-48 flex-col items-center justify-center space-y-2">
          <div className="h-6 w-6 animate-spin border-2 border-border border-t-accent" />
          <p className="text-xs text-text-muted">กำลังโหลดรายรับ...</p>
        </div>
      ) : error ? (
        <div className="border border-border bg-surface p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-danger" />
          <p className="mt-2 text-xs font-medium text-text">{error}</p>
          <button
            onClick={fetchIncomes}
            className="mt-3 bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg"
          >
            ลองใหม่
          </button>
        </div>
      ) : filteredIncomes.length === 0 ? (
        <div className="border border-dashed border-border bg-surface/50 p-8 text-center">
          <p className="text-xs text-text-muted">
            {searchQuery ? "ไม่พบรายรับที่ค้นหา" : "ยังไม่มีข้อมูลรายรับ"}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredIncomes.map((item) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleSelect(item.id)}
                className={`flex items-center justify-between border p-3 transition active:scale-[0.99] cursor-pointer ${
                  isSelected
                    ? "border-accent bg-accent/5"
                    : "border-border bg-surface hover:bg-surface-hover"
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(item.id);
                    }}
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center border transition ${
                      isSelected
                        ? "border-accent bg-accent text-accent-fg"
                        : "border-border-strong bg-surface"
                    }`}
                  >
                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                  </button>

                  <div className="truncate">
                    <p className="truncate text-xs font-medium text-text">{item.title}</p>
                    <p className="text-[10px] text-text-muted">
                      {item.category || "อื่นๆ"} • {formatDate(item.date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span className="font-serif text-xs font-semibold text-success">
                    +฿{formatMoney(item.amount)}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => openEditModal(item, e)}
                      title="แก้ไข"
                      className="p-1 text-text-muted hover:text-text active:scale-95"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => requestDeleteOne(item, e)}
                      title="ลบ"
                      className="p-1 text-text-muted hover:text-danger active:scale-95"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Fixed Bottom Delete Bar ──────────────────────────────────────── */}
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

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm border border-border bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-text">
                {editingItem ? "แก้ไขรายรับ" : "เพิ่มรายรับ"}
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
                  ชื่อรายการ *
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เงินเดือน, ค่าสอนพิเศษ"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full border border-border bg-surface-hover/60 px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-text-secondary">
                  จำนวนเงิน (บาท) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="เช่น 25000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 w-full border border-border bg-surface-hover/60 px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-text-secondary">
                    หมวดหมู่
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="mt-1 w-full border border-border bg-surface-hover/60 px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                  >
                    {INCOME_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-text-secondary">
                    วันที่
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 w-full border border-border bg-surface-hover/60 px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                  />
                </div>
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

      {/* ── Confirmation Modal ───────────────────────────────────────────── */}
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
                onClick={() => setDeleteConfirm({ isOpen: false, ids: [], title: "" })}
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
