import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useState } from "react";
import { KanbanBoard } from "@/components/tasks/KanbanBoard";
import { TaskModal } from "@/components/tasks/TaskModal";

export default function TasksPage() {
  useDocumentTitle("Memo+ — งาน");
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="border border-accent bg-accent px-4 py-2 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-dim hover:border-accent-dim"
        >
          + เพิ่มงาน
        </button>
      </div>
      <KanbanBoard />
      {addOpen && <TaskModal taskId={null} defaultStatus="todo" onClose={() => setAddOpen(false)} />}
    </div>
  );
}