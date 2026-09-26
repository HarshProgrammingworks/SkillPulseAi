"use client";

import React, { useEffect, useState } from "react";
import { DistrictInfo, DistrictDetail } from "@/types";
import { api } from "@/lib/api";
import { STATES, districtsFor, stateChosen } from "@/data/geography";
import { SkillPulseMark } from "@/components/brand/SkillPulseMark";

interface SkillMapIntelligenceProps {
  districts: DistrictInfo[];
  selectedDistrictName: string;
  onSelectDistrictName: (name: string) => void;
  districtDetail: DistrictDetail | null;
  mobilityFlows: any;
  onOpenSkillGap?: (skillName: string) => void;
  onAskAiAboutDistrict?: (districtName: string) => void;
}

const TABS = [
  { id: "supply", label: "Skill Supply" },
  { id: "demand", label: "Employer Demand" },
  { id: "gap", label: "Skill Gap" },
  { id: "future", label: "Future Demand" },
  { id: "wage", label: "Wage Intelligence" },
  { id: "mobility", label: "Mobility" },
  { id: "training", label: "Training Recommendation" }
];

const GAP_STYLE: Record<string, string> = {
  "High Gap": "bg-rose-50 text-rose-800 border-rose-200",
  "Moderate Gap": "bg-amber-50 text-amber-800 border-amber-200",
  "Low Gap": "bg-sky-50 text-sky-800 border-sky-200",
  "Potential Oversupply": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "Data unavailable": "bg-slate-50 text-slate-600 border-slate-200"
};

function Bar({ value, max, tone = "bg-sky-700" }: { value: number; max: number; tone?: string }) {
  const width = max > 0 ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(width, 100)}%` }} />
    </div>
  );
}

function Radar({ items }: { items: { skill: string; growth_yoy: number | null }[] }) {
  const points = items.filter((item) => typeof item.growth_yoy === "number").slice(0, 6);
  if (points.length < 3) {
    return <p className="text-xs text-slate-500">Not enough growth rates are stored to draw a radar. Rows without a growth rate are listed beside this chart.</p>;
  }
  const cx = 140;
  const cy = 140;
  const radius = 96;
  const max = Math.max(...points.map((item) => Math.abs(item.growth_yoy || 0)), 1);
  const coords = points.map((item, index) => {
    const angle = -Math.PI / 2 + (index / points.length) * Math.PI * 2;
    const r = radius * Math.max(0, (item.growth_yoy || 0) / max);
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  });
  const labels = points.map((item, index) => {
    const angle = -Math.PI / 2 + (index / points.length) * Math.PI * 2;
    return { ...item, x: cx + Math.cos(angle) * (radius + 28), y: cy + Math.sin(angle) * (radius + 18) };
  });
  return (
    <svg viewBox="0 0 280 280" className="w-full max-w-md mx-auto">
      {[0.35, 0.7, 1].map((scale) => (
        <polygon
          key={scale}
          fill="none"
          stroke="#e2e8f0"
          points={points
            .map((_, index) => {
              const angle = -Math.PI / 2 + (index / points.length) * Math.PI * 2;
              return `${cx + Math.cos(angle) * radius * scale},${cy + Math.sin(angle) * radius * scale}`;
            })
            .join(" ")}
        />
      ))}
      <polygon fill="rgba(2,132,199,0.18)" stroke="#0369a1" points={coords.map((pair) => pair.join(",")).join(" ")} />
      {labels.map((label) => (
        <text key={label.skill} x={label.x} y={label.y} textAnchor="middle" className="fill-slate-600" fontSize="9">
          {label.skill.split(" ")[0]} {label.growth_yoy}%
        </text>
      ))}
    </svg>
  );
}

export const SkillMapIntelligence: React.FC<SkillMapIntelligenceProps> = ({
  selectedDistrictName,
  onSelectDistrictName,
  onAskAiAboutDistrict
}) => {
  const [tab, setTab] = useState("gap");
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ state: "All States", district: selectedDistrictName || "All Districts", sector: "All Sectors", role: "All Roles", skill: "All Skills" });

  useEffect(() => {
    if (selectedDistrictName && selectedDistrictName !== filters.district) {
      setFilters((prev) => ({ ...prev, district: selectedDistrictName }));
    }
  }, [selectedDistrictName]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getSkillIntelligence(filters)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "SkillMap data could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters.district, filters.sector, filters.role, filters.skill]);

  const options = data?.filters || { districts: ["All Districts", "Muzaffarpur", "Patna", "Gaya", "Lucknow", "Varanasi", "Prayagraj", "Pune", "Nashik", "Nagpur"], sectors: ["All Sectors"], roles: ["All Roles"], skills: ["All Skills"] };
  const summary = data?.summary;
  const maxDemand = Math.max(...(data?.demand?.by_skill || []).map((row: any) => row.demand || 0), 1);
  const maxSupply = Math.max(...(data?.supply?.skill_distribution || []).map((row: any) => row.supply || 0), 1);

  return (
    <div className="space-y-4">
      <div className="gov-card p-5 bg-white border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-black text-slate-900">SkillMap Intelligence</h2>
            <p className="mt-1 text-xs text-slate-500 max-w-3xl leading-relaxed">
              Supply, employer demand, gaps, wages, and mobility for the Maharashtra prototype. Gap labels are calculated from catalogue supply and demand. {data?.notice}
            </p>
          </div>
          {onAskAiAboutDistrict && (
            <button
              onClick={() => onAskAiAboutDistrict(filters.district === "All Districts" ? "Bihar, Uttar Pradesh, and Maharashtra" : filters.district)}
              className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-800"
            >
              <SkillPulseMark className="h-3.5 w-3.5" />
              Ask about this view
            </button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-2">
          {[
            ["state", "State", ["All States", ...STATES]],
            ["district", "District", stateChosen(filters.state) ? ["All Districts", ...districtsFor(filters.state)] : ["Select State First"]],
            ["sector", "Sector", options.sectors],
            ["role", "Job role", options.roles],
            ["skill", "Skill", options.skills]
          ].map(([key, label, list]) => (
            <label key={String(key)} className="text-[11px] font-bold text-slate-600">
              {label as string}
              <select
                disabled={key === "district" && !stateChosen(filters.state)}
                value={key === "district" && !stateChosen(filters.state) ? "Select State First" : (filters as any)[key as string]}
                onChange={(event) => {
                  const value = event.target.value;
                  if (key === "state") {
                    const keep = stateChosen(value) && districtsFor(value).includes(filters.district);
                    setFilters((prev) => ({ ...prev, state: value, district: keep ? prev.district : "All Districts" }));
                    return;
                  }
                  setFilters((prev) => ({ ...prev, [key as string]: value }));
                  if (key === "district" && value !== "All Districts" && value !== "Select State First") onSelectDistrictName(value);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-800"
              >
                {(list as string[]).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${tab === item.id ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}
      {loading && <div className="gov-card p-6 text-xs text-slate-500">Loading SkillMap calculations…</div>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ["Catalogue supply", summary.catalogue_supply?.toLocaleString?.() || summary.catalogue_supply],
              ["Catalogue demand", summary.catalogue_demand?.toLocaleString?.() || summary.catalogue_demand],
              ["Net gap", summary.net_gap?.toLocaleString?.() || summary.net_gap],
              ["Tracked certified", summary.tracked_certified]
            ].map(([label, value]) => (
              <div key={String(label)} className="gov-card p-3 bg-white border border-slate-200">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
                <div className="mt-1 text-lg font-black text-slate-900">{value}</div>
              </div>
            ))}
          </div>

          {tab === "supply" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <section className="gov-card p-4 bg-white border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Catalogue skill supply</h3>
                <p className="text-[11px] text-slate-500">These bars use the prototype labour catalogue. The tracked cohort is counted separately from trainee records.</p>
                {data.supply.skill_distribution.map((row: any) => (
                  <div key={`${row.district}-${row.skill}`}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className="font-semibold text-slate-800">{row.skill}</span>
                      <span className="text-slate-500">{row.district}: {row.supply?.toLocaleString?.()}</span>
                    </div>
                    <Bar value={row.supply || 0} max={maxSupply} tone="bg-emerald-600" />
                  </div>
                ))}
              </section>
              <section className="gov-card p-4 bg-white border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-3">District supply and tracked cohort</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase text-slate-400">
                        <th className="py-2 pr-2">District</th>
                        <th className="py-2 pr-2">Catalogue supply</th>
                        <th className="py-2 pr-2">Tracked trained</th>
                        <th className="py-2">Certified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.supply.by_district.map((row: any) => (
                        <tr key={row.district} className="border-t border-slate-100">
                          <td className="py-2 font-bold text-slate-900">{row.district}</td>
                          <td className="py-2">{row.catalogue_supply?.toLocaleString?.() ?? "Data unavailable"}</td>
                          <td className="py-2">{row.tracked_trained}</td>
                          <td className="py-2">{row.tracked_certified}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {tab === "demand" && (
            <section className="gov-card p-4 bg-white border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Employer demand by skill</h3>
              <p className="text-[11px] text-slate-500">Demand values come from the prototype catalogue. Occupations such as Solar Technician or Digital Marketing are not in this dataset, so they are not shown.</p>
              {data.demand.by_skill.map((row: any) => (
                <div key={`${row.district}-${row.skill}`}>
                  <div className="mb-1 flex flex-wrap justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-800">{row.occupation} · {row.skill}</span>
                    <span className="text-slate-500">{row.district}: {row.demand?.toLocaleString?.()} openings · {row.trend}</span>
                  </div>
                  <Bar value={row.demand || 0} max={maxDemand} tone="bg-indigo-700" />
                </div>
              ))}
            </section>
          )}

          {tab === "gap" && (
            <section className="gov-card p-4 bg-white border border-slate-200 overflow-x-auto">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Supply versus demand</h3>
              <p className="text-[11px] text-slate-500 mb-3">High Gap is a shortage of at least 35% of demand. Moderate Gap is 15–35%. Low Gap is under 15%. Potential Oversupply means supply exceeds demand.</p>
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400">
                    <th className="py-2">Skill</th>
                    <th className="py-2">District</th>
                    <th className="py-2">Supply</th>
                    <th className="py-2">Demand</th>
                    <th className="py-2">Gap</th>
                    <th className="py-2">Label</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gaps.map((row: any) => (
                    <tr key={`${row.district}-${row.skill}`} className="border-t border-slate-100">
                      <td className="py-2 font-semibold text-slate-900">{row.skill}</td>
                      <td className="py-2">{row.district}</td>
                      <td className="py-2">{row.supply?.toLocaleString?.() ?? "Data unavailable"}</td>
                      <td className="py-2">{row.demand?.toLocaleString?.() ?? "Data unavailable"}</td>
                      <td className="py-2">{row.gap?.toLocaleString?.() ?? "Data unavailable"}</td>
                      <td className="py-2">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${GAP_STYLE[row.gap_label] || GAP_STYLE["Data unavailable"]}`}>{row.gap_label}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {tab === "future" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <section className="gov-card p-4 bg-white border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Growth radar</h3>
                <Radar items={data.future.items} />
              </section>
              <section className="gov-card p-4 bg-white border border-slate-200 space-y-3 text-xs">
                <h3 className="text-sm font-bold text-slate-900">Training priorities from the same rows</h3>
                {["emerging", "growing", "declining"].map((key) => (
                  <div key={key}>
                    <div className="font-bold uppercase tracking-wide text-[10px] text-slate-400 mb-1">{key}</div>
                    {(data.future[key] || []).length === 0 && <p className="text-slate-500">None in the current filter.</p>}
                    {(data.future[key] || []).map((item: any) => (
                      <p key={item.skill} className="text-slate-700">{item.occupation}: {item.growth_yoy === null ? "growth rate unavailable" : `${item.growth_yoy}% year on year`}</p>
                    ))}
                  </div>
                ))}
              </section>
            </div>
          )}

          {tab === "wage" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <section className="gov-card p-4 bg-white border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Catalogue and cohort wages (₹ / month)</h3>
                <p className="text-[11px] text-slate-500 mb-3">Prototype figures only. A wage range is shown when the tracked cohort has recorded wages.</p>
                <div className="space-y-2 text-xs">
                  {data.wages.by_district.map((row: any) => (
                    <div key={row.district} className="flex justify-between border-b border-slate-100 py-1.5">
                      <span className="font-semibold">{row.district} district average</span>
                      <span>₹{row.avg_wage.toLocaleString()}</span>
                    </div>
                  ))}
                  {data.wages.progression.map((row: any) => (
                    <div key={row.milestone} className="flex justify-between border-b border-slate-100 py-1.5">
                      <span>{row.milestone}</span>
                      <span>₹{row.wage.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </section>
              <section className="gov-card p-4 bg-white border border-slate-200 overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-900 mb-2">Recorded cohort wage range by skill</h3>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase text-slate-400">
                      <th className="py-2">Skill</th>
                      <th className="py-2">Average</th>
                      <th className="py-2">Range</th>
                      <th className="py-2">Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.wages.cohort.map((row: any) => (
                      <tr key={row.skill} className="border-t border-slate-100">
                        <td className="py-2 font-semibold">{row.skill}</td>
                        <td className="py-2">₹{row.wage_avg.toLocaleString()}</td>
                        <td className="py-2">₹{row.wage_min.toLocaleString()} – ₹{row.wage_max.toLocaleString()}</td>
                        <td className="py-2">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          )}

          {tab === "mobility" && (
            <section className="gov-card p-4 bg-white border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Current location → skill → opportunity → destination</h3>
              <p className="text-[11px] text-slate-500">Destinations are other Maharashtra districts in this prototype where unmet demand is higher. This is not advice that someone must move.</p>
              {data.mobility.map((row: any, index: number) => (
                <div key={`${row.origin}-${row.skill}-${index}`} className="rounded-xl border border-slate-200 p-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2 font-bold text-slate-900">
                    <span>{row.origin}</span>
                    <span className="text-slate-300">→</span>
                    <span>{row.skill}</span>
                    <span className="text-slate-300">→</span>
                    <span>{row.opportunity}</span>
                    <span className="text-slate-300">→</span>
                    <span>{row.destination || "Data unavailable"}</span>
                  </div>
                  <p className="mt-1 text-slate-600 leading-relaxed">{row.note}</p>
                </div>
              ))}
            </section>
          )}

          {tab === "training" && (
            <section className="gov-card p-4 bg-white border border-slate-200 overflow-x-auto">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Recommendations from the gap calculation</h3>
              <p className="text-[11px] text-slate-500 mb-3">Priority Training is used when demand exceeds supply by the High or Moderate threshold. Lower Current Demand / Consider Reskilling is used when supply exceeds demand.</p>
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase text-slate-400">
                    <th className="py-2">Skill</th>
                    <th className="py-2">District</th>
                    <th className="py-2">Supply</th>
                    <th className="py-2">Demand</th>
                    <th className="py-2">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {data.training.map((row: any) => (
                    <tr key={`${row.district}-${row.skill}`} className="border-t border-slate-100">
                      <td className="py-2 font-semibold">{row.skill}</td>
                      <td className="py-2">{row.district}</td>
                      <td className="py-2">{row.supply ?? "Data unavailable"}</td>
                      <td className="py-2">{row.demand ?? "Data unavailable"}</td>
                      <td className="py-2 font-bold text-slate-800">{row.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </>
      )}
    </div>
  );
};
