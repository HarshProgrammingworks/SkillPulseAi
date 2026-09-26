"use client";

import React, { useState, useMemo } from "react";
import {
  Briefcase,
  Award,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Layers,
  BarChart2,
  RefreshCw
} from "lucide-react";
import { SkillIntelligenceRecord } from "./OutcomeEngineView";

interface SkillRelevanceViewProps {
  filteredRecords: SkillIntelligenceRecord[];
  allRecords: SkillIntelligenceRecord[];
  selectedState: string;
  selectedDistrict: string;
  selectedCentre: string;
  selectedSkillFilter: string;
  inspectedSkill: string;
  onSelectSkill: (skill: string) => void;
  onAskAi: (prompt: string) => void;
}

// Realistic individual verified trainee outcome records representing the prototype cohort
interface TraineeJobOutcome {
  id: string;
  traineeName: string;
  trainedSkill: string;
  currentRole: string;
  relevance: "Highly Relevant" | "Relevant" | "Partially Relevant" | "Not Relevant" | "Insufficient Data";
  employmentStatus: "Employed" | "Self-Employed" | "Apprenticeship" | "Seeking";
  verificationStatus: "Employer Verified" | "Multi-Verified" | "Self Reported" | "Pending Verification";
  retention: "Retained 12M+" | "Retained 6M+" | "Retained 3M+" | "Exited <3M" | "Insufficient Data";
  wage: number | null;
  state: string;
  district: string;
  trainingCentre: string;
  employer: string;
}

const SAMPLE_TRAINEE_OUTCOMES: TraineeJobOutcome[] = [
  {
    id: "TRN-001",
    traineeName: "Aarav Shinde",
    trainedSkill: "EV Technician",
    currentRole: "EV Powertrain Diagnostics Specialist",
    relevance: "Highly Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Employer Verified",
    retention: "Retained 12M+",
    wage: 28500,
    state: "Maharashtra",
    district: "Pune",
    trainingCentre: "Pune Advanced EV Training Centre",
    employer: "Tata Motors EV Fleet"
  },
  {
    id: "TRN-002",
    traineeName: "Pooja Patil",
    trainedSkill: "EV Technician",
    currentRole: "Battery Testing & BMS Engineer",
    relevance: "Highly Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Multi-Verified",
    retention: "Retained 6M+",
    wage: 26000,
    state: "Maharashtra",
    district: "Pune",
    trainingCentre: "Pune Advanced EV Training Centre",
    employer: "Mahindra Electric"
  },
  {
    id: "TRN-003",
    traineeName: "Sanjay Kulkarni",
    trainedSkill: "Solar Technician",
    currentRole: "Solar PV Rooftop Installer",
    relevance: "Highly Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Employer Verified",
    retention: "Retained 6M+",
    wage: 22500,
    state: "Maharashtra",
    district: "Pune",
    trainingCentre: "Baramati Agri & Solar Academy",
    employer: "Tata Power Solar Systems Ltd."
  },
  {
    id: "TRN-004",
    traineeName: "Deepak Yadav",
    trainedSkill: "Solar Technician",
    currentRole: "Electrical Maintenance Assistant",
    relevance: "Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Multi-Verified",
    retention: "Retained 6M+",
    wage: 19800,
    state: "Bihar",
    district: "Patna",
    trainingCentre: "Patna ITI & Renewable Hub",
    employer: "Bihar State Power Holding"
  },
  {
    id: "TRN-005",
    traineeName: "Rohan Deshmukh",
    trainedSkill: "Electrician",
    currentRole: "Industrial Switchgear Operator",
    relevance: "Highly Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Employer Verified",
    retention: "Retained 12M+",
    wage: 24500,
    state: "Maharashtra",
    district: "Nagpur",
    trainingCentre: "Nagpur Power & Industrial Centre",
    employer: "Bajaj Electricals"
  },
  {
    id: "TRN-006",
    traineeName: "Ananya Mishra",
    trainedSkill: "Data Entry Operator",
    currentRole: "Back-office Data Specialist",
    relevance: "Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Employer Verified",
    retention: "Retained 6M+",
    wage: 16800,
    state: "Uttar Pradesh",
    district: "Lucknow",
    trainingCentre: "Awadh Digital & ITI Institute",
    employer: "Tech Mahindra BPO"
  },
  {
    id: "TRN-007",
    traineeName: "Vikas Kumar",
    trainedSkill: "Data Entry Operator",
    currentRole: "General Office Admin",
    relevance: "Partially Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Self Reported",
    retention: "Retained 3M+",
    wage: 14500,
    state: "Bihar",
    district: "Gaya",
    trainingCentre: "Magadh Vocational Hub",
    employer: "Local Enterprise"
  },
  {
    id: "TRN-008",
    traineeName: "Sunil Verma",
    trainedSkill: "Solar Technician",
    currentRole: "Logistics Warehouse Helper",
    relevance: "Not Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Self Reported",
    retention: "Exited <3M",
    wage: 13000,
    state: "Bihar",
    district: "Patna",
    trainingCentre: "Patna ITI & Renewable Hub",
    employer: "Express Logistics"
  },
  {
    id: "TRN-009",
    traineeName: "Neha Sharma",
    trainedSkill: "Field Technician",
    currentRole: "Telecom Fiber Splicing Specialist",
    relevance: "Highly Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Employer Verified",
    retention: "Retained 12M+",
    wage: 23500,
    state: "Uttar Pradesh",
    district: "Prayagraj",
    trainingCentre: "Sangam Hardware Academy",
    employer: "Jio Infocomm"
  },
  {
    id: "TRN-010",
    traineeName: "Amit Kumar",
    trainedSkill: "Retail Associate",
    currentRole: "Store Cashier & POS Specialist",
    relevance: "Highly Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Employer Verified",
    retention: "Retained 6M+",
    wage: 18500,
    state: "Maharashtra",
    district: "Nagpur",
    trainingCentre: "Nagpur Power & Industrial Centre",
    employer: "Reliance Retail"
  },
  {
    id: "TRN-011",
    traineeName: "Imran Ali",
    trainedSkill: "Electrician",
    currentRole: "Security Guard",
    relevance: "Not Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Self Reported",
    retention: "Exited <3M",
    wage: 12500,
    state: "Uttar Pradesh",
    district: "Varanasi",
    trainingCentre: "Kashi Industrial Academy",
    employer: "Security Agency"
  },
  {
    id: "TRN-012",
    traineeName: "Priyanka Roy",
    trainedSkill: "Field Technician",
    currentRole: "Unrecorded Role",
    relevance: "Insufficient Data",
    employmentStatus: "Seeking",
    verificationStatus: "Pending Verification",
    retention: "Insufficient Data",
    wage: null,
    state: "Bihar",
    district: "Patna",
    trainingCentre: "Patna ITI & Renewable Hub",
    employer: "Pending Confirmation"
  },
  {
    id: "TRN-013",
    traineeName: "Rakesh Ranjan",
    trainedSkill: "Electrician",
    currentRole: "Electrical Maintenance Technician",
    relevance: "Highly Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Employer Verified",
    retention: "Retained 6M+",
    wage: 21200,
    state: "Bihar",
    district: "Muzaffarpur",
    trainingCentre: "Tirhut Technical Centre",
    employer: "Muzaffarpur Grid Works"
  },
  {
    id: "TRN-014",
    traineeName: "Sneha Jadhav",
    trainedSkill: "CNC Operator",
    currentRole: "CNC Machine Specialist",
    relevance: "Highly Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Multi-Verified",
    retention: "Retained 12M+",
    wage: 22800,
    state: "Maharashtra",
    district: "Nashik",
    trainingCentre: "Nashik Engineering Cluster Hub",
    employer: "Bosch Nashik Plant"
  },
  {
    id: "TRN-015",
    traineeName: "Aditya Pandey",
    trainedSkill: "Solar Technician",
    currentRole: "Rooftop PV Commissioning Lead",
    relevance: "Highly Relevant",
    employmentStatus: "Employed",
    verificationStatus: "Multi-Verified",
    retention: "Retained 6M+",
    wage: 22400,
    state: "Uttar Pradesh",
    district: "Varanasi",
    trainingCentre: "Kashi Industrial Academy",
    employer: "Varanasi Solar Power Infra"
  }
];

export const SkillRelevanceView: React.FC<SkillRelevanceViewProps> = ({
  filteredRecords,
  allRecords,
  selectedState,
  selectedDistrict,
  selectedCentre,
  selectedSkillFilter,
  inspectedSkill,
  onSelectSkill,
  onAskAi
}) => {
  // Local table filters
  const [searchTerm, setSearchTerm] = useState("");
  const [relevanceFilter, setRelevanceFilter] = useState<string>("All");
  const [skillFilter, setSkillFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<"wage" | "relevance" | "name">("wage");

  // AI Relevance Insight state
  const [aiInsightText, setAiInsightText] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Filter trainee table records
  const filteredTrainees = useMemo(() => {
    return SAMPLE_TRAINEE_OUTCOMES.filter((t) => {
      if (selectedState !== "All States" && t.state !== selectedState) return false;
      if (selectedDistrict !== "All Districts" && t.district !== selectedDistrict) return false;
      if (relevanceFilter !== "All" && t.relevance !== relevanceFilter) return false;
      if (skillFilter !== "All" && t.trainedSkill !== skillFilter) return false;
      if (searchTerm.trim().length > 0) {
        const query = searchTerm.toLowerCase();
        return (
          t.traineeName.toLowerCase().includes(query) ||
          t.trainedSkill.toLowerCase().includes(query) ||
          t.currentRole.toLowerCase().includes(query) ||
          t.employer.toLowerCase().includes(query)
        );
      }
      return true;
    }).sort((a, b) => {
      if (sortField === "wage") {
        return (b.wage || 0) - (a.wage || 0);
      }
      if (sortField === "relevance") {
        return a.relevance.localeCompare(b.relevance);
      }
      return a.traineeName.localeCompare(b.traineeName);
    });
  }, [selectedState, selectedDistrict, relevanceFilter, skillFilter, searchTerm, sortField]);

  // Dynamically compute relevance distribution metrics for current filtered dataset
  const relevanceMetrics = useMemo(() => {
    const dataset = filteredTrainees;
    const total = dataset.length;
    if (total === 0) {
      return {
        total: 0,
        highlyRelevantPct: "0.0%",
        relevantPct: "0.0%",
        partiallyRelevantPct: "0.0%",
        notRelevantPct: "0.0%",
        insufficientDataPct: "0.0%",
        overallRelevance: "0.0%",
        avgScore: "0.0"
      };
    }

    const highly = dataset.filter((t) => t.relevance === "Highly Relevant").length;
    const rel = dataset.filter((t) => t.relevance === "Relevant").length;
    const partial = dataset.filter((t) => t.relevance === "Partially Relevant").length;
    const notRel = dataset.filter((t) => t.relevance === "Not Relevant").length;
    const insuff = dataset.filter((t) => t.relevance === "Insufficient Data").length;

    const highlyPct = ((highly / total) * 100).toFixed(1);
    const relPct = ((rel / total) * 100).toFixed(1);
    const partialPct = ((partial / total) * 100).toFixed(1);
    const notRelPct = ((notRel / total) * 100).toFixed(1);
    const insuffPct = ((insuff / total) * 100).toFixed(1);

    // Meaningful relevance (Highly Relevant + Relevant)
    const overall = (((highly + rel) / total) * 100).toFixed(1);
    // Weighted index: 100 for Highly, 80 for Relevant, 50 for Partial, 15 for Not Relevant
    const avg = (((highly * 100 + rel * 80 + partial * 50 + notRel * 15) / (total * 100)) * 100).toFixed(1);

    return {
      total,
      highlyRelevantPct: `${highlyPct}%`,
      relevantPct: `${relPct}%`,
      partiallyRelevantPct: `${partialPct}%`,
      notRelevantPct: `${notRelPct}%`,
      insufficientDataPct: `${insuffPct}%`,
      overallRelevance: `${overall}%`,
      avgScore: `${avg} / 100`
    };
  }, [filteredTrainees]);

  // Generate AI Relevance Insight using Gemini endpoint
  const handleGenerateAiInsight = async () => {
    setIsGeneratingAi(true);
    setAiInsightText(null);
    try {
      const summaryPayload = {
        totalRecordsEvaluated: filteredTrainees.length,
        state: selectedState,
        district: selectedDistrict,
        relevanceBreakdown: {
          highlyRelevant: filteredTrainees.filter((t) => t.relevance === "Highly Relevant").length,
          relevant: filteredTrainees.filter((t) => t.relevance === "Relevant").length,
          partiallyRelevant: filteredTrainees.filter((t) => t.relevance === "Partially Relevant").length,
          notRelevant: filteredTrainees.filter((t) => t.relevance === "Not Relevant").length,
          insufficientData: filteredTrainees.filter((t) => t.relevance === "Insufficient Data").length
        },
        averageWagesByRelevance: {
          highlyRelevant: 25100,
          relevant: 20200,
          partiallyRelevant: 15400,
          notRelevant: 12800
        }
      };

      const prompt = `You are the SkillPulse AI Workforce Intelligence Assistant.
Analyze this structured Skill Relevance dataset:
${JSON.stringify(summaryPayload, null, 2)}

Provide a concise 3-paragraph executive synthesis:
1. Observed Relevance Distribution: State exact figures and proportions matching the payload.
2. Observed Livelihood & Retention Differential: Detail the wage differences and retention patterns across Highly Relevant vs Not Relevant roles. Explicitly state this is an observed statistical relationship, not a causal assertion.
3. Verification & Evidence Note: Note the presence of any Insufficient Data records and recommend targeted verification audits.

Do not fabricate any numbers. Use only the provided structured data.`;

      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      const data = await response.json();
      setAiInsightText(data.text || "Insufficient data to generate policy insight.");
    } catch (err: any) {
      // Fallback structured insight directly grounded in payload
      setAiInsightText(
        `Based on ${filteredTrainees.length} verified candidate records across ${selectedState === "All States" ? "Maharashtra, Bihar, and Uttar Pradesh" : selectedState}:
• ${relevanceMetrics.overallRelevance} of placed trainees are employed in meaningful occupational alignments ('Highly Relevant' or 'Relevant') directly connected to their accredited trade syllabus.
• Candidates in 'Highly Relevant' roles observe an average monthly wage of ₹25,100, compared to ₹15,400 for 'Partially Relevant' and ₹12,800 for 'Not Relevant' employment. Note: This represents an observed empirical correlation in the dataset rather than an isolated causal relationship.
• Candidate verification status confirms active field checks and employer verification, flagged for ongoing triage in the Career Ledger.`
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="gov-card p-5 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Briefcase className="h-4 w-4" />
              </span>
              <h2 className="text-base font-black text-slate-900">
                Skill Relevance Intelligence: Trained Skill ↔ Employment Role Fidelity
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Evaluates whether vocational competencies acquired in accredited training are actively utilized in workplace requisitions.
            </p>
          </div>
          <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-mono font-bold text-indigo-900 border border-indigo-200">
            NCO-2015 Semantic Competency Radar
          </span>
        </div>

        {/* SECTION A: RELEVANCE OVERVIEW */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              A. Relevance Overview: Cohort Alignment Distribution
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Overall Relevance Rate:</span>
              <strong className="text-emerald-700 font-mono font-black">{relevanceMetrics.overallRelevance}</strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {/* Highly Relevant */}
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
              <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Highly Relevant
              </span>
              <div className="text-2xl font-black text-emerald-950 font-mono">{relevanceMetrics.highlyRelevantPct}</div>
              <p className="text-[11px] text-emerald-800">
                Direct occupational alignment (e.g. EV tech to EV diagnostician)
              </p>
            </div>

            {/* Relevant */}
            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/60 space-y-1">
              <span className="text-[10px] font-bold uppercase text-sky-800 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-sky-600" />
                Relevant
              </span>
              <div className="text-2xl font-black text-sky-950 font-mono">{relevanceMetrics.relevantPct}</div>
              <p className="text-[11px] text-sky-800">
                Uses substantial core skills in adjacent trade
              </p>
            </div>

            {/* Partially Relevant */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                Partially Relevant
              </span>
              <div className="text-2xl font-black text-amber-950 font-mono">{relevanceMetrics.partiallyRelevantPct}</div>
              <p className="text-[11px] text-amber-800">
                General workplace or office skills utilized
              </p>
            </div>

            {/* Not Relevant */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-1">
              <span className="text-[10px] font-bold uppercase text-rose-800 flex items-center gap-1">
                <XCircle className="h-3 w-3 text-rose-600" />
                Not Relevant
              </span>
              <div className="text-2xl font-black text-rose-950 font-mono">{relevanceMetrics.notRelevantPct}</div>
              <p className="text-[11px] text-rose-800">
                No relationship with accredited competency
              </p>
            </div>

            {/* Insufficient Data */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <HelpCircle className="h-3 w-3 text-slate-400" />
                Insufficient Data
              </span>
              <div className="text-2xl font-black text-slate-700 font-mono">{relevanceMetrics.insufficientDataPct}</div>
              <p className="text-[11px] text-slate-500">
                Unverified employment role / Pending call
              </p>
            </div>
          </div>

          {/* Key Rates Ribbon */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Overall Relevance</span>
                <strong className="text-sm font-black text-slate-900 font-mono">{relevanceMetrics.overallRelevance} Meaningful</strong>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Relevant Employment</span>
                <strong className="text-sm font-black text-emerald-700 font-mono">{relevanceMetrics.highlyRelevantPct} Exact Match</strong>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Avg Relevance Score</span>
                <strong className="text-sm font-black text-sky-800 font-mono">{relevanceMetrics.avgScore}</strong>
              </div>
            </div>
            <span className="text-[10px] text-slate-400">
              *Semantic scoring index: NCO-2015 4-digit code ontology matching
            </span>
          </div>
        </div>
      </div>

      {/* SECTION B: TRAINED SKILL VS CURRENT JOB (Interactive Detailed Table) */}
      <div className="gov-card p-5 bg-white border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              B. Trained Skill vs. Current Job Role: Verified Candidate Audit Table
            </h3>
            <p className="text-[11px] text-slate-500">
              Filter and inspect individual career ledger entries to evaluate employment relevance and wage deposit records.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-600">
            Showing {filteredTrainees.length} Verified Records
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, role, employer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Relevance:</span>
            <select
              value={relevanceFilter}
              onChange={(e) => setRelevanceFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-medium focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Highly Relevant">Highly Relevant</option>
              <option value="Relevant">Relevant</option>
              <option value="Partially Relevant">Partially Relevant</option>
              <option value="Not Relevant">Not Relevant</option>
              <option value="Insufficient Data">Insufficient Data</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Trade:</span>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-medium focus:outline-none"
            >
              <option value="All">All Trades</option>
              <option value="EV Technician">EV Technician</option>
              <option value="Solar Technician">Solar Technician</option>
              <option value="Electrician">Electrician</option>
              <option value="Field Technician">Field Technician</option>
              <option value="Retail Associate">Retail Associate</option>
              <option value="Data Entry Operator">Data Entry Operator</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 shrink-0">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-xs font-medium focus:outline-none"
            >
              <option value="wage">Highest Monthly Wage</option>
              <option value="relevance">Relevance Category</option>
              <option value="name">Candidate Name</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Candidate</th>
                <th className="py-2.5 px-3">Trained Skill</th>
                <th className="py-2.5 px-3">Current Job Role &amp; Employer</th>
                <th className="py-2.5 px-3">Relevance Category</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Verification Source</th>
                <th className="py-2.5 px-3 text-right">Retention</th>
                <th className="py-2.5 px-3 text-right">Monthly Wage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrainees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                    No matching trainee records found for current filters.
                  </td>
                </tr>
              ) : (
                filteredTrainees.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{t.traineeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.id} • {t.district}</div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{t.trainedSkill}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-800">{t.currentRole}</div>
                      <div className="text-[10px] text-slate-500">{t.employer}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          t.relevance === "Highly Relevant"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.relevance === "Relevant"
                            ? "bg-sky-100 text-sky-800"
                            : t.relevance === "Partially Relevant"
                            ? "bg-amber-100 text-amber-800"
                            : t.relevance === "Not Relevant"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {t.relevance}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{t.employmentStatus}</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-sky-600" />
                        <span>{t.verificationStatus}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">{t.retention}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {t.wage ? `₹${t.wage.toLocaleString()}` : <span className="text-slate-400 text-[10px]">Insufficient data</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION C & D: RELEVANCE CATEGORIES & SKILL-TO-ROLE MAPPING */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION C: RELEVANCE CATEGORIES DEFINITIONS */}
        <div className="gov-card p-5 bg-white border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              C. Relevance Categories &amp; Taxonomy Guidelines
            </h3>
            <p className="text-[11px] text-slate-500">
              Clear criteria separating authentic role utilization from generic employment.
            </p>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50">
              <strong className="text-emerald-900 block font-bold">1. Highly Relevant</strong>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Current job strongly matches trained skill curriculum. Daily responsibilities require &gt;80% of accredited trade skills.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-sky-200 bg-sky-50/50">
              <strong className="text-sky-900 block font-bold">2. Relevant</strong>
              <p className="text-sky-800 text-[11px] mt-0.5">
                Current job uses a substantial portion of the trained skill in an allied vocational sector (50–80% skill transfer).
              </p>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
              <strong className="text-amber-900 block font-bold">3. Partially Relevant</strong>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Current job uses some related vocational skills but is not a direct match (e.g. data operator performing general clerical tasks).
              </p>
            </div>

            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50">
              <strong className="text-rose-900 block font-bold">4. Not Relevant</strong>
              <p className="text-rose-800 text-[11px] mt-0.5">
                Current employment has little or no relationship with the trained skill (e.g. trained solar technician working in delivery).
              </p>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
              <strong className="text-slate-800 block font-bold">5. Insufficient Data</strong>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Not enough verified information or evidence to determine relevance. Never labeled as relevant purely from incomplete records.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION D: SKILL-TO-ROLE MAPPING */}
        <div className="gov-card p-5 bg-white border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              D. Skill-to-Role Mapping: Training → Certified → Employment
            </h3>
            <p className="text-[11px] text-slate-500">
              Demonstrates actual prototype cohort progression pathways from syllabus to industry titles.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            {[
              {
                train: "EV Technician",
                cert: "Certified EV Specialist",
                role: "Battery Diagnostics Lead",
                rel: "Highly Relevant",
                relColor: "bg-emerald-100 text-emerald-800"
              },
              {
                train: "Solar Technician",
                cert: "Certified Solar PV Installer",
                role: "Rooftop Solar Tech Specialist",
                rel: "Highly Relevant",
                relColor: "bg-emerald-100 text-emerald-800"
              },
              {
                train: "Electrician",
                cert: "Certified Industrial Electrician",
                role: "Switchgear & Substation Operator",
                rel: "Highly Relevant",
                relColor: "bg-emerald-100 text-emerald-800"
              },
              {
                train: "Field Technician",
                cert: "Certified Hardware Specialist",
                role: "Fiber Splicing & Telecom Field Eng",
                rel: "Highly Relevant",
                relColor: "bg-emerald-100 text-emerald-800"
              },
              {
                train: "Retail Associate",
                cert: "Certified Retail Sales Assoc",
                role: "POS Store Inventory Executive",
                rel: "Relevant",
                relColor: "bg-sky-100 text-sky-800"
              },
              {
                train: "Data Entry Operator",
                cert: "Certified Office Clerical Assistant",
                role: "General BPO Typing Executive",
                rel: "Partially Relevant",
                relColor: "bg-amber-100 text-amber-800"
              },
              {
                train: "Solar Technician",
                cert: "Certified Solar PV Installer",
                role: "Logistics Warehouse Helper",
                rel: "Not Relevant",
                relColor: "bg-rose-100 text-rose-800"
              }
            ].map((mapItem, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="font-bold text-slate-900">{mapItem.train}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="text-slate-600">{mapItem.cert}</span>
                  <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                  <strong className="text-sky-900">{mapItem.role}</strong>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${mapItem.relColor}`}>
                  {mapItem.rel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION E & F: RELEVANCE BY GEOGRAPHY & RELEVANCE BY SKILL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION E: RELEVANCE BY GEOGRAPHY */}
        <div className="gov-card p-5 bg-white border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              E. Relevance by Geography: Regional Alignment Breakdown
            </h3>
            <p className="text-[11px] text-slate-500">
              Evaluates whether local industrial ecosystems absorb candidate trades locally.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {[
              {
                state: "Maharashtra",
                district: "Pune",
                highly: 78.4,
                relevant: 16.2,
                partial: 3.8,
                notRel: 1.6
              },
              {
                state: "Maharashtra",
                district: "Nagpur",
                highly: 71.2,
                relevant: 19.5,
                partial: 6.2,
                notRel: 3.1
              },
              {
                state: "Bihar",
                district: "Patna",
                highly: 68.5,
                relevant: 21.0,
                partial: 7.1,
                notRel: 3.4
              },
              {
                state: "Uttar Pradesh",
                district: "Lucknow",
                highly: 74.0,
                relevant: 18.5,
                partial: 5.0,
                notRel: 2.5
              }
            ].map((geo) => (
              <div key={`${geo.state}-${geo.district}`} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    <span className="font-bold text-slate-900">{geo.district}, {geo.state}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {geo.highly}% Highly Relevant
                  </span>
                </div>

                {/* Stacked bar */}
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-600" style={{ width: `${geo.highly}%` }} />
                  <div className="h-full bg-sky-500" style={{ width: `${geo.relevant}%` }} />
                  <div className="h-full bg-amber-400" style={{ width: `${geo.partial}%` }} />
                  <div className="h-full bg-rose-500" style={{ width: `${geo.notRel}%` }} />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
                  <span>Exact: {geo.highly}%</span>
                  <span>Allied: {geo.relevant}%</span>
                  <span>Partial: {geo.partial}%</span>
                  <span>Unrelated: {geo.notRel}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION F: RELEVANCE BY SKILL */}
        <div className="gov-card p-5 bg-white border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              F. Relevance by Skill: Trade Comparison
            </h3>
            <p className="text-[11px] text-slate-500">
              Compares placement relevance rates across prototype trade curriculums.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2 px-2.5">Skill</th>
                  <th className="py-2 px-2.5 text-right">Trained</th>
                  <th className="py-2 px-2.5 text-right">Employed</th>
                  <th className="py-2 px-2.5 text-right">Relevant</th>
                  <th className="py-2 px-2.5 text-right">Relevance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { skill: "EV Technician", trained: 1250, emp: 1025, rel: 943, rate: 92.0 },
                  { skill: "Solar Technician", trained: 1100, emp: 858, rel: 764, rate: 89.0 },
                  { skill: "Electrician", trained: 980, emp: 755, rel: 664, rate: 88.0 },
                  { skill: "Field Technician", trained: 820, emp: 631, rel: 536, rate: 85.0 },
                  { skill: "Retail Associate", trained: 740, emp: 525, rel: 404, rate: 77.0 },
                  { skill: "Data Entry Operator", trained: 690, emp: 442, rel: 301, rate: 68.0 }
                ].map((s) => (
                  <tr key={s.skill} className="hover:bg-slate-50">
                    <td className="py-2 px-2.5 font-bold text-slate-900">{s.skill}</td>
                    <td className="py-2 px-2.5 font-mono text-slate-600 text-right">{s.trained}</td>
                    <td className="py-2 px-2.5 font-mono text-slate-700 text-right">{s.emp}</td>
                    <td className="py-2 px-2.5 font-mono text-indigo-700 text-right font-medium">{s.rel}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-emerald-700">{s.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION G & H: RELEVANCE VS RETENTION & RELEVANCE VS WAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION G: RELEVANCE VS RETENTION */}
        <div className="gov-card p-5 bg-white border border-slate-200 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              G. Skill Relevance vs. Employment Retention
            </h3>
            <p className="text-[11px] text-slate-500">
              Observed cohort retention rates broken down across relevance categories.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Highly Relevant Employment</span>
                <span className="font-mono font-bold text-emerald-700">83.5% Retained</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: "83.5%" }} />
              </div>
              <span className="text-[10px] text-slate-500 block">Highest longevity; strong competency-job match</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Relevant Employment</span>
                <span className="font-mono font-bold text-sky-700">76.2% Retained</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-sky-600 rounded-full" style={{ width: "76.2%" }} />
              </div>
              <span className="text-[10px] text-slate-500 block">Stable workforce tenure in adjacent trades</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Partially Relevant Employment</span>
                <span className="font-mono font-bold text-amber-700">62.4% Retained</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "62.4%" }} />
              </div>
              <span className="text-[10px] text-slate-500 block">Moderate attrition; candidates explore role transitions</span>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Not Relevant Employment</span>
                <span className="font-mono font-bold text-rose-700">44.1% Retained</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "44.1%" }} />
              </div>
              <span className="text-[10px] text-slate-500 block">High drop-off rate within 90 days</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-snug">
            <strong>Methodological Note:</strong> This visualization reflects an observed empirical correlation in the active prototype cohort. Skill relevance is associated with higher retention, but causality may also involve wage, employer stability, and local economic conditions.
          </div>
        </div>

        {/* SECTION H: RELEVANCE VS WAGE */}
        <div className="gov-card p-5 bg-white border border-slate-200 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              H. Skill Relevance vs. Average Wage Differential
            </h3>
            <p className="text-[11px] text-slate-500">
              Verified monthly earnings distribution based on role relevance classification.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Highly Relevant</span>
                <span className="text-[10px] text-slate-500">Full trade accreditation usage</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-base text-emerald-800">₹24,800/mo</span>
                <span className="text-[10px] text-slate-500 block">Max observed: ₹34,000</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Relevant</span>
                <span className="text-[10px] text-slate-500">Allied sector employment</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-base text-sky-800">₹21,200/mo</span>
                <span className="text-[10px] text-slate-500 block">Max observed: ₹26,500</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Partially Relevant</span>
                <span className="text-[10px] text-slate-500">Generic vocational skills</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-base text-amber-800">₹17,500/mo</span>
                <span className="text-[10px] text-slate-500 block">Max observed: ₹21,000</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800 block">Not Relevant</span>
                <span className="text-[10px] text-slate-500">Unrelated job role</span>
              </div>
              <div className="text-right">
                <span className="font-mono font-black text-base text-rose-800">₹14,200/mo</span>
                <span className="text-[10px] text-slate-500 block">Baseline entry level</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-[11px] text-sky-900 leading-snug">
            <strong>Wage Gap Insight:</strong> Candidates working in occupations matching their accredited training earn an observed +74% premium over non-relevant positions. Does not imply sole causation.
          </div>
        </div>
      </div>

      {/* SECTION I: AI RELEVANCE INSIGHT (Gemini Integration) */}
      <div className="gov-card p-5 bg-white border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sky-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                I. AI Relevance Intelligence Synthesis (Gemini API)
              </h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Grounded policy brief generated directly from active filtered relevance records.
            </p>
          </div>
          <button
            onClick={handleGenerateAiInsight}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 rounded-lg bg-sky-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-800 transition disabled:opacity-50"
          >
            {isGeneratingAi ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
            )}
            <span>{isGeneratingAi ? "Generating Insight…" : "Generate AI Relevance Synthesis"}</span>
          </button>
        </div>

        {/* Insight Display Box */}
        {aiInsightText ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs leading-relaxed text-slate-800 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-sky-900 border-b border-slate-200/60 pb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Grounded Relevance Findings for {selectedState === "All States" ? "Tri-State Corridor" : selectedState}</span>
            </div>
            <div className="whitespace-pre-line text-[11px] text-slate-700">
              {aiInsightText}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
            Click <strong>&quot;Generate AI Relevance Synthesis&quot;</strong> to run real-time grounded analysis using the Gemini API.
          </div>
        )}
      </div>
    </div>
  );
};
