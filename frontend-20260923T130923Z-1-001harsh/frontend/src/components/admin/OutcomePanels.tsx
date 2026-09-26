"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";

export const DataQualityPanel: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => { api.dataQuality().then(setData).catch(() => setData(null)); }, []);
  if (!data) return <p className="text-sm text-slate-500">Loading data quality…</p>;
  const active = data.categories.find((item: any) => item.id === open);
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">{data.notice} Self-reported records are listed separately from employer-verified and multi-verified records.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {data.categories.map((item: any) => (
          <button key={item.id} onClick={() => setOpen(item.id)} className="gov-card bg-white p-4 border border-slate-200 text-left">
            <p className="text-[11px] font-bold uppercase text-slate-400">{item.label}</p>
            <p className="mt-1 text-2xl font-black text-slate-900">{item.count}</p>
          </button>
        ))}
      </div>
      {active && (
        <div className="gov-card bg-white p-4 border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between"><h3 className="font-black">{active.label}</h3><button onClick={() => setOpen(null)}>✕ Close</button></div>
          {(active.records || []).length === 0 && <p>No matching records found. Try changing your filters.</p>}
          {(active.records || []).map((record: any, index: number) => (
            <p key={record.id || index}>{record.skillpulse_id || record.phone} · {record.name || (record.ids || []).join(", ")} · {record.district || ""} · {record.status || ""}</p>
          ))}
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
