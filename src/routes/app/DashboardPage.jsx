import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { QuickTiles } from "@/components/dashboard/QuickTiles";
import { TodayCommandCenter } from "@/components/dashboard/TodayCommandCenter";
import {
  FocusList,
  TodayCalendarPanel,
  ExpenseBarsPanel,
  RecentNotesPanel,
  MonthlyReviewWidget,
} from "@/components/dashboard/DashboardPanels";

export default function DashboardPage() {
  useDocumentTitle("Memo+ — Dashboard");
  return (
    <div className="flex flex-col gap-6">
      <QuickTiles />
      <TodayCommandCenter />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <FocusList />
        <TodayCalendarPanel />
        <ExpenseBarsPanel />
        <RecentNotesPanel />
        <MonthlyReviewWidget />
      </div>
    </div>
  );
}