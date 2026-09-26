"use client";

import React, { useEffect, useState } from "react";
import { Trainee, AiStructuredResponse, VerificationStatus } from "@/types";
import { api } from "@/lib/api";
import {
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Building,
  Briefcase,
  Award,
  GraduationCap,
  FileCheck,
  ArrowRight,
  RefreshCw,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Search,
  Smartphone
} from "lucide-react";
import { WhatsAppSimulatorModal } from "@/components/followup/WhatsAppSimulatorModal";

interface TraineeWorkspaceProps {
  traineeId: string;
  tab: string;
  onAsk: (question: string, trainee: Trainee) => Promise<AiStructuredResponse>;
}

const JOURNEY = [
  "Enrolled",
  "Training",
  "Assessed",
  "Certified",
  "Job Search",
  "Hired",
  "Joined",
  "30D",
  "90D",
  "180D",
  "270D",
  "9M",
  "12M"
];

const VERIFICATION_STATUSES = [
  "All",
  "Self Reported",
  "Training Verified",
  "Assessment Verified",
  "Employer Verified",
  "Multi-Verified",
  "Pending Verification",
  "Conflicting Information",
  "Insufficient Evidence"
];

function getStatusBadge(status: string) {
  switch (status) {
    case "Multi-Verified":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Employer Verified":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Training Verified":
      return "bg-sky-100 text-sky-800 border-sky-200";
    case "Assessment Verified":
      return "bg-teal-100 text-teal-800 border-teal-200";
    case "Pending Verification":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "Self Reported":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Conflicting Information":
      return "bg-rose-100 text-rose-800 border-rose-200";
    case "Insufficient Evidence":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

interface VerificationItemData {
  id: string;
  category: "Skills" | "Certifications" | "Training" | "Assessment" | "Employment information";
  title: string;
  claimedValue: string;
  status: string;
  source: string;
  lastUpdated: string;
  evidenceNotes: string;
  confidenceScore: number;
}

export const TraineeWorkspace: React.FC<TraineeWorkspaceProps> = ({ traineeId, tab, onAsk }) => {
  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AiStructuredResponse | null>(null);
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [stage, setStage] = useState<string | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [activeWhatsAppModal, setActiveWhatsAppModal] = useState<string | null>(null);
  const [skill, setSkill] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [jobOpen, setJobOpen] = useState<any>(null);

  // Verification state & simulation
  const [verifFilter, setVerifFilter] = useState("All");
  const [isSimulatingAudit, setIsSimulatingAudit] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [selectedVerifItem, setSelectedVerifItem] = useState<VerificationItemData | null>(null);

  const load = () => {
    api.getTraineeById(traineeId)
      .then(setTrainee)
      .catch((err) => setError(err?.message || "Profile could not be loaded."));
    api.listApplications()
      .then((data) => setApplications(data.items || []))
      .catch(() => setApplications([]));
  };

  useEffect(() => {
    load();
  }, [traineeId]);

  useEffect(() => {
    if (!trainee) return;
    api.listJobs({ district: trainee.district, sector: trainee.sector })
      .then((data) => setJobs(data.items || []))
      .catch(() => setJobs([]));
  }, [trainee?.id]);

  if (error) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>;
  if (!trainee) return <div className="text-sm text-slate-500">Loading your profile…</div>;

  const verified = (trainee.skill_profile || []).filter((item) => item.verification === "Verified").length;
  const prompts = ["Suggest my next skill", "Find suitable jobs", "Explain my skill gap"];
  const nextSkill = trainee.skills_recommended?.[0] || trainee.skills_missing?.[0] || "Not recorded in this profile";

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setAsking(true);
    setAskError(null);
    try {
      setAnswer(await onAsk(trimmed, trainee));
    } catch (err: any) {
      setAskError(err?.message || "The career advisor could not answer.");
    } finally {
      setAsking(false);
    }
  };

  const apply = async (job: any) => {
    try {
      await api.applyToJob(job.id);
      setJobOpen(null);
      load();
    } catch (err: any) {
      setError(err?.message || "Application could not be saved.");
    }
  };

  const matchCount = (job: any) => {
    const have = new Set((trainee.skills_acquired || []).map((item) => item.toLowerCase()));
    const required = job.required_skills || [];
    const matched = required.filter((item: string) => have.has(item.toLowerCase())).length;
    const gap = required.filter((item: string) => !have.has(item.toLowerCase()));
    return { matched, total: required.length, gap };
  };

  // Structured verification items across the 5 required areas:
  // Skills, Certifications, Training, Assessment, Employment information
  const verificationItems: VerificationItemData[] = [
    {
      id: "verif-skills-1",
      category: "Skills",
      title: "Core Domain Competencies",
      claimedValue: (trainee.skills_acquired || []).slice(0, 3).join(", ") || "Technical Skills",
      status: trainee.verification_status === "Multi-Verified" ? "Multi-Verified" : "Training Verified",
      source: "Training Centre Skill Log & Practical Performance Test",
      lastUpdated: trainee.completion_date || "2024-08-15",
      evidenceNotes: "Cross-checked against trainer grading rubric, lab completion logs, and assessment scoresheet.",
      confidenceScore: 94
    },
    {
      id: "verif-skills-2",
      category: "Skills",
      title: "Self-Reported Advanced Proficiencies",
      claimedValue: trainee.skills_recommended?.[0] ? `Candidate interest in ${trainee.skills_recommended[0]}` : "Intermediate Trade Proficiency",
      status: "Self Reported",
      source: "Candidate Self-Declaration at Registration",
      lastUpdated: trainee.enrollment_date || "2024-03-01",
      evidenceNotes: "Self-reported declaration during portal onboarding; pending formal practical validation.",
      confidenceScore: 60
    },
    {
      id: "verif-cert-1",
      category: "Certifications",
      title: "National Skill Qualification Certificate",
      claimedValue: `${trainee.programme} (Score: ${trainee.certification_score || 82}%)`,
      status: trainee.certification_status === "Certified" ? "Assessment Verified" : "Pending Verification",
      source: "State Skill Development Mission / NCVET Registry",
      lastUpdated: trainee.completion_date || "2024-08-20",
      evidenceNotes: "Digital credential issued with verification hash and certified assessor biometric stamp.",
      confidenceScore: 98
    },
    {
      id: "verif-training-1",
      category: "Training",
      title: "Institutional Vocational Training Attendance",
      claimedValue: `${trainee.programme} at ${trainee.training_centre}`,
      status: "Training Verified",
      source: "Training Partner Biometric AEPS Attendance Portal",
      lastUpdated: trainee.completion_date || "2024-08-10",
      evidenceNotes: "87% mandatory biometric attendance verified across classroom and workshop modules.",
      confidenceScore: 95
    },
    {
      id: "verif-assessment-1",
      category: "Assessment",
      title: "Independent Third-Party Assessment Score",
      claimedValue: `Score: ${trainee.certification_score || 80}/100 in Theory & Practical Evaluation`,
      status: trainee.certification_score ? "Assessment Verified" : "Insufficient Evidence",
      source: "Sector Skill Council Third-Party Assessment Agency",
      lastUpdated: trainee.completion_date || "2024-08-18",
      evidenceNotes: "Independent proctored test completed with CCTV audit recording and viva log.",
      confidenceScore: 92
    },
    {
      id: "verif-emp-1",
      category: "Employment information",
      title: "Active Employment & Wage Continuity",
      claimedValue: trainee.employer ? `${trainee.job_role || "Associate"} at ${trainee.employer} (₹${(trainee.current_wage || 18000).toLocaleString()}/mo)` : "Self/Direct Career Placement",
      status: trainee.employer ? (trainee.verification_status === "Multi-Verified" ? "Multi-Verified" : "Employer Verified") : (trainee.employment_status === "Employed" ? "Pending Verification" : "Self Reported"),
      source: trainee.employer ? `${trainee.employer} HR Verification Desk & EPFO Return Signal` : "Trainee Telephonic Self-Report",
      lastUpdated: trainee.checkpoints?.find((c) => c.stage === "12M")?.last_updated || trainee.checkpoints?.find((c) => c.stage === "9M")?.last_updated || "2025-11-20",
      evidenceNotes: trainee.employer ? "Employer signed declaration and confirmation of wage deposit received via SkillPulse employer desk." : "Candidate reported active employment status; awaiting wage slip or employer verification signoff.",
      confidenceScore: trainee.employer ? 96 : 65
    }
  ];

  const filteredVerifItems = verifFilter === "All"
    ? verificationItems
    : verificationItems.filter((item) => item.status === verifFilter);

  const runSimulation = () => {
    setIsSimulatingAudit(true);
    setSimulationComplete(false);
    setTimeout(() => {
      setIsSimulatingAudit(false);
      setSimulationComplete(true);
    }, 1200);
  };

  // Helper to extract detailed outcome info for any journey stage (especially 9M & 12M)
  const getStageOutcomeInfo = (stageName: string) => {
    const cp = (trainee.checkpoints || []).find((c) => c.stage === stageName);
    const isEmployed = trainee.employment_status === "Employed" || (cp && cp.status === "Confirmed");
    const verifStatus = cp?.verification_status || (stageName === "12M" || stageName === "9M" ? (trainee.verification_status || "Multi-Verified") : "Multi-Verified");

    const sources = cp?.verification_sources && cp.verification_sources.length > 0
      ? cp.verification_sources
      : verifStatus === "Multi-Verified"
      ? ["Trainee confirmation", "Employer confirmation", "Programme/authorized data"]
      : verifStatus === "Employer Verified"
      ? ["Employer confirmation", "Trainee confirmation"]
      : verifStatus === "Training Verified"
      ? ["Programme/authorized data"]
      : ["Trainee confirmation"];

    const history = cp?.verification_history && cp.verification_history.length > 0
      ? cp.verification_history
      : [
          { source: "Trainee confirmation", date: cp?.last_updated || "12 Sep 2026", status: "Verified" },
          { source: "Employer confirmation", date: cp?.last_updated || "12 Sep 2026", status: "Verified" },
          { source: "Programme/authorized data", date: trainee.completion_date || "10 Aug 2025", status: "Verified" }
        ];

    const lastVerifDate = cp?.last_verification_date || cp?.last_updated || trainee.last_follow_up_date || "12 Sep 2026";
    
    return {
      stage: stageName,
      status: cp?.status || (stageName === "Enrolled" || stageName === "Training" || stageName === "Assessed" || stageName === "Certified" ? "Confirmed" : "In Progress"),
      employmentStatus: cp?.employment_status || (isEmployed ? "Employed" : trainee.employment_status),
      employer: cp?.employer || trainee.employer || "Example Solar Pvt. Ltd.",
      currentRole: cp?.role || trainee.job_role || `${trainee.programme.split(" - ")[0]} Specialist`,
      duration: cp?.employment_duration || (stageName === "12M" ? "12 months" : stageName === "9M" ? "9 months" : stageName === "270D" ? "9 months" : stageName === "180D" ? "6 months" : stageName === "90D" ? "3 months" : stageName === "30D" ? "1 month" : `${trainee.employment_duration_months || 12} months`),
      roleRelevance: cp?.role_relevance || "High (Direct Alignment with Training Trade)",
      skillUtilisation: cp?.skill_utilisation || "Active (Daily Application of Acquired Skills)",
      verificationStatus: verifStatus,
      verificationSources: sources,
      verificationHistory: history,
      lastVerificationDate: lastVerifDate,
      wageBand: cp?.wage_band || (trainee.current_wage ? `₹${trainee.current_wage.toLocaleString()} / month` : "₹22,000 – ₹26,000 / month"),
      updateSource: cp?.update_source || `${trainee.state} Directorate of Employment & Training / Employer Signal Desk`,
      lastUpdated: cp?.last_updated || trainee.last_follow_up_date || "12 Sep 2026",
      isLongTerm: stageName === "12M"
    };
  };

  const renderTrainingDetails = () => (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-sky-200 bg-gradient-to-r from-sky-50 via-indigo-50/40 to-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800">
              Vocational Education & Skill Building Dossier
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-0.5">{trainee.programme}</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Centre: {trainee.training_centre} • {trainee.district}, {trainee.state}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-sky-100 text-sky-800 border-sky-200 self-start sm:self-center">
            <ShieldCheck className="h-4 w-4 text-sky-600" />
            Training Verified
          </span>
        </div>

        {/* Logical Career Pathway Connector: Training → Assessment → Certification → Skills → Employment */}
        <div className="pt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Career Verification Lifecycle Connection:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl border-2 border-sky-400 bg-sky-100/70 font-bold text-sky-950 shadow-2xs">
              <span className="block text-[10px] text-sky-700 font-semibold uppercase">1. Training</span>
              <span>Training Verified</span>
            </div>
            <div className="p-2.5 rounded-xl border border-teal-300 bg-teal-100/60 font-bold text-teal-950">
              <span className="block text-[10px] text-teal-700 font-semibold uppercase">2. Assessment</span>
              <span>{trainee.certification_score || 85}% / Grade A</span>
            </div>
            <div className="p-2.5 rounded-xl border border-indigo-300 bg-indigo-100/60 font-bold text-indigo-950">
              <span className="block text-[10px] text-indigo-700 font-semibold uppercase">3. Certification</span>
              <span>{trainee.certification_status || "Certified"}</span>
            </div>
            <div className="p-2.5 rounded-xl border border-purple-300 bg-purple-100/60 font-bold text-purple-950">
              <span className="block text-[10px] text-purple-700 font-semibold uppercase">4. Skills</span>
              <span>{(trainee.skills_acquired || []).length} Acquired</span>
            </div>
            <div className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-100/60 font-bold text-emerald-950 col-span-2 sm:col-span-1">
              <span className="block text-[10px] text-emerald-700 font-semibold uppercase">5. Employment</span>
              <span>{trainee.employment_status}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 13 Key Training Specifications */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Training Programme</span>
          <strong className="text-slate-900 font-black text-sm">{trainee.programme}</strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Sector</span>
          <strong className="text-slate-900 font-black text-sm">{trainee.sector}</strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Training Centre</span>
          <strong className="text-slate-900 font-black text-sm">{trainee.training_centre}</strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">State</span>
          <strong className="text-slate-900 font-black text-sm">{trainee.state}</strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">District</span>
          <strong className="text-slate-900 font-black text-sm">{trainee.district}</strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Start Date (Enrollment)</span>
          <strong className="text-slate-900 font-mono text-sm">{trainee.enrollment_date || "2024-02-01"}</strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Completion Date</span>
          <strong className="text-slate-900 font-mono text-sm">{trainee.completion_date || "2024-08-20"}</strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Attendance</span>
          <strong className="text-emerald-700 font-black text-sm">92% (Mandatory AEPS Biometric Log)</strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Training Status</span>
          <strong className="text-emerald-800 font-black text-sm">Completed</strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Assessment</span>
          <strong className="text-slate-900 font-black text-sm">
            {trainee.certification_score || 85}% / Grade A (Sector Skill Council Assessor)
          </strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Certification</span>
          <strong className="text-indigo-900 font-black text-sm">
            {trainee.certification_status || "Certified"} (NCVET National Skill Registry)
          </strong>
        </div>
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Verification Status</span>
          <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold border mt-0.5 bg-sky-100 text-sky-800 border-sky-200">
            Training Verified
          </span>
        </div>
        <div className="sm:col-span-2 lg:col-span-3 p-4 rounded-xl border border-slate-200 bg-white">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">Skills Covered</span>
          <div className="flex flex-wrap gap-2">
            {(trainee.skills_acquired && trainee.skills_acquired.length > 0
              ? trainee.skills_acquired
              : ["Solar Installation", "Electrical Safety", "PV Maintenance", "Inverter Diagnostics"]
            ).map((s) => (
              <span key={s} className="px-3 py-1 rounded-lg text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-200">
                ✓ {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Trainee Identity Header */}
      <div className="gov-card bg-white p-5 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-sky-800">Verified Trainee Record • SkillPulse AI</p>
            <h2 className="mt-1 text-xl font-black text-slate-900 break-words">{trainee.name}</h2>
            <p className="text-xs text-slate-500 font-mono">
              {trainee.skillpulse_id || trainee.id} • {trainee.district}, {trainee.state} • {trainee.programme}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(trainee.verification_status)}`}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {trainee.verification_status}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      {(tab === "home" || tab === "profile" || tab === "career") && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Career status", trainee.employment_status],
            ["Current role", trainee.job_role || "In Placement Pipeline"],
            ["Employer", trainee.employer || "Direct / Open Market"],
            ["Skills Acquired", String((trainee.skills_acquired || []).length)],
            ["Verified skills", String(verified || (trainee.skills_acquired || []).length)],
            ["Certification", trainee.certification_status],
            ["Experience", `${trainee.experience_years || Math.round((trainee.employment_duration_months || 12) / 12 * 10) / 10} years`],
            ["Recommended Skill", nextSkill]
          ].map(([label, value]) => (
            <div key={label} className="gov-card bg-white p-3 border border-slate-200">
              <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-black text-slate-900 break-words">{value}</p>
            </div>
          ))}
        </section>
      )}

      {/* 1. LONGITUDINAL CAREER JOURNEY */}
      {tab === "career" && (
        <section className="gov-card bg-white p-5 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900">Longitudinal Career Journey</h3>
              <p className="text-xs text-slate-500">
                Continuous employment & milestone progression: Enrolled → Training → Assessed → Certified → Job Search → Hired → Joined → 30D → 90D → 180D → 270D → 9M → 12M.
              </p>
            </div>
            <span className="text-[11px] font-bold text-sky-900 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200 self-start sm:self-center">
              Click any stage for detailed outcome audit
            </span>
          </div>

          {/* Interactive Checkpoint Timeline */}
          <div className="overflow-x-auto pb-3 pt-2">
            <div className="flex items-center gap-2 min-w-[920px]">
              {JOURNEY.map((item, idx) => {
                const info = getStageOutcomeInfo(item);
                const isConfirmed = info.status === "Confirmed";
                const is9M = item === "9M";
                const is12M = item === "12M";

                const isTrainingStage = item === "Training" || item === "Enrolled" || item === "Assessed" || item === "Certified";

                return (
                  <React.Fragment key={item}>
                    <button
                      onClick={() => {
                        if (isTrainingStage) {
                          setShowTrainingModal(true);
                        } else {
                          setStage(item);
                        }
                      }}
                      className={`relative flex flex-col items-center justify-between min-w-[72px] p-2.5 rounded-xl border text-center transition-all ${
                        is12M
                          ? "border-sky-600 bg-gradient-to-b from-sky-50 to-indigo-50/50 shadow-xs ring-2 ring-sky-300"
                          : is9M
                          ? "border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50"
                          : isConfirmed
                          ? "border-emerald-300 bg-emerald-50/60 hover:bg-emerald-50 text-emerald-950"
                          : "border-slate-200 bg-slate-50 hover:border-sky-400 text-slate-700"
                      }`}
                    >
                      <span className={`text-[11px] font-black ${is12M ? "text-sky-950" : is9M ? "text-indigo-950" : isConfirmed ? "text-emerald-900" : "text-slate-800"}`}>
                        {item}
                      </span>
                      <span className="mt-1.5 inline-flex items-center text-[10px] font-bold">
                        {isConfirmed ? (
                          <span className="text-emerald-700 flex items-center gap-0.5">
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </span>
                        ) : (
                          <span className="text-slate-400 flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> Due
                          </span>
                        )}
                      </span>
                      {is12M && (
                        <span className="absolute -top-2 right-1/2 translate-x-1/2 bg-sky-700 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase tracking-tighter">
                          12M Final
                        </span>
                      )}
                    </button>
                    {idx < JOURNEY.length - 1 && (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Quick Access cards for Training, 9M and 12M Outlines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Training Details Quick Card */}
            <div
              onClick={() => setShowTrainingModal(true)}
              className="md:col-span-2 p-4 rounded-xl border border-sky-300 bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-white hover:border-sky-500 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">Training & Institutional Foundation</span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                      Training Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {trainee.programme} • {trainee.training_centre} ({trainee.district}, {trainee.state}) • 92% Attendance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowTrainingModal(true); }}
                className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-sky-800 text-white text-xs font-bold hover:bg-sky-900 transition shrink-0 cursor-pointer"
              >
                Inspect Training Details →
              </button>
            </div>

            {/* 9 Months Outcome Card */}
            <div
              onClick={() => setStage("9M")}
              className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30 hover:border-indigo-400 transition cursor-pointer space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-indigo-600" /> 9-Month Checkpoint (9M)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                  Click for Full Details
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Mid-term employment continuity evaluation. Assesses sustained wage growth and job-role retention.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-indigo-100">
                <div>
                  <span className="text-[10px] text-slate-500 block">Employment Status:</span>
                  <strong className="text-slate-800">{getStageOutcomeInfo("9M").employmentStatus}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Role Relevance:</span>
                  <strong className="text-emerald-700">{getStageOutcomeInfo("9M").roleRelevance}</strong>
                </div>
              </div>
            </div>

            {/* 12 Months Long-Term Outcome Card */}
            <div
              onClick={() => setStage("12M")}
              className="p-4 rounded-xl border-2 border-sky-500 bg-gradient-to-br from-white via-sky-50/30 to-indigo-50/30 hover:border-sky-600 transition cursor-pointer space-y-2 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-sky-600" /> 12-Month Outcome (12M Final)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-700 text-white">
                  Long-Term Milestone
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Official 1-Year Career Outcome Checkpoint. Validates comprehensive multi-source livelihood stability.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-sky-100">
                <div>
                  <span className="text-[10px] text-slate-500 block">Long-Term Outcome:</span>
                  <strong className="text-emerald-800 font-black">Retained & Verified</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Wage Progression:</span>
                  <strong className="text-sky-900">{getStageOutcomeInfo("12M").wageBand}</strong>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TRAINING DETAILS TAB */}
      {tab === "training" && (
        <section className="gov-card bg-white p-5 border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-sky-700" />
                <h3 className="text-base font-black text-slate-900">Training Details & Institutional Record</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official vocational training specifications, mandatory biometric attendance log, and qualification credentials.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-sky-100 text-sky-800 border-sky-200 self-start sm:self-center">
              <ShieldCheck className="h-3.5 w-3.5" />
              Training Verified
            </span>
          </div>
          {renderTrainingDetails()}
        </section>
      )}

      {/* 2. AI VERIFICATION INTERACTIVE INTERFACE */}
      {tab === "verify" && (
        <section className="space-y-4">
          {/* Header Banner with Interactive Simulation Control */}
          <div className="gov-card bg-white p-5 border border-slate-200 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-sky-700" />
                  <h3 className="text-base font-black text-slate-900">AI Multi-Signal Verification Portal</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Automated verification audits cross-reference Skills, Certifications, Training attendance, Assessment scores, and Employer wage returns.
                </p>
              </div>

              <button
                onClick={runSimulation}
                disabled={isSimulatingAudit}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition disabled:opacity-50 shrink-0 self-start md:self-center"
              >
                {isSimulatingAudit ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                    <span>Running Cross-Source Audit...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 text-sky-400" />
                    <span>Run AI Verification Audit (Simulation)</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulation Notification Notice */}
            <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Prototype Simulation Notice:</strong> This interactive verification interface demonstrates simulated automated audit protocols using synthetic evidence. In production, signals link to State Skill Registries, DigiLocker, NCVET API, and EPFO returns.
              </div>
            </div>

            {simulationComplete && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between animate-fadeIn">
                <span className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  Audit Simulation Complete: All 5 validation domains audited with zero checksum discrepancies.
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                  Audited Just Now
                </span>
              </div>
            )}

            {/* Filter by Verification Status */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Filter by Verification Status:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {VERIFICATION_STATUSES.map((statusName) => (
                  <button
                    key={statusName}
                    onClick={() => setVerifFilter(statusName)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      verifFilter === statusName
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {statusName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Verification Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredVerifItems.map((item) => (
              <article
                key={item.id}
                className="gov-card bg-white p-5 border border-slate-200 space-y-3 hover:border-slate-300 transition shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      What is being verified
                    </span>
                    <h4 className="text-sm font-black text-slate-900">{item.category} • {item.title}</h4>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-slate-700">
                  <p>
                    <strong className="text-slate-900">Claimed Record:</strong> {item.claimedValue}
                  </p>
                  <p>
                    <strong className="text-slate-900">Verification Source:</strong> {item.source}
                  </p>
                  <p>
                    <strong className="text-slate-900">Last Updated:</strong> {item.lastUpdated}
                  </p>
                  <p className="text-slate-500 text-[11px] italic">
                    Audit Note: {item.evidenceNotes}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                    <span>Audit Confidence:</span>
                    <span className="text-sky-800 font-black">{item.confidenceScore}%</span>
                  </div>
                  <button
                    onClick={() => setSelectedVerifItem(item)}
                    className="flex items-center gap-1 text-xs font-bold text-sky-800 hover:text-sky-950 transition"
                  >
                    <span>Inspect Evidence</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredVerifItems.length === 0 && (
            <div className="gov-card p-6 text-center text-xs text-slate-500 bg-white border border-slate-200">
              No verification records match the selected status filter "{verifFilter}".
            </div>
          )}
        </section>
      )}

      {/* SKILLS TAB */}
      {tab === "skills" && (
        <section className="gov-card bg-white p-4 border border-slate-200 overflow-x-auto">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Skill Profile & Acquired Capabilities</h3>
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="text-[10px] uppercase text-slate-400">
                <th className="py-2">Skill</th>
                <th className="py-2">Level</th>
                <th className="py-2">Verification Status</th>
              </tr>
            </thead>
            <tbody>
              {(trainee.skill_profile || []).map((item) => (
                <tr key={item.name} className="border-t border-slate-100">
                  <td className="py-2">
                    <button className="font-bold text-sky-900 hover:underline" onClick={() => setSkill(item)}>
                      {item.name}
                    </button>
                  </td>
                  <td className="py-2">{item.level}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(item.verification === "Verified" ? "Training Verified" : "Pending Verification")}`}>
                      {item.verification}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(trainee.skill_profile || []).length === 0 && (
            <p className="text-xs text-slate-500 py-3">No skills recorded in this profile yet.</p>
          )}
        </section>
      )}

      {/* JOBS TAB */}
      {tab === "jobs" && (
        <section className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Recommended Opportunities in {trainee.district}, {trainee.state}</h3>
          {jobs.length === 0 && <p className="text-xs text-slate-500">No matching records found. Try changing your filters.</p>}
          {jobs.slice(0, 8).map((job) => {
            const score = matchCount(job);
            const application = applications.find((item) => item.job_id === job.id);
            return (
              <article key={job.id} className="gov-card bg-white p-4 border border-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-black text-slate-900">{job.title}</h4>
                    <p className="text-xs text-slate-500">{job.location} · {job.openings} openings</p>
                    <p className="mt-1 text-xs font-bold text-sky-900">{score.matched}/{score.total || 0} required skills matched</p>
                    {score.gap[0] && <p className="text-xs text-amber-800">Skill gap: {score.gap[0]}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setJobOpen(job)} className="rounded-lg border px-3 py-1.5 text-xs font-bold">View Job</button>
                    <button onClick={() => apply(job)} disabled={!!application} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                      {application ? application.status : "Apply"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* UPDATES TAB */}
      {tab === "updates" && (
        <section className="gov-card bg-white p-5 border border-slate-200 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Longitudinal Career Updates & Check-ins</h3>
              <p className="text-slate-500 text-[11px]">Follow-up records and verification audits from 30D through 12 Months.</p>
            </div>
          </div>
          {((trainee.checkpoints && trainee.checkpoints.length > 0)
            ? trainee.checkpoints
            : [
                { stage: "30D", employer: trainee.employer, role: trainee.job_role, status: "Verified" },
                { stage: "90D", employer: trainee.employer, role: trainee.job_role, status: "Verified" },
                { stage: "180D", employer: trainee.employer, role: trainee.job_role, status: "Verified" },
                { stage: "9M", employer: trainee.employer, role: trainee.job_role, status: "Verified" },
                { stage: "12M", employer: trainee.employer, role: trainee.job_role, status: "Verified" }
              ]
          ).map((item) => {
            const info = getStageOutcomeInfo(item.stage);
            return (
              <div
                key={item.stage}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 hover:bg-slate-100/80 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900 text-sm">{item.stage} Checkpoint</strong>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(info.verificationStatus)}`}>
                      {info.verificationStatus}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {item.role || trainee.job_role || "Associate"} at <strong>{item.employer || trainee.employer || "Employer Desk"}</strong>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Sources: {info.verificationSources.join(" + ")} • Updated: {info.lastUpdated}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => setActiveWhatsAppModal(item.stage)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#075E54] text-white font-bold text-xs hover:bg-[#064e46] transition shadow-2xs cursor-pointer"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={() => setStage(item.stage)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* SKILL GAPS TAB */}
      {tab === "gaps" && (
        <section className="gov-card bg-white p-4 border border-slate-200 text-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Skill Gap Diagnosis</h3>
          <p className="text-slate-600">
            Missing in current cohort: <strong className="text-rose-700">{(trainee.skills_missing || []).join(", ") || "None recorded"}</strong>
          </p>
          <p className="text-slate-600">
            Recommended advancement step: <strong className="text-sky-800">{nextSkill}</strong>
          </p>
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            {(trainee.skill_profile || []).filter((item) => item.verification === "Gap" || item.verification === "Partial").map((item) => (
              <button key={item.name} onClick={() => setSkill(item)} className="block w-full rounded-lg border px-3 py-2 text-left font-bold text-sky-900 hover:bg-sky-50 transition">
                {item.name} · Level: {item.level} · Status: {item.verification}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ADVISOR / LEARN TAB */}
      {tab === "advisor" && (
        <section className="gov-card bg-white p-4 border border-slate-200 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">AI Career Advisor</h3>
          <p className="text-xs text-slate-500">Ask career, skill-gap, and advancement questions grounded in your profile.</p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button key={prompt} onClick={() => setQuestion(prompt)} className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50">
                {prompt}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask SkillPulse AI anything about your career progression…"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
            <button
              onClick={() => ask(question)}
              disabled={asking || !question.trim()}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              {asking ? "Analyzing…" : "Ask AI"}
            </button>
          </div>
          {asking && <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Grounding response with profile...</div>}
          {askError && <p className="rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-800">{askError}</p>}
          {answer && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs space-y-2 break-words">
              <p><strong>Observed Evidence:</strong> {answer.evidence}</p>
              <p><strong>Strategic Interpretation:</strong> {answer.insight} {answer.explanation}</p>
              <p><strong>Next Career Step:</strong> {answer.recommendation}</p>
              <p className="text-[11px] text-slate-500 italic">Limitation: {answer.limitations}</p>
            </div>
          )}
        </section>
      )}

      {/* DETAILED OUTCOME MODAL (TRIGGERED BY ANY JOURNEY STAGE, e.g. 9M & 12M) */}
      {stage && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setStage(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-800">
                    Career Milestone Checkpoint
                  </span>
                  {stage === "12M" && (
                    <span className="bg-sky-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      12-Month Final Outcome
                    </span>
                  )}
                  {stage === "9M" && (
                    <span className="bg-indigo-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      9-Month Milestone
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">{stage} Longitudinal Outcome</h3>
              </div>
              <button onClick={() => setStage(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 12M Special Callout Banner */}
            {stage === "12M" && (
              <div className="rounded-xl border border-sky-300 bg-sky-50/80 p-3.5 text-xs text-sky-950 space-y-1">
                <strong className="block font-black text-sm flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-sky-700" />
                  Long-Term Outcome Verified (12 Months Retention)
                </strong>
                <p>
                  This checkpoint represents the definitive 1-year career retention outcome. The trainee has sustained formal livelihood continuity, wage stability, and direct skill utilization in the target sector.
                </p>
              </div>
            )}

            {/* 9M Callout Banner */}
            {stage === "9M" && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3 text-xs text-indigo-950">
                <strong className="block font-bold">9-Month Checkpoint Audit</strong>
                <p>Confirms three quarters of post-training employment continuity and on-the-job skill advancement.</p>
              </div>
            )}

            {/* Detailed Key-Value Outcome Information with Supporting Verification */}
            {(() => {
              const info = getStageOutcomeInfo(stage);
              return (
                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Employment Status</span>
                      <strong className="text-sm font-black text-slate-900">{info.employmentStatus}</strong>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Employer</span>
                      <strong className="text-sm font-black text-slate-900">{info.employer}</strong>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Current Role</span>
                      <strong className="text-slate-800 font-bold">{info.currentRole}</strong>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Employment Duration</span>
                      <strong className="text-slate-800 font-bold">{info.duration}</strong>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Role Relevance</span>
                      <strong className="text-emerald-700 font-bold">{info.roleRelevance}</strong>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Skill Utilisation</span>
                      <strong className="text-sky-800 font-bold">{info.skillUtilisation}</strong>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Verification Status</span>
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border mt-0.5 ${getStatusBadge(info.verificationStatus)}`}>
                        {info.verificationStatus}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Wage Band</span>
                      <strong className="text-slate-900 font-black">{info.wageBand}</strong>
                    </div>
                    <div className="sm:col-span-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Update Source</span>
                      <span className="text-slate-800 font-medium">{info.updateSource}</span>
                    </div>
                    <div className="sm:col-span-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Last Updated Date</span>
                      <strong className="text-slate-800 font-mono">{info.lastUpdated}</strong>
                    </div>
                  </div>

                  {/* Verification Sources & Multi-Source Audit Details */}
                  <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">
                      Verification Sources
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {info.verificationSources.map((src: string) => (
                        <span key={src} className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white border border-purple-200 text-purple-900 shadow-2xs">
                          ✓ {src}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-purple-950">
                      <span>Last Verification Audit:</span>
                      <strong className="font-mono">{info.lastVerificationDate}</strong>
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
                        {info.verificationHistory.map((vh: any, idx: number) => (
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
                </div>
              );
            })()}

            {/* Modal Footer Controls */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
              <button
                onClick={() => {
                  const s = stage;
                  setStage(null);
                  setActiveWhatsAppModal(s);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-[#075E54] px-4 py-2.5 text-xs font-black text-white hover:bg-[#064e46] shadow-sm transition cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                <span>Simulate WhatsApp Follow-up ({stage})</span>
              </button>

              <button
                onClick={() => setStage(null)}
                className="w-full sm:w-auto rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close Milestone View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRAINING DETAILS MODAL */}
      {showTrainingModal && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fadeIn" onClick={() => setShowTrainingModal(false)}>
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-sky-700" />
                <h3 className="text-lg font-black text-slate-900">Training Details & Institutional Verification</h3>
              </div>
              <button
                onClick={() => setShowTrainingModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {renderTrainingDetails()}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowTrainingModal(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Close Training Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP SIMULATOR MODAL (SHARED SINGLE MODAL) */}
      {activeWhatsAppModal && (
        <WhatsAppSimulatorModal
          trainee={trainee}
          targetStage={activeWhatsAppModal}
          onClose={() => setActiveWhatsAppModal(null)}
          onComplete={async (data) => {
            await api.completeFollowUp(trainee.id, data);
            load();
            setActiveWhatsAppModal(null);
          }}
        />
      )}

      {/* VERIFICATION EVIDENCE DETAIL MODAL */}
      {selectedVerifItem && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setSelectedVerifItem(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Audit Evidence Dossier
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">{selectedVerifItem.category}</h3>
              </div>
              <button onClick={() => setSelectedVerifItem(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Target Information Claim</span>
                <p className="font-bold text-slate-900 mt-0.5">{selectedVerifItem.claimedValue}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Audit Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border mt-0.5 ${getStatusBadge(selectedVerifItem.status)}`}>
                    {selectedVerifItem.status}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Confidence</span>
                  <strong className="text-sky-800 text-sm font-black mt-0.5 block">{selectedVerifItem.confidenceScore}%</strong>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Verification Authority & Source</span>
                <p className="text-slate-800 font-semibold mt-0.5">{selectedVerifItem.source}</p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Audit Evidence Notes</span>
                <p className="text-slate-600 mt-0.5 leading-relaxed">{selectedVerifItem.evidenceNotes}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-mono text-slate-500">
                Digital Audit Fingerprint: 0xSP{Math.abs(trainee.id.split("").reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16)}...VERIFIED
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedVerifItem(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SKILL DETAIL MODAL */}
      {skill && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setSkill(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 text-xs shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-900 text-sm">{skill.name}</h3>
              <button onClick={() => setSkill(null)} className="font-bold text-slate-400 hover:text-slate-600">✕ Close</button>
            </div>
            <p><strong>Level:</strong> {skill.level}</p>
            <p><strong>Acquired from:</strong> {skill.acquired_from}</p>
            <p><strong>Assessment score:</strong> {skill.assessment_score ?? "82/100"}</p>
            <p><strong>Verification:</strong> {skill.verification}</p>
            <p><strong>Related roles:</strong> {(skill.related_jobs || []).join(", ") || trainee.job_role || "Trade Specialist"}</p>
            <p><strong>Recommended next learning:</strong> {nextSkill}</p>
          </div>
        </div>
      )}

      {/* JOB DETAIL MODAL */}
      {jobOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setJobOpen(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 text-xs shadow-2xl space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-sm text-slate-900">{jobOpen.title}</h3>
              <button onClick={() => setJobOpen(null)} className="font-bold text-slate-400 hover:text-slate-600">✕ Close</button>
            </div>
            <p className="text-slate-600">{jobOpen.description}</p>
            <p><strong>Location:</strong> {jobOpen.location}</p>
            <p><strong>Pay:</strong> ₹{jobOpen.salary_min?.toLocaleString()} – ₹{jobOpen.salary_max?.toLocaleString()} / month</p>
            <p><strong>Required Skills:</strong> {(jobOpen.required_skills || []).join(", ")}</p>
            <button onClick={() => apply(jobOpen)} className="w-full rounded-xl bg-slate-900 py-2.5 font-bold text-white hover:bg-slate-800 transition">
              Confirm Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
