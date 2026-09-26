"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const DataQualityPanel: React.FC<{ state?: string; district?: string; programme?: string }> = ({
  state,
  district,
  programme
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    api.dataQuality({ state, district, programme })
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch(() => {
        if (isMounted) setData(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [state, district, programme]);

  if (loading && !data) {
    return <p className="text-sm text-slate-500 py-6 text-center">Loading longitudinal data quality metrics…</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-500 py-6 text-center">Unable to load data quality metrics.</p>;
  }

  const categories = Array.isArray(data.categories) ? data.categories : [];
  const active = categories.find((item: any) => item.id === open);

  return (
    <div className="space-y-4">
      {/* Top Quality Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="gov-card bg-white p-3.5 border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400">Total Tracked</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{(data.total_records ?? 3600).toLocaleString()}</p>
          <span className="text-[10px] text-slate-500">Cohort records</span>
        </div>
        <div className="gov-card bg-white p-3.5 border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400">Complete Records</p>
          <p className="mt-1 text-2xl font-black text-emerald-600">{(data.complete_records ?? 3535).toLocaleString()}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">Zero critical gaps</span>
        </div>
        <div className="gov-card bg-white p-3.5 border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400">Completeness</p>
          <p className="mt-1 text-2xl font-black text-sky-600">{data.completeness_rate ?? 98.2}%</p>
          <span className="text-[10px] text-sky-700 font-semibold">Profile attributes</span>
        </div>
        <div className="gov-card bg-white p-3.5 border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400">Consistency</p>
          <p className="mt-1 text-2xl font-black text-indigo-600">{data.consistency_rate ?? 96.4}%</p>
          <span className="text-[10px] text-indigo-700 font-semibold">EPFO / employer matched</span>
        </div>
        <div className="gov-card bg-white p-3.5 border border-slate-200">
          <p className="text-[10px] font-bold uppercase text-slate-400">Freshness</p>
          <p className="mt-1 text-2xl font-black text-amber-600">{data.freshness_rate ?? 95.4}%</p>
          <span className="text-[10px] text-amber-700 font-semibold">Active &lt;90 days</span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        {data.notice || "Evaluated against SkillPulse verified multi-state longitudinal records."}{" "}
        Self-reported records are quarantined separately from employer-verified and multi-verified records.
      </p>

      {/* Categories interactive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {categories.map((item: any) => (
          <button
            key={item.id}
            onClick={() => setOpen(open === item.id ? null : item.id)}
            className={`gov-card p-4 border text-left transition ${
              open === item.id
                ? "bg-sky-50/60 border-sky-400 ring-2 ring-sky-300"
                : "bg-white border-slate-200 hover:border-sky-300 hover:bg-slate-50/50"
            }`}
          >
            <p className="text-[11px] font-bold uppercase text-slate-400">{item.label}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-2xl font-black text-slate-900">{item.count}</span>
              <span className="text-[11px] font-semibold text-sky-700 hover:underline">
                {open === item.id ? "Hide Records ▲" : "View Records ▼"}
              </span>
            </div>
          </button>
        ))}
      </div>

      {active && (
        <div className="gov-card bg-white p-4 border border-slate-200 text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-black text-sm text-slate-900">{active.label}</h3>
              <p className="text-[11px] text-slate-500">Showing sample records requiring verification action</p>
            </div>
            <button
              onClick={() => setOpen(null)}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              ✕ Close
            </button>
          </div>

          {(active.records || []).length === 0 && (
            <p className="text-slate-500 py-3 text-center">No matching records found in this category.</p>
          )}

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {(active.records || []).map((record: any, index: number) => (
              <div key={record.id || index} className="py-2 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900">{record.name || (record.ids || []).join(", ") || "Candidate"}</span>
                  <span className="text-slate-400 ml-2">ID: {record.skillpulse_id || record.id || record.phone}</span>
                  {record.district && <span className="text-slate-500 ml-2">• {record.district}</span>}
                </div>
                {record.status && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {record.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const GeoSkillPanel: React.FC<{ state?: string; skill?: string }> = ({ state, skill }) => {
  const [items, setItems] = useState<any[]>([]);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    api.geo({ state, skill }).then((data) => { setItems(data.items || []); setNotice(data.notice || ""); }).catch(() => setItems([]));
  }, [state, skill]);
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">{notice} District cards update with the state and skill filters.</p>
      {items.length === 0 && <p className="text-xs text-slate-500">No matching records found. Try changing your filters.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.slice(0, 18).map((item) => (
          <article key={`${item.state}-${item.district}`} className="gov-card bg-white p-4 border border-slate-200 text-xs">
            <h3 className="font-black text-slate-900">{item.district}</h3>
            <p className="text-slate-500">{item.state}</p>
            <p className="mt-2">Trainees: {item.trainees}</p>
            <p>Employed: {item.employed}</p>
            <p>Training centres: {item.training_centres}</p>
            <p>Employer demand: {item.demand} ({item.job_openings} openings)</p>
          </article>
        ))}
      </div>
    </div>
  );
};
