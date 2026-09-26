"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function NotFound() {
  useEffect(() => {
    // If the URL matches /data-quality or /quality, navigate there
    if (typeof window !== "undefined") {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("quality") || path.includes("data-quality")) {
        window.location.replace("/SkillPulseAi/?tab=quality");
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-6">
      <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
        <div className="h-12 w-12 mx-auto rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-black">
          404
        </div>
        <h1 className="text-lg font-black text-slate-900">Page Not Found</h1>
        <p className="text-xs text-slate-500">
          The requested route was not found. Return to the SkillPulse AI Command Centre.
        </p>
        <div>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
          >
            Go to SkillPulse AI Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
