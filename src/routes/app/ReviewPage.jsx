import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { ReviewView } from "@/components/review/ReviewView";

export default function ReviewPage() {
  useDocumentTitle("Memo+ — สรุป");
  return <ReviewView />;
}