"use client";

import dynamic from "next/dynamic";
import { LoaderCircle } from "lucide-react";

const AnalyticsPage = dynamic(() => import("./page"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-24 text-warm-50">
      <div className="flex items-center gap-3 rounded-lg border border-amber-200/12 bg-amber-200/[0.06] px-6 py-4">
        <LoaderCircle className="h-5 w-5 animate-spin text-amber-400" />
        <span className="text-sm font-semibold">Cargando analíticas...</span>
      </div>
    </div>
  ),
});

export default function LazyAnalytics() {
  return <AnalyticsPage />;
}
