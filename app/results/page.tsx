import { Suspense } from "react";
import ResultsPageInner from "./ResultsPageInner";

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ResultsPageInner />
    </Suspense>
  );
}
