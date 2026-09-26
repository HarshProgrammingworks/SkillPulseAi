"use client";

import React from "react";
import { TrendingUp } from "lucide-react";

/** The official SkillPulse mark used throughout the platform as the SkillPulse AI logo. */
export const SkillPulseMark: React.FC<{ className?: string }> = ({ className = "h-9 w-9" }) => (
  <span className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-sky-800 to-indigo-700 text-white ${className}`} aria-hidden>
    <TrendingUp className="h-[60%] w-[60%]" />
  </span>
);
