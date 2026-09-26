"use client";

import React, { useState } from "react";
import {
  Users,
  Award,
  Briefcase,
  Store,
  Compass,
  Percent,
  Clock,
  IndianRupee,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Info
} from "lucide-react";
import { DashboardKpis } from "@/types";

interface KpiCardsGridProps {
  kpis: DashboardKpis;
  loading?: boolean;
}

export const KpiCardsGrid: React.FC<KpiCardsGridProps> = ({ kpis, loading }) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const cards = [
    {
      id: "total_trainees",
      label: "Total Trainees",
      data: kpis.total_trainees,
      icon: Users,
      color: "sky",
      badgeText: "Tracked Cohort"
    },
    {
      id: "certified",
      label: "Certified",
      data: kpis.certified,
      icon: Award,
      color: "indigo",
      badgeText: "NSQF Passed"
    },
    {
      id: "employed",
      label: "Employed",
      data: kpis.employed,
      icon: Briefcase,
      color: "emerald",
      badgeText: "Formal Wage"
    },
    {
      id: "self_employed",
      label: "Self-Employed",
      data: kpis.self_employed,
      icon: Store,
      color: "blue",
      badgeText: "Independent"
    },
    {
      id: "apprentices",
      label: "Apprentices",
      data: kpis.apprentices,
      icon: Compass,
      color: "violet",
      badgeText: "NAPS Active"
    },
    {
      id: "employment_rate",
      label: "Employment Rate",
      data: kpis.employment_rate,
      icon: Percent,
      color: "emerald",
      badgeText: "Livelihood Rate",
      isPrimaryRate: true
    },
    {
      id: "retention_6m",
      label: "6-Month Retention",
      data: kpis.retention_6m,
      icon: Clock,
      color: "amber",
      badgeText: "Continuity Rate",
      isKeyMetric: true
    },
    {
      id: "retention_3m",
      label: "3-Month Retention",
      data: kpis.retention_3m,
      icon: Clock,
      color: "amber",
      badgeText: "Checkpoint"
    },
    {
      id: "retention_9m",
      label: "9-Month Retention",
      data: kpis.retention_9m,
      icon: Clock,
      color: "amber",
      badgeText: "Checkpoint"
    },
    {
      id: "retention_12m",
      label: "12-Month Retention",
      data: kpis.retention_12m,
      icon: Clock,
      color: "amber",
      badgeText: "Checkpoint"
    },
    {
      id: "avg_monthly_wage",
      label: "Avg. Monthly Wage",
      data: kpis.avg_monthly_wage,
      icon: IndianRupee,
      color: "teal",
      badgeText: "Verified Wage",
      isKeyMetric: true
    },
    {
      id: "skill_gap_rate",
      label: "Skill Gap Rate",
      data: kpis.skill_gap_rate,
      icon: AlertOctagon,
      color: "rose",
      badgeText: "Deficit Index",
      invertTrend: true
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const d = c.data;
        if (!d) return null;

        const isPositive = c.invertTrend ? d.trend === "down" : d.trend === "up";

        return (
          <div
            key={c.id}
            className={`gov-card relative p-3.5 flex flex-col justify-between transition-all duration-200 ${
              c.isPrimaryRate ? "border-emerald-300 bg-emerald-50/20" : ""
            } ${c.isKeyMetric ? "border-sky-300 bg-sky-50/20" : ""}`}
          >
            {/* Top row: Label + Icon + Tooltip trigger */}
            <div className="flex items-start justify-between">
              <span className="text-[11px] font-bold text-slate-600 line-clamp-1">{c.label}</span>
              <div className="flex items-center gap-1">
                <div
                  onMouseEnter={() => setActiveTooltip(c.id)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  className="relative cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <Info className="h-3.5 w-3.5" />
                  {activeTooltip === c.id && (
                    <div className="absolute right-0 top-full mt-1.5 w-48 rounded-lg bg-slate-900 p-2 text-[10px] text-white shadow-xl z-50 pointer-events-none">
                      {d.tooltip}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Value row */}
            <div className="my-2">
              <div className="text-xl font-black tracking-tight text-slate-900">
                {loading ? <span className="animate-pulse text-slate-300">...</span> : d.value}
              </div>
            </div>

            {/* Bottom comparison and trend indicator */}
            <div className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1">
                {d.trend === "up" && (
                  <TrendingUp
                    className={`h-3 w-3 ${c.invertTrend ? "text-rose-500" : "text-emerald-600"}`}
                  />
                )}
                {d.trend === "down" && (
                  <TrendingDown
                    className={`h-3 w-3 ${c.invertTrend ? "text-emerald-600" : "text-rose-500"}`}
                  />
                )}
                <span
                  className={`font-bold ${
                    isPositive ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {d.change_pct > 0 ? `+${d.change_pct}%` : `${d.change_pct}%`}
                </span>
              </div>

              <span className="text-slate-400 font-medium">prev {d.prev}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
