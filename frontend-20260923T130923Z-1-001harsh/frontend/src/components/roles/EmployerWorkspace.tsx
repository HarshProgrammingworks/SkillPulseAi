"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StateDistrictFields } from "@/components/geo/StateDistrictFields";
import { ALL_DISTRICTS } from "@/data/geography";

interface EmployerWorkspaceProps {
  tab: string;
  onCompare: (leftId: string, rightId: string) => void;
}

export const EmployerWorkspace: React.FC<EmployerWorkspaceProps> = ({ tab, onCompare }) => {
  const [form, setForm] = useState({
    job_role: "EV Technician",
    required_skills: "EV Diagnostics",
    min_experience_years: "0",
    education: "",
    location: "Pune",
    preferred_certification: "Certified",
    salary_min: "18000",
    salary_max: "30000"
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState<any>(null);
  const [overview, setOverview] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stage, setStage] = useState("All");
  const [applications, setApplications] = useState<any[]>([]);
  const [description, setDescription] = useState("Solar technician who can install panels, follow electrical safety, and troubleshoot inverters.");
  const [extracted, setExtracted] = useState<string[]>([]);
  const [extractNote, setExtractNote] = useState("");
  const [demand, setDemand] = useState({ title: "Solar Technician", district: "Patna", state: "Bihar", sector: "Renewable Energy", openings: "4" });
  const [outcome, setOutcome] = useState({ trainee_id: "", checkpoint: "3M", still_employed: "Yes", role_relevant: "High", skill_utilisation: "Active", feedback: "" });

  useEffect(() => {
    api.employerOverview().then(setOverview).catch(() => setOverview(null));
    api.listJobs().then((data) => setJobs(data.items || [])).catch(() => setJobs([]));
    api.listApplications(stage === "All" || stage === "Matched" ? undefined : stage).then((data) => setApplications(data.items || [])).catch(() => setApplications([]));
  }, [stage]);

  const search = async (event?: React.FormEvent) => {
    event?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.matchCandidates({
        job_role: form.job_role,
        required_skills: form.required_skills.split(",").map((item) => item.trim()).filter(Boolean),
        min_experience_years: Number(form.min_experience_years || 0),
        education: form.education,
        location: form.location,
        preferred_certification: form.preferred_certification,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null
      });
      setResult(data);
      setSelected([]);
    } catch (err: any) {
      setError(err?.message || "Candidate search failed.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-4">
      {tab === "overview" && overview && (
        <section className="space-y-3">
          <p className="text-xs text-slate-500">{overview.notice}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["Openings", overview.openings],
              ["Matched", overview.matched],
              ["Shortlisted", overview.shortlisted],
              ["Interviews", overview.interviews],
              ["Hires", overview.hires],
              ["Retained", overview.retained]
            ].map(([label, value]) => (
              <div key={String(label)} className="gov-card bg-white p-3 border border-slate-200"><p className="text-[10px] uppercase font-bold text-slate-400">{label}</p><p className="text-xl font-black">{value}</p></div>
            ))}
          </div>
        </section>
      )}

      {tab === "demand" && (
        <section className="gov-card bg-white p-4 border border-slate-200 space-y-3 text-xs">
          <h2 className="text-sm font-black text-slate-900">Post a skill demand</h2>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg border p-2" rows={4} />
          <button type="button" onClick={async () => { const data = await api.extractSkills(description); setExtracted(data.skills || []); setExtractNote(data.source || ""); }} className="rounded-lg border px-3 py-1.5 font-bold">Extract skills</button>
          {extractNote && <p className="text-slate-500">{extractNote}</p>}
          <p className="font-bold">{extracted.join(", ") || "No skills extracted yet."}</p>
          <input value={demand.title} onChange={(e) => setDemand({ ...demand, title: e.target.value })} className="w-full rounded-lg border px-2 py-1.5" placeholder="Job title" />
          <StateDistrictFields state={demand.state} district={demand.district} onChange={(state, district) => setDemand({ ...demand, state, district })} />
          <button type="button" onClick={async () => { const job = await api.createJob({ ...demand, description, required_skills: extracted, openings: Number(demand.openings) }); setJobs([job, ...jobs]); }} className="rounded-lg bg-slate-900 px-3 py-2 font-bold text-white">Publish demand</button>
        </section>
      )}

      {tab === "intelligence" && (
        <section className="gov-card bg-white p-4 border border-slate-200 text-xs space-y-2">
          <h2 className="text-sm font-black">Workforce and skill intelligence</h2>
          <p className="text-slate-500">Counts are synthetic demo openings in the prototype across the 9 supported districts in Bihar, Uttar Pradesh, and Maharashtra.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
            {ALL_DISTRICTS.map((district) => {
              const count = jobs.filter((job) => job.district === district).length;
              const level = count >= 6 ? "High" : count >= 3 ? "Medium" : "Low";
              return (
                <div key={district} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
                  <span className="font-semibold text-slate-800">{district}</span>
                  <span className="font-bold text-sky-800">{level} · {count} openings</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "pipeline" && (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {(overview?.pipeline || []).map((item: any) => (
              <button key={item.stage} onClick={() => setStage(item.stage)} className={`rounded-xl border px-3 py-2 text-xs font-bold ${stage === item.stage ? "border-sky-700 bg-sky-50" : "border-slate-200"}`}>
                {item.stage}<div className="text-lg">{item.count}</div>
              </button>
            ))}
          </div>
          {applications.length === 0 && <p className="text-xs text-slate-500">No matching records found. Try changing your filters.</p>}
          {applications.map((item) => (
            <div key={item.id} className="gov-card bg-white p-3 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
              <div><strong>{item.skillpulse_id || item.name}</strong> · {item.job_title} · {item.status}</div>
              <select value={item.status} onChange={async (event) => { await api.moveApplication(item.id, event.target.value); setStage(stage); }} className="rounded border px-2 py-1">
                {["Applied", "Shortlisted", "Interview", "Selected", "Joined", "Retained"].map((value) => <option key={value}>{value}</option>)}
              </select>
            </div>
          ))}
        </section>
      )}

      {tab === "outcomes" && (
        <form className="gov-card bg-white p-4 border border-slate-200 space-y-2 text-xs" onSubmit={async (event) => { event.preventDefault(); await api.recordOutcome({ ...outcome, joined: true }); setOutcome({ ...outcome, feedback: "Saved" }); }}>
          <h2 className="text-sm font-black">Post-hiring outcome</h2>
          <input placeholder="Trainee ID" value={outcome.trainee_id} onChange={(e) => setOutcome({ ...outcome, trainee_id: e.target.value })} className="w-full rounded border px-2 py-1.5" />
          <select value={outcome.checkpoint} onChange={(e) => setOutcome({ ...outcome, checkpoint: e.target.value })} className="rounded border px-2 py-1.5">{["3M", "6M", "9M", "12M"].map((item) => <option key={item}>{item}</option>)}</select>
          <input placeholder="Still employed" value={outcome.still_employed} onChange={(e) => setOutcome({ ...outcome, still_employed: e.target.value })} className="w-full rounded border px-2 py-1.5" />
          <input placeholder="Role relevance" value={outcome.role_relevant} onChange={(e) => setOutcome({ ...outcome, role_relevant: e.target.value })} className="w-full rounded border px-2 py-1.5" />
          <input placeholder="Skill utilisation" value={outcome.skill_utilisation} onChange={(e) => setOutcome({ ...outcome, skill_utilisation: e.target.value })} className="w-full rounded border px-2 py-1.5" />
          <textarea placeholder="Employer feedback" value={outcome.feedback} onChange={(e) => setOutcome({ ...outcome, feedback: e.target.value })} className="w-full rounded border px-2 py-1.5" />
          <button className="rounded-lg bg-slate-900 px-3 py-2 font-bold text-white">Save verified signal</button>
        </form>
      )}

      {(tab === "matches" || tab === "matching") && (
      <>
      <form onSubmit={search} className="gov-card bg-white p-5 border border-slate-200 space-y-3">
        <h2 className="text-lg font-black text-slate-900">Candidate requirements</h2>
        <p className="text-xs text-slate-500">Phone, email, and verification notes stay hidden. Match percentages use equal weights for skills, education, experience, certification, and location.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-[11px] font-bold text-slate-600">
          {([
            ["job_role", "Job role"],
            ["required_skills", "Required skills"],
            ["min_experience_years", "Minimum experience (years)"],
            ["education", "Education"],
            ["location", "Location"],
            ["preferred_certification", "Preferred certification"],
            ["salary_min", "Salary minimum (₹)"],
            ["salary_max", "Salary maximum (₹)"]
          ] as const).map(([key, label]) => (
            <label key={key}>
              {label}
              <input value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium" />
            </label>
          ))}
        </div>
        <button className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white" disabled={loading}>{loading ? "Searching…" : "Search candidates"}</button>
        {error && <p className="text-xs text-rose-700">{error}</p>}
      </form>

      {result && (
        <section className="gov-card bg-white p-4 border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500 max-w-3xl">{result.scoring} {result.notice}</p>
            <button
              disabled={selected.length !== 2}
              onClick={() => onCompare(selected[0], selected[1])}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold disabled:opacity-40"
            >
              Compare selected
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-slate-400">
                  <th className="py-2"></th>
                  <th className="py-2">Candidate</th>
                  <th className="py-2">Match</th>
                  <th className="py-2">Skills</th>
                  <th className="py-2">Education</th>
                  <th className="py-2">Experience</th>
                  <th className="py-2">Certification</th>
                  <th className="py-2">Location</th>
                </tr>
              </thead>
              <tbody>
                {result.candidates.map((candidate: any) => (
                  <tr key={candidate.trainee_id} className="border-t border-slate-100">
                    <td className="py-2"><input type="checkbox" checked={selected.includes(candidate.trainee_id)} onChange={() => toggle(candidate.trainee_id)} aria-label={`Select ${candidate.name}`} /></td>
                    <td className="py-2">
                      <button className="font-bold text-sky-900" onClick={() => setOpen(candidate)}>{candidate.name}</button>
                      <div className="text-[11px] text-slate-500">{candidate.profile.district} · {candidate.profile.job_role || "Role not recorded"}</div>
                    </td>
                    <td className="py-2 font-black">{candidate.match_pct}%</td>
                    <td className="py-2">{candidate.breakdown.skills}%</td>
                    <td className="py-2">{candidate.breakdown.education}%</td>
                    <td className="py-2">{candidate.breakdown.experience}%</td>
                    <td className="py-2">{candidate.breakdown.certification}%</td>
                    <td className="py-2">{candidate.breakdown.location}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {open && (
        <div className="fixed inset-0 z-[70] flex justify-end bg-slate-950/40">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-2xl">
            <button onClick={() => setOpen(null)} className="text-xs font-bold text-slate-500">Close</button>
            <h3 className="mt-2 text-lg font-black text-slate-900">{open.name}</h3>
            <p className="text-sm font-bold text-sky-800">AI compatibility {open.match_pct}% · assisted matching signal, not a hiring prediction</p>
            <ul className="mt-3 space-y-1 text-xs text-slate-700">
              {open.why.map((line: string) => <li key={line}>{line}</li>)}
            </ul>
            <div className="mt-4 space-y-1 text-xs">
              <p><strong>Skills:</strong> {(open.profile.skills_acquired || []).join(", ") || "Data unavailable"}</p>
              <p><strong>Education:</strong> {open.profile.education}</p>
              <p><strong>Certification:</strong> {open.profile.certification_status}</p>
              <p><strong>Experience:</strong> {open.profile.experience_years} years</p>
              <p><strong>Preferred role:</strong> {open.profile.preferred_role || "Not recorded"}</p>
              <p><strong>Location:</strong> {open.profile.district}</p>
              <p><strong>Wage:</strong> {open.profile.current_wage ? `₹${open.profile.current_wage.toLocaleString()}/month` : "Data unavailable"}</p>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
