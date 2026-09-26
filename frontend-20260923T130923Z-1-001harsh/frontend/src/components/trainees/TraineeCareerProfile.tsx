"use client";

import React, { useState } from "react";
import { Trainee, VerificationStatus, EmploymentStatus, RetentionStatus, CareerEvent } from "@/types";
import {
  X,
  User,
  MapPin,
  Calendar,
  Building,
  Briefcase,
  IndianRupee,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Award,
  TrendingUp,
  Edit3,
  Save,
  Check,
  BookOpen,
  ChevronRight,
  Info,
  Smartphone,
  GraduationCap
} from "lucide-react";
import { WhatsAppSimulatorModal } from "@/components/followup/WhatsAppSimulatorModal";

interface TraineeCareerProfileProps {
  trainee: Trainee;
  onClose: () => void;
  onUpdateOutcome: (traineeId: string, updatedData: any) => Promise<void>;
  onUpdateVerification: (traineeId: string, status: VerificationStatus, notes: string) => Promise<void>;
}

export const TraineeCareerProfile: React.FC<TraineeCareerProfileProps> = ({
  trainee,
  onClose,
  onUpdateOutcome,
  onUpdateVerification
}) => {
  const [activeTab, setActiveTab] = useState<"journey" | "details" | "ledger" | "verification">("journey");
  const [checkpoint, setCheckpoint] = useState<any>(null);
  const [activeWhatsAppModal, setActiveWhatsAppModal] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for outcome update
  const [formData, setFormData] = useState({
    employment_status: trainee.employment_status,
    employer: trainee.employer || "",
    job_role: trainee.job_role || "",
    current_wage: trainee.current_wage || 0,
    current_location: trainee.current_location || trainee.district,
    skill_relevance: trainee.skill_relevance || "High",
    retention_status: trainee.retention_status || "Retained 6M+",
    reason_for_leaving: trainee.reason_for_leaving || "",
    email: trainee.email || "",
    phone: trainee.phone || ""
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateOutcome(trainee.id, formData);
      setShowUpdateModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-3 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-slate-200 max-h-[92vh] overflow-hidden">
        {/* Header with Candidate Banner */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-5 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-400/30 text-lg font-bold shadow-inner">
                {trainee.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight text-white">{trainee.name}</h2>
                  <span className="font-mono text-xs bg-white/10 text-sky-200 px-2 py-0.5 rounded">
                    {trainee.id}
                  </span>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
                    {trainee.employment_status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-sky-400" /> {trainee.district}, {trainee.state}
                  </span>
                  <span>•</span>
                  <span>{trainee.job_role || "Trade Candidate"}</span>
                  {trainee.employer && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-sky-200">
                        <Building className="h-3.5 w-3.5 text-sky-400" /> {trainee.employer}
                      </span>
                    </>
                  )}
                  {trainee.email && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-sky-200">{trainee.email}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className="font-bold text-amber-300">{trainee.verification_status}</span>
                </div>
              </div>
            </div>

            {/* Actions: Update Outcome button & Close */}
            <div className="flex items-center gap-2.5 self-end sm:self-center">
              <button
                onClick={() => setShowUpdateModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-400 shadow-sm transition"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Update Outcome</span>
              </button>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="mt-5 flex gap-2 border-t border-white/10 pt-3 text-xs">
            <button
              onClick={() => setActiveTab("journey")}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                activeTab === "journey"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              Employment Tracking
            </button>
            <button
              onClick={() => setActiveTab("details")}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                activeTab === "details"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              Career & Wage Details
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                activeTab === "ledger"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              Longitudinal Career Ledger ({trainee.career_events.length})
            </button>
            <button
              onClick={() => setActiveTab("verification")}
              className={`rounded-lg px-3 py-1 font-semibold transition ${
                activeTab === "verification"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              Multi-Verification Audit
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: Employment Tracking Checkpoints */}
          {activeTab === "journey" && (
            <div className="space-y-6">
              <div className="gov-card p-5">
                <h3 className="text-sm font-bold text-slate-900">Employment tracking · 30D to 12 months</h3>
                <p className="mt-1 text-xs text-slate-500">Select a checkpoint to inspect employment, verification, and wage evidence. 12 months is the long-term outcome.</p>
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {(trainee.checkpoints || []).map((item) => (
                    <button
                      key={item.stage}
                      onClick={() => setCheckpoint(item)}
                      className={`min-w-16 rounded-xl border px-3 py-3 text-center text-[11px] font-black ${item.stage === "12M" ? "border-sky-700 bg-sky-50 text-sky-950 ring-2 ring-sky-200" : item.status === "Confirmed" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}
                    >
                      {item.stage}
                      <div className="mt-1 font-semibold">{item.status === "Confirmed" ? "✓" : "Pending"}</div>
                    </button>
                  ))}
                </div>
                {!(trainee.checkpoints || []).length && <p className="mt-2 text-xs text-slate-500">No matching records found.</p>}
              </div>
              {checkpoint && (() => {
                const is12M = checkpoint.stage === "12M";
                const is9M = checkpoint.stage === "9M";
                const verifStatus = checkpoint.verification_status || (is12M || is9M ? (trainee.verification_status || "Multi-Verified") : "Multi-Verified");
                const sources = checkpoint.verification_sources && checkpoint.verification_sources.length > 0
                  ? checkpoint.verification_sources
                  : verifStatus === "Multi-Verified"
                  ? ["Trainee confirmation", "Employer confirmation", "Programme/authorized data"]
                  : verifStatus === "Employer Verified"
                  ? ["Employer confirmation", "Trainee confirmation"]
                  : verifStatus === "Training Verified"
                  ? ["Programme/authorized data"]
                  : ["Trainee confirmation"];
                const lastVerifDate = checkpoint.last_verification_date || checkpoint.last_updated || trainee.last_follow_up_date || "12 Sep 2026";
                const history = checkpoint.verification_history && checkpoint.verification_history.length > 0
                  ? checkpoint.verification_history
                  : [
                      { source: "Trainee confirmation", date: checkpoint.last_updated || "12 Sep 2026", status: "Verified" },
                      { source: "Employer confirmation", date: checkpoint.last_updated || "12 Sep 2026", status: "Verified" },
                      { source: "Programme/authorized data", date: trainee.completion_date || "10 Aug 2025", status: "Verified" }
                    ];

                return (
                  <div className="rounded-2xl border-2 border-slate-200 bg-white p-5 text-xs space-y-4 shadow-sm animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
                            Milestone Verification Dossier
                          </span>
                          {is12M && (
                            <span className="bg-sky-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              12-Month Final Outcome
                            </span>
                          )}
                          {is9M && (
                            <span className="bg-indigo-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                              9-Month Milestone
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-slate-900 mt-0.5">
                          {is9M ? "9-Month Career Outcome" : is12M ? "12-Month Long-Term Outcome" : `${checkpoint.stage} Outcome Checkpoint`}
                        </h4>
                      </div>
                      <button onClick={() => setCheckpoint(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 font-bold">
                        ✕ Close
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Employment Status</span>
                        <strong className="text-slate-900">{checkpoint.employment_status || trainee.employment_status || "Employed"}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Employer</span>
                        <strong className="text-slate-900">{checkpoint.employer || trainee.employer || "Example Solar Pvt. Ltd."}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Role</span>
                        <strong className="text-slate-800 font-semibold">{checkpoint.role || trainee.job_role || "Solar Technician"}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">{is12M ? "Total Employment Duration" : "Employment Duration"}</span>
                        <strong className="text-slate-800">{checkpoint.employment_duration || (is12M ? "12 months" : is9M ? "9 months" : "6 months")}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Role Relevance</span>
                        <strong className="text-emerald-700">{checkpoint.role_relevance || "High (Direct Alignment with Training Trade)"}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Skill Utilisation</span>
                        <strong className="text-sky-800">{checkpoint.skill_utilisation || "Active (Daily Application of Acquired Skills)"}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Verification Status</span>
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold border mt-0.5 bg-purple-100 text-purple-800 border-purple-200">
                          {verifStatus}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Wage Band</span>
                        <strong className="text-slate-900 font-bold">{checkpoint.wage_band || (trainee.current_wage ? `₹${trainee.current_wage.toLocaleString()}/mo` : "₹22,000–₹26,000/mo")}</strong>
                      </div>
                      <div className="sm:col-span-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Update Source</span>
                        <span className="text-slate-800 font-medium">{checkpoint.update_source || `${trainee.state} Directorate of Employment & Training / Signal Desk`}</span>
                      </div>
                      <div className="sm:col-span-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Last Updated</span>
                        <strong className="text-slate-800 font-mono">{checkpoint.last_updated || "12 Sep 2026"}</strong>
                      </div>
                    </div>

                    {/* Verification Sources Section */}
                    <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">
                        Verification Sources
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sources.map((src: string) => (
                          <span key={src} className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-purple-200 text-purple-900 shadow-2xs">
                            ✓ {src}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-1 text-[11px] text-purple-950">
                        <span>Last Verification Audit:</span>
                        <strong className="font-mono">{lastVerifDate}</strong>
                      </div>
                    </div>

                    {/* Verification History Table */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        Verification History
                      </div>
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 border-b border-slate-200">
                          <tr>
                            <th className="py-1.5 px-3">Source</th>
                            <th className="py-1.5 px-3">Date</th>
                            <th className="py-1.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {history.map((vh: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-1.5 px-3 font-medium text-slate-800">{vh.source}</td>
                              <td className="py-1.5 px-3 font-mono text-slate-500">{vh.date}</td>
                              <td className="py-1.5 px-3">
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {vh.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          const s = checkpoint.stage;
                          setCheckpoint(null);
                          setActiveWhatsAppModal(s);
                        }}
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-[#075E54] px-4 py-2 text-xs font-bold text-white hover:bg-[#064e46] transition shadow-xs cursor-pointer"
                      >
                        <Smartphone className="h-4 w-4" />
                        <span>Simulate WhatsApp Follow-up ({checkpoint.stage})</span>
                      </button>
                      <button
                        onClick={() => setCheckpoint(null)}
                        className="w-full sm:w-auto rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Wage Progression & Skills Matrix side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wage progression */}
                <div className="gov-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-slate-900">Wage Progression Over Time</h4>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      Current: ₹{trainee.current_wage ? trainee.current_wage.toLocaleString() : "0"}/mo
                    </span>
                  </div>

                  <div className="space-y-3 mt-3">
                    {trainee.wage_history.length > 0 ? (
                      trainee.wage_history.map((w, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                          <div>
                            <span className="font-semibold text-slate-800">{w.stage}</span>
                            <div className="text-[10px] text-slate-400">{w.date || "Milestone"}</div>
                          </div>
                          <span className="font-mono font-bold text-emerald-700">₹{w.wage.toLocaleString()}/mo</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500 py-3 text-center">No wage history recorded.</div>
                    )}
                  </div>
                </div>

                {/* Skills Quadrant */}
                <div className="gov-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-900">Skills Alignment Matrix</h4>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
                      Trade Relevance: {trainee.skill_relevance}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mt-3 text-[11px]">
                    <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200">
                      <span className="font-bold text-emerald-900 block mb-1">Acquired Skills</span>
                      <div className="flex flex-wrap gap-1">
                        {(trainee.skills_acquired || []).map((s) => (
                          <span key={s} className="bg-white px-1.5 py-0.5 rounded text-emerald-800 text-[10px] font-medium border border-emerald-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-sky-50/60 border border-sky-200">
                      <span className="font-bold text-sky-900 block mb-1">Actively Used</span>
                      <div className="flex flex-wrap gap-1">
                        {(trainee.skills_used || []).map((s) => (
                          <span key={s} className="bg-white px-1.5 py-0.5 rounded text-sky-800 text-[10px] font-medium border border-sky-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-200">
                      <span className="font-bold text-rose-900 block mb-1">Missing / Gap</span>
                      <div className="flex flex-wrap gap-1">
                        {(trainee.skills_missing || []).map((s) => (
                          <span key={s} className="bg-white px-1.5 py-0.5 rounded text-rose-800 text-[10px] font-medium border border-rose-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-purple-50/60 border border-purple-200">
                      <span className="font-bold text-purple-900 block mb-1">Recommended Next</span>
                      <div className="flex flex-wrap gap-1">
                        {(trainee.skills_recommended || []).map((s) => (
                          <span key={s} className="bg-white px-1.5 py-0.5 rounded text-purple-800 text-[10px] font-medium border border-purple-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Career & Wage Details */}
          {activeTab === "details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="gov-card p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Training & Assessment Details
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                    <ShieldCheck className="h-3 w-3" /> Training Verified
                  </span>
                </div>

                {/* Logical Career Pathway Connector */}
                <div className="p-2.5 rounded-xl border border-sky-100 bg-sky-50/40 text-[10px]">
                  <span className="font-bold text-sky-900 block mb-1">Career Pathway Alignment:</span>
                  <div className="flex flex-wrap items-center gap-1 font-semibold text-slate-700">
                    <span className="bg-sky-200/80 text-sky-900 px-1.5 py-0.5 rounded font-bold">1. Training (Verified)</span>
                    <span>→</span>
                    <span className="bg-teal-200/80 text-teal-900 px-1.5 py-0.5 rounded font-bold">2. Assessment ({trainee.certification_score || 85}%)</span>
                    <span>→</span>
                    <span className="bg-indigo-200/80 text-indigo-900 px-1.5 py-0.5 rounded font-bold">3. Certification</span>
                    <span>→</span>
                    <span className="bg-purple-200/80 text-purple-900 px-1.5 py-0.5 rounded font-bold">4. Skills ({(trainee.skills_acquired || []).length})</span>
                    <span>→</span>
                    <span className="bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">5. Employment</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Training Programme:</span>
                    <span className="font-bold text-slate-900">{trainee.programme}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Sector:</span>
                    <span className="font-bold text-slate-900">{trainee.sector}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Training Centre:</span>
                    <span className="font-bold text-slate-900">{trainee.training_centre}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">State & District:</span>
                    <span className="font-bold text-slate-900">{trainee.district}, {trainee.state}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Start Date (Enrollment):</span>
                    <span className="font-mono text-slate-900">{trainee.enrollment_date || "2024-02-01"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Completion Date:</span>
                    <span className="font-mono text-slate-900">{trainee.completion_date || "2024-08-20"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Attendance:</span>
                    <span className="font-black text-emerald-700">92% (Mandatory AEPS Biometric)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Training Status:</span>
                    <span className="font-black text-emerald-800">Completed</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Assessment:</span>
                    <span className="font-black text-slate-900">{trainee.certification_score || 85}% / Grade A</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Certification:</span>
                    <span className="font-bold text-indigo-900">{trainee.certification_status || "Certified"} (NCVET Registry)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Verification Status:</span>
                    <span className="font-bold text-sky-800">Training Verified</span>
                  </div>
                  <div className="pt-1.5">
                    <span className="text-slate-500 block mb-1">Skills Covered in Trade:</span>
                    <div className="flex flex-wrap gap-1">
                      {(trainee.skills_acquired && trainee.skills_acquired.length > 0
                        ? trainee.skills_acquired
                        : ["Solar Installation", "Electrical Safety", "PV Maintenance"]
                      ).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-900 border border-sky-200">
                          ✓ {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="gov-card p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                  Employment & Retention Record
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Employment Status:</span>
                    <span className="font-bold text-slate-900">{trainee.employment_status}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Employer Organization:</span>
                    <span className="font-bold text-slate-900">{trainee.employer || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Designation / Role:</span>
                    <span className="font-bold text-slate-900">{trainee.job_role || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Joining Date:</span>
                    <span className="text-slate-900">{trainee.joining_date || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Starting Wage:</span>
                    <span className="font-mono text-slate-700">
                      {trainee.starting_wage ? `₹${trainee.starting_wage.toLocaleString()}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Current Monthly Wage:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {trainee.current_wage ? `₹${trainee.current_wage.toLocaleString()}` : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Employment Duration:</span>
                    <span className="font-bold text-slate-900">{trainee.employment_duration_months} months</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Current Location:</span>
                    <span className="font-bold text-slate-900">{trainee.current_location}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Attrition / Reason for Leaving:</span>
                    <span className="text-rose-700 font-medium">{trainee.reason_for_leaving || "None (Continuously Employed)"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Longitudinal Career Ledger Cards */}
          {activeTab === "ledger" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Chronological Career Ledger Entries
                </h4>
                <span className="text-xs text-slate-500">Total Entries: {trainee.career_events.length}</span>
              </div>

              {trainee.career_events.map((ev, i) => (
                <div key={ev.id} className="gov-card p-3.5 border-l-4 border-l-sky-600">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{ev.title}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded">
                        {ev.stage}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">{ev.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">{ev.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Multi-Verification Audit */}
          {activeTab === "verification" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Multi-Verification & Audit Trail
                  </h4>
                  <p className="text-xs text-slate-500">
                    Cross-verification between Trainee WhatsApp Micro-Checkin, Employer EPF Return, and State Desk.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Update Status:</span>
                  <select
                    value={trainee.verification_status}
                    onChange={(e) =>
                      onUpdateVerification(
                        trainee.id,
                        e.target.value as VerificationStatus,
                        "Updated from Trainee Profile Audit Desk"
                      )
                    }
                    className="rounded-lg border border-slate-200 py-1 px-2 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none"
                  >
                    <option value="Multi-Verified">Multi-Verified</option>
                    <option value="Employer Verified">Employer Verified</option>
                    <option value="Self Reported">Self Reported</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Conflicting Information">Conflicting Information</option>
                    <option value="Insufficient Evidence">Insufficient Evidence</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {trainee.verifications.map((v) => (
                  <div key={v.id} className="gov-card p-4">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{v.field_name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {v.status}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">{v.date}</span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 mb-1">
                      <strong>Claimed Value:</strong> {v.claimed_value}
                    </div>
                    <div className="text-xs text-slate-600 mb-1">
                      <strong>Evidence Source:</strong> {v.source} ({v.evidence_type})
                    </div>
                    <div className="text-xs text-slate-500">
                      <strong>Audit Remarks:</strong> {v.evidence_notes}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>Trainee Consent Status: <strong className="text-emerald-700">Active (Opt-in Given)</strong></span>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            Close Profile
          </button>
        </div>
      </div>

      {/* Update Outcome Modal Overlay */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
          <div className="gov-card max-w-lg w-full p-5 bg-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Update Employment Outcome</h3>
              <button onClick={() => setShowUpdateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Employment Status</label>
                <select
                  value={formData.employment_status}
                  onChange={(e) => setFormData({ ...formData, employment_status: e.target.value as EmploymentStatus })}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
                >
                  <option value="Employed">Employed (Formal Wage)</option>
                  <option value="Self-Employed">Self-Employed (Micro-Enterprise)</option>
                  <option value="Apprenticeship">Apprenticeship</option>
                  <option value="Further Education">Further Education</option>
                  <option value="Unemployed">Unemployed / Seeking</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Employer Name</label>
                  <input
                    type="text"
                    value={formData.employer}
                    onChange={(e) => setFormData({ ...formData, employer: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Job Designation</label>
                  <input
                    type="text"
                    value={formData.job_role}
                    onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Candidate Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="trainee@skillpulse.in"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="9800012345"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Monthly Wage (INR)</label>
                  <input
                    type="number"
                    value={formData.current_wage}
                    onChange={(e) => setFormData({ ...formData, current_wage: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Work Location</label>
                  <input
                    type="text"
                    value={formData.current_location}
                    onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Skill Relevance</label>
                  <select
                    value={formData.skill_relevance}
                    onChange={(e) => setFormData({ ...formData, skill_relevance: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
                  >
                    <option value="High">High (Direct Application)</option>
                    <option value="Medium">Medium (Allied Trade)</option>
                    <option value="Mismatch">Mismatch (Unrelated Trade)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Retention Horizon</label>
                  <select
                    value={formData.retention_status}
                    onChange={(e) => setFormData({ ...formData, retention_status: e.target.value as RetentionStatus })}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
                  >
                    <option value="Retained 12M+">Retained 12M+</option>
                    <option value="Retained 6M+">Retained 6M+</option>
                    <option value="Retained 3M+">Retained 3M+</option>
                    <option value="Exited <3M">Exited &lt;3M</option>
                  </select>
                </div>
              </div>

              {formData.employment_status === "Unemployed" && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reason for Leaving / Non-Placement</label>
                  <input
                    type="text"
                    value={formData.reason_for_leaving}
                    onChange={(e) => setFormData({ ...formData, reason_for_leaving: e.target.value })}
                    placeholder="e.g. Low starting wage, Relocation barrier..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
                  />
                </div>
              )}

              <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-500 shadow-sm disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Saving..." : "Save & Update Ledger"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Follow-up Simulator Modal */}
      {activeWhatsAppModal && (
        <WhatsAppSimulatorModal
          trainee={trainee}
          targetStage={activeWhatsAppModal}
          onClose={() => setActiveWhatsAppModal(null)}
          onComplete={async (data) => {
            await onUpdateOutcome(trainee.id, {
              employment_status: data.employment_status,
              employer: data.employer,
              job_role: data.job_role,
              current_wage: data.wage,
              verification_status: data.verification_status
            });
            setActiveWhatsAppModal(null);
          }}
        />
      )}
    </div>
  );
};
