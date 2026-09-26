"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StateDistrictFields } from "@/components/geo/StateDistrictFields";

const EMPTY = {
  name: "",
  industry: "Renewable Energy",
  contact_person: "",
  email: "",
  phone: "",
  state: "Bihar",
  district: "Patna",
  address: "",
  organisation_type: "Private",
  required_skills: "Solar Installation",
  workforce_requirement: "4",
  verification_status: "Pending Verification"
};

export const EmployersPanel: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = () => {
    api.getEmployers().then((res) => {
      setItems(res.items || []);
      setNotice(res.notice || "");
    }).catch(() => setItems([]));
  };

  useEffect(() => { load(); }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const created = await api.createEmployer({
        ...form,
        required_skills: form.required_skills.split(",").map((item) => item.trim()).filter(Boolean),
        workforce_requirement: Number(form.workforce_requirement || 1)
      });
      setItems((prev) => [created, ...prev]);
      setOpen(false);
      setForm(EMPTY);
    } catch (err: any) {
      setError(err?.message || "The employer could not be saved.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="gov-card bg-white p-5 border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Hiring Desk</h2>
            <p className="text-xs text-slate-500">{notice || "Hiring Desk requisitions and industry partners across Bihar, Uttar Pradesh, and Maharashtra."}</p>
          </div>
          <button onClick={() => setOpen(true)} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white">+ Add Hiring Partner</button>
        </div>
      </div>
      {items.length === 0 && <p className="text-xs text-slate-500">No matching records found.</p>}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {items.slice(0, 40).map((item) => (
          <article key={item.id} className="gov-card bg-white p-4 border border-slate-200 text-xs">
            <h3 className="font-black text-slate-900">{item.name}</h3>
            <p className="text-slate-500">{item.industry} · {item.organisation_type}</p>
            <p className="mt-1">{item.district}, {item.state}</p>
            <p>Jobs: {item.active_jobs} · Matched talent: {item.matched_talent} · Hires: {item.hires}</p>
            <p>Skills: {(item.required_skills || []).join(", ")}</p>
            <p>Verification: {item.verification_status}</p>
            <p className="text-slate-500">{item.outcomes}</p>
          </article>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/40 p-3 sm:items-center" onClick={() => setOpen(false)}>
          <form onSubmit={submit} onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 text-xs space-y-2">
            <div className="flex items-center justify-between"><h3 className="text-sm font-black">Add Hiring Partner</h3><button type="button" onClick={() => setOpen(false)}>✕ Close</button></div>
            <input required placeholder="Organisation name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" />
            <input placeholder="Industry / sector" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" />
            <input placeholder="Contact person" value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" />
            <input placeholder="Business email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" />
            <StateDistrictFields state={form.state} district={form.district} onChange={(state, district) => setForm({ ...form, state, district })} />
            <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" />
            <input placeholder="Organisation type" value={form.organisation_type} onChange={(e) => setForm({ ...form, organisation_type: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" />
            <input placeholder="Required skills, comma separated" value={form.required_skills} onChange={(e) => setForm({ ...form, required_skills: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" />
            <input placeholder="Workforce requirement" value={form.workforce_requirement} onChange={(e) => setForm({ ...form, workforce_requirement: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" />
            <input placeholder="Verification information" value={form.verification_status} onChange={(e) => setForm({ ...form, verification_status: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" />
            {error && <p className="text-rose-700">{error}</p>}
            <button className="rounded-lg bg-slate-900 px-3 py-2 font-bold text-white">Save organization</button>
          </form>
        </div>
      )}
    </div>
  );
};
