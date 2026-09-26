"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { StateDistrictFields } from "@/components/geo/StateDistrictFields";
import { ALL_DISTRICTS } from "@/data/geography";
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  UserCheck,
  Briefcase,
  Building,
  Check,
  ChevronRight,
  TrendingUp,
  FileCheck
} from "lucide-react";

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
  const [pipelineSearch, setPipelineSearch] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [description, setDescription] = useState("Solar technician who can install panels, follow electrical safety, and troubleshoot inverters.");
  const [extracted, setExtracted] = useState<string[]>([]);
  const [extractNote, setExtractNote] = useState("");
  const [demand, setDemand] = useState({ title: "Solar Technician", district: "Patna", state: "Bihar", sector: "Renewable Energy", openings: "4" });
  
  // Placed Candidates Outcomes Ledger
  const [placedCandidates, setPlacedCandidates] = useState<any[]>([
    {
      id: "PLC-001",
      trainee_id: "SP-BR-10001",
      name: "Aarav Kumar",
      role: "Solar PV Technician",
      employer: "GreenTech Solar Bihar",
      district: "Patna",
      state: "Bihar",
      joined_date: "2024-03-01",
      checkpoint: "6M",
      still_employed: "Yes",
      role_relevance: "Highly Relevant",
      wage: 21500,
      verified_by_employer: true
    },
    {
      id: "PLC-002",
      trainee_id: "SP-UP-10002",
      name: "Pooja Singh",
      role: "CNC Machine Operator",
      employer: "Precision Auto Varanasi",
      district: "Varanasi",
      state: "Uttar Pradesh",
      joined_date: "2024-04-15",
      checkpoint: "3M",
      still_employed: "Yes",
      role_relevance: "Highly Relevant",
      wage: 22800,
      verified_by_employer: true
    },
    {
      id: "PLC-003",
      trainee_id: "SP-MH-10003",
      name: "Rohan Patil",
      role: "Battery Diagnostics Lead",
      employer: "Tata AutoComp Pune",
      district: "Pune",
      state: "Maharashtra",
      joined_date: "2023-11-10",
      checkpoint: "12M",
      still_employed: "Yes",
      role_relevance: "Highly Relevant",
      wage: 26500,
      verified_by_employer: true
    },
    {
      id: "PLC-004",
      trainee_id: "SP-BR-10004",
      name: "Sunita Kumari",
      role: "Telecom Fiber Splicer",
      employer: "Jio Infocomm Gaya",
      district: "Gaya",
      state: "Bihar",
      joined_date: "2024-05-01",
      checkpoint: "3M",
      still_employed: "Yes",
      role_relevance: "Relevant",
      wage: 19500,
      verified_by_employer: false
    },
    {
      id: "PLC-005",
      trainee_id: "SP-UP-10005",
      name: "Vikram Yadav",
      role: "Industrial Electrician",
      employer: "Lucknow Metro Rail Corp",
      district: "Lucknow",
      state: "Uttar Pradesh",
      joined_date: "2024-01-20",
      checkpoint: "6M",
      still_employed: "Yes",
      role_relevance: "Highly Relevant",
      wage: 24000,
      verified_by_employer: true
    },
    {
      id: "PLC-006",
      trainee_id: "SP-MH-10006",
      name: "Ananya Deshmukh",
      role: "Data Automation Analyst",
      employer: "FinTech Hub Nagpur",
      district: "Nagpur",
      state: "Maharashtra",
      joined_date: "2024-02-15",
      checkpoint: "6M",
      still_employed: "Yes",
      role_relevance: "Relevant",
      wage: 23200,
      verified_by_employer: true
    }
  ]);

  const [outcome, setOutcome] = useState({
    trainee_id: "",
    checkpoint: "3M",
    still_employed: "Yes",
    role_relevant: "Highly Relevant",
    skill_utilisation: "Active",
    wage: "22000",
    feedback: ""
  });
  const [outcomeStatusMessage, setOutcomeStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    api.employerOverview().then(setOverview).catch(() => setOverview(null));
    api.listJobs().then((data) => setJobs(data.items || [])).catch(() => setJobs([]));
    api.listApplications(stage === "All" || stage === "Matched" ? undefined : stage).then((data) => setApplications(data.items || [])).catch(() => setApplications([]));
  }, [stage]);

  const handleMoveStage = async (id: string, newStage: string) => {
    try {
      await api.moveApplication(id, newStage);
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStage } : app))
      );
      api.employerOverview().then(setOverview).catch(() => {});
    } catch (e) {
      console.error("Failed to move application stage", e);
    }
  };

  const handleQuickVerify = async (candidateId: string) => {
    const candidate = placedCandidates.find((c) => c.id === candidateId);
    if (!candidate) return;
    try {
      await api.recordOutcome({
        trainee_id: candidate.trainee_id,
        checkpoint: candidate.checkpoint,
        still_employed: candidate.still_employed,
        role_relevant: candidate.role_relevance,
        skill_utilisation: "Active",
        feedback: "Confirmed still actively employed by employer desk.",
        joined: true
      });
      setPlacedCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, verified_by_employer: true } : c))
      );
      setOutcomeStatusMessage(`Successfully verified retention for ${candidate.name} (${candidate.checkpoint}).`);
      setTimeout(() => setOutcomeStatusMessage(null), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordOutcomeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!outcome.trainee_id.trim()) return;
    try {
      await api.recordOutcome({
        trainee_id: outcome.trainee_id,
        checkpoint: outcome.checkpoint,
        still_employed: outcome.still_employed,
        role_relevant: outcome.role_relevant,
        skill_utilisation: outcome.skill_utilisation,
        feedback: outcome.feedback,
        wage_band: outcome.wage ? `₹${Number(outcome.wage).toLocaleString()}/month` : undefined,
        joined: true
      });

      // Add or update to local placedCandidates ledger
      const existing = placedCandidates.find((c) => c.trainee_id.toLowerCase() === outcome.trainee_id.toLowerCase());
      if (existing) {
        setPlacedCandidates((prev) =>
          prev.map((c) =>
            c.trainee_id.toLowerCase() === outcome.trainee_id.toLowerCase()
              ? {
                  ...c,
                  checkpoint: outcome.checkpoint,
                  still_employed: outcome.still_employed,
                  role_relevance: outcome.role_relevant,
                  wage: Number(outcome.wage) || c.wage,
                  verified_by_employer: true
                }
              : c
          )
        );
      } else {
        setPlacedCandidates((prev) => [
          {
            id: `PLC-${Date.now().toString().slice(-3)}`,
            trainee_id: outcome.trainee_id,
            name: `Candidate ${outcome.trainee_id}`,
            role: "Hired Specialist",
            employer: "SkillPulse Verified Employer",
            district: "Patna",
            state: "Bihar",
            joined_date: new Date().toISOString().split("T")[0],
            checkpoint: outcome.checkpoint,
            still_employed: outcome.still_employed,
            role_relevance: outcome.role_relevant,
            wage: Number(outcome.wage) || 21500,
            verified_by_employer: true
          },
          ...prev
        ]);
      }

      setOutcomeStatusMessage(`Verified signal recorded for ${outcome.trainee_id} at ${outcome.checkpoint} checkpoint.`);
      setOutcome({ ...outcome, feedback: "" });
      setTimeout(() => setOutcomeStatusMessage(null), 4000);
    } catch (e) {
      console.error("Failed to record outcome", e);
    }
  };

  // Outcomes KPIs
  const outcomesKpis = useMemo(() => {
    const total = placedCandidates.length;
    const employed = placedCandidates.filter((c) => c.still_employed === "Yes").length;
    const confirmed3M = placedCandidates.filter((c) => c.still_employed === "Yes" && ["3M", "6M", "12M"].includes(c.checkpoint)).length;
    const confirmed6M = placedCandidates.filter((c) => c.still_employed === "Yes" && ["6M", "12M"].includes(c.checkpoint)).length;
    const rate = total > 0 ? ((employed / total) * 100).toFixed(1) : "100.0";
    return { total, employed, confirmed3M, confirmed6M, rate };
  }, [placedCandidates]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((item) => {
      if (stage !== "All" && stage !== "Matched" && item.status !== stage) return false;
      if (pipelineSearch.trim()) {
        const q = pipelineSearch.toLowerCase();
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.skillpulse_id && item.skillpulse_id.toLowerCase().includes(q)) ||
          (item.job_title && item.job_title.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [applications, stage, pipelineSearch]);

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
        <section className="space-y-4">
          {/* Stage Overview Pills */}
          <div className="flex flex-wrap gap-2">
            {(overview?.pipeline || []).map((item: any) => (
              <button
                key={item.stage}
                onClick={() => setStage(item.stage)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition flex items-center gap-2 ${
                  stage === item.stage
                    ? "border-sky-700 bg-sky-50 text-sky-950 shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{item.stage}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-mono font-black text-slate-800">
                  {item.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Filter Bar */}
          <div className="gov-card bg-white p-3 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name, ID, or job title..."
                value={pipelineSearch}
                onChange={(e) => setPipelineSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="text-slate-500 text-[11px] self-start sm:self-center">
              Showing <strong>{filteredApplications.length}</strong> candidates in pipeline stage <strong>{stage}</strong>
            </div>
          </div>

          {/* Applications Ledger */}
          {filteredApplications.length === 0 ? (
            <div className="gov-card bg-white p-8 text-center border border-slate-200 text-xs text-slate-500">
              No matching candidate applications found for the selected stage or search query.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredApplications.map((item) => (
                <div
                  key={item.id}
                  className="gov-card bg-white p-4 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-slate-900">{item.name || item.skillpulse_id}</strong>
                      <span className="text-[10px] font-mono text-slate-400">({item.skillpulse_id || item.id})</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "Applied"
                            ? "bg-slate-100 text-slate-700"
                            : item.status === "Shortlisted"
                            ? "bg-sky-100 text-sky-800"
                            : item.status === "Interview"
                            ? "bg-amber-100 text-amber-800"
                            : item.status === "Selected"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status === "Joined"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-indigo-100 text-indigo-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Applied Role: <strong>{item.job_title}</strong> • Last Updated: {item.updated_at || "Recent"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-bold text-slate-500">Move to:</span>
                    <select
                      value={item.status}
                      onChange={(event) => handleMoveStage(item.id, event.target.value)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                    >
                      {["Applied", "Shortlisted", "Interview", "Selected", "Joined", "Retained"].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "outcomes" && (
        <section className="space-y-5">
          {/* Header & Notice */}
          <div className="gov-card bg-white p-5 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-700" />
                  <h2 className="text-base font-black text-slate-900">Post-Hiring Outcomes &amp; Retention Verification Desk</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Verified signal exchange between employers and the National Skill Registry. Validates candidate retention, wage progression, and curriculum fidelity.
                </p>
              </div>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-mono font-bold text-emerald-800 border border-emerald-200 self-start sm:self-center">
                Employer Verified Signal Protocol
              </span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Placements</span>
                <strong className="text-xl font-black text-slate-900 font-mono">{outcomesKpis.total} Candidates</strong>
              </div>
              <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/60">
                <span className="text-[10px] uppercase font-bold text-sky-800 block">3M Confirmed</span>
                <strong className="text-xl font-black text-sky-950 font-mono">{outcomesKpis.confirmed3M} Placed</strong>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">6M Confirmed</span>
                <strong className="text-xl font-black text-emerald-950 font-mono">{outcomesKpis.confirmed6M} Retained</strong>
              </div>
              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/60">
                <span className="text-[10px] uppercase font-bold text-indigo-800 block">Retention Rate</span>
                <strong className="text-xl font-black text-indigo-950 font-mono">{outcomesKpis.rate}%</strong>
              </div>
            </div>

            {outcomeStatusMessage && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span>{outcomeStatusMessage}</span>
              </div>
            )}
          </div>

          {/* Placed Candidates Ledger Table */}
          <div className="gov-card bg-white p-5 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Placed Candidates Verification Ledger
              </h3>
              <span className="text-[11px] text-slate-500">
                Showing {placedCandidates.length} placed cohort candidates
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Candidate</th>
                    <th className="py-2.5 px-3">Role &amp; Employer</th>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Checkpoint</th>
                    <th className="py-2.5 px-3">Relevance</th>
                    <th className="py-2.5 px-3">Monthly Wage</th>
                    <th className="py-2.5 px-3">Employer Verification</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {placedCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{candidate.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{candidate.trainee_id}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{candidate.role}</div>
                        <div className="text-[10px] text-slate-500">{candidate.employer}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{candidate.district}, {candidate.state}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-700">
                          {candidate.checkpoint}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {candidate.role_relevance}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        ₹{candidate.wage.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        {candidate.verified_by_employer ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <Clock className="h-3.5 w-3.5" />
                            Pending Signoff
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleQuickVerify(candidate.id)}
                          className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-[11px] font-bold text-emerald-900 hover:bg-emerald-100 transition cursor-pointer"
                        >
                          Confirm Still Employed
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Structured Verification Signal Form */}
          <form
            onSubmit={handleRecordOutcomeSubmit}
            className="gov-card bg-white p-5 border border-slate-200 space-y-4 text-xs"
          >
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900">Record Post-Hiring Verification Signal</h3>
              <p className="text-slate-500 text-[11px]">
                Submit payroll, role relevance, and skill utilisation feedback directly to the trainee's verification record.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Trainee / Candidate ID *</label>
                <input
                  placeholder="e.g. SP-BR-10001"
                  value={outcome.trainee_id}
                  onChange={(e) => setOutcome({ ...outcome, trainee_id: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Retention Milestone Checkpoint</label>
                <select
                  value={outcome.checkpoint}
                  onChange={(e) => setOutcome({ ...outcome, checkpoint: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium focus:outline-none"
                >
                  {["3M", "6M", "9M", "12M"].map((item) => (
                    <option key={item} value={item}>{item} Milestone</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Still Employed with Organisation?</label>
                <select
                  value={outcome.still_employed}
                  onChange={(e) => setOutcome({ ...outcome, still_employed: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium focus:outline-none"
                >
                  <option value="Yes">Yes (Actively Employed)</option>
                  <option value="Notice Period">Notice Period / Transition</option>
                  <option value="No">No (Exited Employment)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Job Role Relevance Fidelity</label>
                <select
                  value={outcome.role_relevant}
                  onChange={(e) => setOutcome({ ...outcome, role_relevant: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium focus:outline-none"
                >
                  <option value="Highly Relevant">Highly Relevant (Direct trade match)</option>
                  <option value="Relevant">Relevant (Allied vocational application)</option>
                  <option value="Partially Relevant">Partially Relevant (General office/ops)</option>
                  <option value="Not Relevant">Not Relevant (Divergent sector)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Vocational Skill Utilisation</label>
                <select
                  value={outcome.skill_utilisation}
                  onChange={(e) => setOutcome({ ...outcome, skill_utilisation: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium focus:outline-none"
                >
                  <option value="Active">Active Daily Utilisation</option>
                  <option value="Moderate">Moderate / Project-Based</option>
                  <option value="Underutilised">Underutilised</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Verified Monthly Wage (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 22000"
                  value={outcome.wage}
                  onChange={(e) => setOutcome({ ...outcome, wage: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Employer Feedback &amp; Verification Notes</label>
              <textarea
                placeholder="Candidate shows excellent inverter diagnostics and punctual attendance on industrial site..."
                value={outcome.feedback}
                onChange={(e) => setOutcome({ ...outcome, feedback: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
                rows={2}
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              Submit Verified Signal
            </button>
          </form>
        </section>
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
