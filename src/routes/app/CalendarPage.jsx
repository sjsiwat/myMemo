import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function CalendarPage() {
  useDocumentTitle("Memo+ — ปฏิทิน");
  return <CalendarView />;
}