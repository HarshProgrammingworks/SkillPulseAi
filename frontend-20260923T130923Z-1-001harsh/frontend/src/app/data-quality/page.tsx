"use client";

import { useEffect } from "react";

export default function DataQualityRoute() {
  useEffect(() => {
    // Seamlessly redirect to the root page with the quality tab active (works on both Vercel and GitHub Pages)
    const target = window.location.pathname.startsWith("/SkillPulseAi")
      ? "/SkillPulseAi/?tab=quality"
      : "/?tab=quality";
    window.location.replace(target);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="text-center space-y-3">
        <div className="h-8 w-8 mx-auto border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-700">Loading Data Quality & Multi-Verification Audit...</p>
      </div>
    </div>
  );
}
