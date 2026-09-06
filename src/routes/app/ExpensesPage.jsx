import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useState } from "react";
import { ExpenseComposerForm } from "@/components/expenses/ExpenseComposerForm";
import { ExpenseStats } from "@/components/expenses/ExpenseStats";
import { ExpenseList } from "@/components/expenses/ExpenseList";

export default function ExpensesPage() {
  useDocumentTitle("Memo+ — รายจ่าย");
  const [period, setPeriod] = useState("month");

  return (
    <div className="flex flex-col gap-4">
      <ExpenseComposerForm />
      <ExpenseStats period={period} onChange={setPeriod} />
      <ExpenseList period={period} />
    </div>
  );
}