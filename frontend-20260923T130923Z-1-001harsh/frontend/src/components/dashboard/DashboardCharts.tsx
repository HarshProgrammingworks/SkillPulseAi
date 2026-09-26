"use client";

import React, { useState } from "react";
import { ChartDatasets } from "@/types";
import {
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  DollarSign,
  Clock,
  Briefcase,
  AlertTriangle,
  MapPin,
  HelpCircle
} from "lucide-react";

interface DashboardChartsProps {
  chartsData: ChartDatasets;
  onSelectDistrict?: (district: string) => void;
  onSelectSkill?: (skill: string) => void;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  chartsData,
  onSelectDistrict,
  onSelectSkill
}) => {
  const [hoveredOutcome, setHoveredOutcome] = useState<string | null>(null);
  const [hoveredWage, setHoveredWage] = useState<string | null>(null);

  const outcomes_breakdown = chartsData?.outcomes_breakdown || [];
  const employment_trend = chartsData?.employment_trend || [];
  const wage_progression = chartsData?.wage_progression || [];
  const retention_cohort = chartsData?.retention_cohort || [];
  const skill_gaps = chartsData?.skill_gaps || [];
  const district_benchmarks = chartsData?.district_benchmarks || [];

  const outcomesTotal = outcomes_breakdown.reduce((acc, curr) => acc + curr.value, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Row 1: Outcomes Breakdown & Employment Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Employment Outcomes Distribution */}
        <div className="gov-card p-5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Employment Outcomes Breakdown</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Verified Status
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Longitudinal classification distinguishing formal jobs, apprenticeships, and non-reporting.
            </p>

            {/* Stacked bar visualization */}
            <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-100 shadow-inner mb-4">
              {outcomes_breakdown.map((item) => {
                const pct = (item.value / outcomesTotal) * 100;
                if (pct === 0) return null;
                return (
                  <div
                    key={item.name}
                    style={{ width: `${pct}%`, backgroundColor: item.color }}
                    className="h-full transition-all duration-300 relative group cursor-pointer"
                    onMouseEnter={() => setHoveredOutcome(item.name)}
                    onMouseLeave={() => setHoveredOutcome(null)}
                    title={`${item.name}: ${item.value} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>

            {/* Legend and percentage list */}
            <div className="space-y-2">
              {chartsData.outcomes_breakdown.map((item) => {
                const pct = ((item.value / outcomesTotal) * 100).toFixed(1);
                const isHovered = hoveredOutcome === item.name;
                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => setHoveredOutcome(item.name)}
                    onMouseLeave={() => setHoveredOutcome(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg text-xs transition ${
                      isHovered ? "bg-slate-100 font-bold" : "text-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-800">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-900">{item.value}</span>
                      <span className="text-[11px] text-slate-400 w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total Evaluated: {outcomesTotal} trainees</span>
            <span className="text-emerald-700 font-semibold">Active Livelihoods: 78.4%</span>
          </div>
        </div>

        {/* Longitudinal Employment Trend Over Cohorts */}
        <div className="gov-card p-5 lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">Longitudinal Employment Trend</h3>
              </div>
              <span className="text-[10px] uppercase font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Quarterly Batches
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Enrolled vs. Certified vs. Sustained Employed candidates over quarterly batches.
            </p>

            {/* Bar & Rate Trend Visualizer */}
            <div className="grid grid-cols-4 gap-4 h-48 items-end pt-4 pb-2 border-b border-slate-200">
              {employment_trend.map((trend) => {
                const maxEnrolled = 100;
                const enrolledH = Math.min(100, Math.round((trend.enrolled / maxEnrolled) * 100));
                const certifiedH = Math.min(100, Math.round((trend.certified / maxEnrolled) * 100));
                const employedH = Math.min(100, Math.round((trend.employed / maxEnrolled) * 100));

                return (
                  <div key={trend.period} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[11px] font-bold text-sky-700 mb-1 group-hover:scale-110 transition">
                      {trend.employment_rate}%
                    </span>
                    <div className="flex items-end gap-1.5 h-36 w-full justify-center">
                      <div
                        style={{ height: `${enrolledH}%` }}
                        className="w-3 rounded-t bg-slate-300 transition-all hover:bg-slate-400"
                        title={`Enrolled: ${trend.enrolled}`}
                      />
                      <div
                        style={{ height: `${certifiedH}%` }}
                        className="w-3 rounded-t bg-sky-400 transition-all hover:bg-sky-500"
                        title={`Certified: ${trend.certified}`}
                      />
                      <div
                        style={{ height: `${employedH}%` }}
                        className="w-3.5 rounded-t bg-emerald-600 transition-all hover:bg-emerald-700 shadow-sm"
                        title={`Employed: ${trend.employed}`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 mt-2">{trend.period}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-300" />
              <span>Enrolled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-sky-400" />
              <span>Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
              <span className="font-semibold text-slate-800">Employed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Wage Progression & 6-Month Retention Cohort Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Wage Progression Curve */}
        <div className="gov-card p-5 lg:col-span-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">Wage Progression Over Career Lifecycle</h3>
            </div>
            <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Verified EPF & Payslips
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Mean and upper-quartile monthly wage increments from training completion to 12 months.
          </p>

          <div className="space-y-4">
            {wage_progression.map((item, idx) => {
              const maxWage = 26000;
              const barWidth = Math.min(100, Math.round((item.avg_wage / maxWage) * 100));
              const topWidth = Math.min(100, Math.round((item.top_quartile / maxWage) * 100));

              return (
                <div key={item.milestone} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{item.milestone}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900">₹{item.avg_wage.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400">(Top: ₹{item.top_quartile.toLocaleString()})</span>
                    </div>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden relative">
                    <div
                      style={{ width: `${topWidth}%` }}
                      className="h-full bg-teal-200 absolute top-0 left-0 rounded-full"
                    />
                    <div
                      style={{ width: `${barWidth}%` }}
                      className="h-full bg-teal-600 absolute top-0 left-0 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Entry baseline: ₹15,500</span>
            <span className="font-bold text-teal-700">+24.3% 6-Month Real Wage Hike</span>
          </div>
        </div>

        {/* Retention Survival Cohort */}
        <div className="gov-card p-5 lg:col-span-6">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Longitudinal Retention Survival Curve</h3>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              3m • 6m • 12m
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Percentage of candidates maintaining active livelihood vs. historical benchmark.
          </p>

          <div className="space-y-3.5">
            {retention_cohort.map((item) => (
              <div key={item.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-700">{item.retention_pct}%</span>
                    <span className="text-[10px] text-slate-400">vs benchmark {item.benchmark_pct}%</span>
                  </div>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden relative">
                  <div
                    style={{ width: `${item.benchmark_pct}%` }}
                    className="h-full bg-slate-300 absolute top-0 left-0 rounded-full"
                  />
                  <div
                    style={{ width: `${item.retention_pct}%` }}
                    className="h-full bg-amber-500 absolute top-0 left-0 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>6-Month Survival: 72.8%</span>
            <span className="text-amber-800 font-semibold">+8.6% above conventional skilling registries</span>
          </div>
        </div>
      </div>

      {/* Row 3: Top Skill Gaps (Demand vs Supply) & District Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Skill Gaps */}
        <div className="gov-card p-5 lg:col-span-7">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Top Skill Gaps (Market Demand vs Trained Supply)</h3>
            </div>
            <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Gap = Demand - Supply
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Skills with highest unfilled industry requisitions requiring urgent training capacity expansion.
          </p>

          <div className="space-y-3">
            {skill_gaps.map((g) => {
              const isShortage = g.gap > 0;
              return (
                <div
                  key={g.skill}
                  onClick={() => onSelectSkill && onSelectSkill(g.skill)}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-sky-300 hover:bg-sky-50/30 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">{g.skill}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        g.status === "Critical Shortage"
                          ? "bg-rose-100 text-rose-800 border border-rose-200"
                          : g.status === "Significant Shortage"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : g.status === "Oversupply Risk"
                          ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1.5">
                    <span>Demand: <strong className="text-slate-800">{g.demand}</strong></span>
                    <span>Available Supply: <strong className="text-slate-800">{g.supply}</strong></span>
                    <span className="font-bold">
                      Net Deficit:{" "}
                      <strong className={isShortage ? "text-rose-600" : "text-indigo-600"}>
                        {isShortage ? `-${g.gap}` : `+${Math.abs(g.gap)}`}
                      </strong>
                    </span>
                  </div>

                  {/* Dual bar representation */}
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${Math.min(100, (g.supply / g.demand) * 100)}%` }}
                      className={`h-full ${isShortage ? "bg-rose-500" : "bg-indigo-500"}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* District Performance Benchmarks */}
        <div className="gov-card p-5 lg:col-span-5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">District Performance Benchmark</h3>
            </div>
            <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              By district
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Comparison of employment outcomes and 6-month retention rates across districts.
          </p>

          <div className="space-y-2.5">
            {district_benchmarks.map((d) => (
              <div
                key={d.district}
                onClick={() => onSelectDistrict && onSelectDistrict(d.district)}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-100 hover:border-sky-300 hover:bg-sky-50/50 transition cursor-pointer"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">{d.district}</div>
                  <div className="text-[10px] text-slate-500">
                    {d.trainees} trainees • Avg ₹{d.avg_wage.toLocaleString()}/mo
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">Emp. Rate</div>
                    <div className="text-xs font-black text-emerald-600">{d.employment_rate}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-medium">6M Retention</div>
                    <div className="text-xs font-black text-amber-600">{d.retention_6m}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
