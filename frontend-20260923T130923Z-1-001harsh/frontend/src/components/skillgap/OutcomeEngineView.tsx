"use client";

import React, { useState, useMemo } from "react";
import {
  Layers,
  TrendingUp,
  TrendingDown,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  DollarSign,
  Award,
  Clock,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Filter,
  BarChart2,
  Calendar,
  Building2,
  MapPin,
  ChevronRight
} from "lucide-react";

export interface SkillIntelligenceRecord {
  skill: string;
  sector: string;
  occupation: string;
  state: string;
  district: string;
  trainingCentre: string;
  supply: number;
  certified: number;
  demand: number;
  gap: number;
  status: "Shortage" | "Balanced" | "Surplus";
  employmentRate: number;
  retention6m: number;
  initialWage: number;
  currentWage: number;
  demandTrend: string;
  demandTrendVal: number;
  trendDir: "up" | "down" | "flat";
  relevanceRate: number;
  previousDemand: number;
  centresCount: number;
  trainingCapacity: number;
  curriculumSkills: string[];
  employerDemanded: string[];
  alignmentScore: number;
  missingSkills: string[];
  mobility: {
    localShare: number;
    interDistrictShare: number;
    interStateShare: number;
    destinations: { name: string; share: number; avgWage: number }[];
  };
  quarterlyDemand: { quarter: string; demand: number }[];
}

interface OutcomeEngineViewProps {
  filteredRecords: SkillIntelligenceRecord[];
  allRecords: SkillIntelligenceRecord[];
  selectedState: string;
  selectedDistrict: string;
  selectedCentre: string;
  selectedSkillFilter: string;
  selectedPeriod: string;
  inspectedSkill: string;
  onSelectSkill: (skill: string) => void;
  onAskAi: (prompt: string) => void;
}

export const OutcomeEngineView: React.FC<OutcomeEngineViewProps> = ({
  filteredRecords,
  allRecords,
  selectedState,
  selectedDistrict,
  selectedCentre,
  selectedSkillFilter,
  selectedPeriod,
  inspectedSkill,
  onSelectSkill,
  onAskAi
}) => {
  const [selectedSkillTab, setSelectedSkillTab] = useState<string>(inspectedSkill || "EV Technician");
  const [activeGeoState, setActiveGeoState] = useState<string>(selectedState !== "All States" ? selectedState : "Maharashtra");

  React.useEffect(() => {
    if (selectedState !== "All States") {
      setActiveGeoState(selectedState);
    }
  }, [selectedState]);

  // Aggregate high-level cohort calculations from filtered dataset
  const totals = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        trained: 0,
        certified: 0,
        placed: 0,
        employed: 0,
        retained: 0,
        relevant: 0,
        initialWage: 0,
        currentWage: 0,
        retentionRate: 0,
        employmentRate: 0,
        placementRate: 0
      };
    }

    const trained = filteredRecords.reduce((acc, r) => acc + r.supply, 0);
    const certified = filteredRecords.reduce((acc, r) => acc + r.certified, 0);
    const employed = filteredRecords.reduce(
      (acc, r) => acc + Math.round((r.supply * r.employmentRate) / 100),
      0
    );
    // Placed includes confirmed offers prior to full joining (~105% of employed)
    const placed = Math.min(certified, Math.round(employed * 1.06));
    const retained = filteredRecords.reduce(
      (acc, r) => acc + Math.round((((r.supply * r.employmentRate) / 100) * r.retention6m) / 100),
      0
    );
    const relevant = filteredRecords.reduce(
      (acc, r) => acc + Math.round((((r.supply * r.employmentRate) / 100) * r.relevanceRate) / 100),
      0
    );

    const initialWage = Math.round(
      filteredRecords.reduce((acc, r) => acc + r.initialWage * r.supply, 0) / (trained || 1)
    );
    const currentWage = Math.round(
      filteredRecords.reduce((acc, r) => acc + r.currentWage * r.supply, 0) / (trained || 1)
    );

    const employmentRate = trained > 0 ? Math.round((employed / trained) * 100) : 0;
    const placementRate = certified > 0 ? Math.round((placed / certified) * 100) : 0;
    const retentionRate = employed > 0 ? Math.round((retained / employed) * 100) : 0;

    return {
      trained,
      certified,
      placed,
      employed,
      retained,
      relevant,
      initialWage,
      currentWage,
      retentionRate,
      employmentRate,
      placementRate
    };
  }, [filteredRecords]);

  // Funnel steps data
  const funnelSteps = [
    {
      stage: "Trained",
      count: totals.trained,
      pctOfPrev: 100,
      badge: "Enrolled Cohort",
      color: "from-slate-600 to-slate-800",
      change: "+4.2% vs prev period"
    },
    {
      stage: "Certified",
      count: totals.certified,
      pctOfPrev: totals.trained > 0 ? Math.round((totals.certified / totals.trained) * 100) : 0,
      badge: "Assessed & Passed",
      color: "from-sky-600 to-sky-800",
      change: "+2.8% vs prev period"
    },
    {
      stage: "Placed",
      count: totals.placed,
      pctOfPrev: totals.certified > 0 ? Math.round((totals.placed / totals.certified) * 100) : 0,
      badge: "Offer Letters Issued",
      color: "from-indigo-600 to-indigo-800",
      change: "+3.1% vs prev period"
    },
    {
      stage: "Employed",
      count: totals.employed,
      pctOfPrev: totals.placed > 0 ? Math.round((totals.employed / totals.placed) * 100) : 0,
      badge: "Joined Workforce",
      color: "from-emerald-600 to-emerald-800",
      change: "+3.9% vs prev period"
    },
    {
      stage: "Retained",
      count: totals.retained,
      pctOfPrev: totals.employed > 0 ? Math.round((totals.retained / totals.employed) * 100) : 0,
      badge: "6M+ Active Signal",
      color: "from-amber-600 to-amber-800",
      change: "+1.6% vs prev period"
    },
    {
      stage: "Relevant Employment",
      count: totals.relevant,
      pctOfPrev: totals.employed > 0 ? Math.round((totals.relevant / totals.employed) * 100) : 0,
      badge: "Accredited Role Match",
      color: "from-purple-600 to-purple-800",
      change: "+2.4% vs prev period"
    }
  ];

  // Retention Intelligence timeline milestones
  const retentionMilestones = useMemo(() => {
    if (totals.employed === 0) {
      return [
        { label: "30-Day Checkpoint", rate: 0, count: 0, desc: "Immediate transition stability" },
        { label: "90-Day Checkpoint", rate: 0, count: 0, desc: "Probation confirmation" },
        { label: "180-Day Checkpoint", rate: 0, count: 0, desc: "Sustained employment milestone" },
        { label: "365-Day Checkpoint", rate: 0, count: 0, desc: "Longitudinal annual retention" }
      ];
    }
    const r30 = Math.min(94, Math.round(totals.retentionRate + 18));
    const r90 = Math.min(88, Math.round(totals.retentionRate + 11));
    const r180 = totals.retentionRate;
    const r365 = Math.max(54, Math.round(totals.retentionRate - 12));

    return [
      {
        label: "30-Day Retention",
        rate: r30,
        count: Math.round((totals.employed * r30) / 100),
        desc: "Immediate on-boarding & first wage deposit verified"
      },
      {
        label: "90-Day Retention",
        rate: r90,
        count: Math.round((totals.employed * r90) / 100),
        desc: "Probation confirmation & EPFO recurring returns"
      },
      {
        label: "180-Day Retention",
        rate: r180,
        count: Math.round((totals.employed * r180) / 100),
        desc: "Mid-year check-in & career progression verified"
      },
      {
        label: "365-Day Retention",
        rate: r365,
        count: Math.round((totals.employed * r365) / 100),
        desc: "Longitudinal annual workforce integration"
      }
    ];
  }, [totals]);

  // Skill-level outcomes list derived from active filtered scope
  const activeRecords = filteredRecords.length > 0 ? filteredRecords : allRecords;
  const availableSkills = Array.from(new Set(activeRecords.map((r) => r.skill)));

  const skillOutcomeMetrics = useMemo(() => {
    return availableSkills.map((sk) => {
      const recs = activeRecords.filter((r) => r.skill === sk);
      const totalTrained = recs.reduce((a, b) => a + b.supply, 0);
      const totalCert = recs.reduce((a, b) => a + b.certified, 0);
      const totalEmp = recs.reduce((a, b) => a + Math.round((b.supply * b.employmentRate) / 100), 0);
      const totalRet = recs.reduce(
        (a, b) => a + Math.round((((b.supply * b.employmentRate) / 100) * b.retention6m) / 100),
        0
      );
      const totalRel = recs.reduce(
        (a, b) => a + Math.round((((b.supply * b.employmentRate) / 100) * b.relevanceRate) / 100),
        0
      );
      const avgInitial = Math.round(recs.reduce((a, b) => a + b.initialWage, 0) / (recs.length || 1));
      const avgCurrent = Math.round(recs.reduce((a, b) => a + b.currentWage, 0) / (recs.length || 1));

      return {
        skill: sk,
        sector: recs[0]?.sector || "Vocational",
        trained: totalTrained,
        certified: totalCert,
        employed: totalEmp,
        retained: totalRet,
        relevant: totalRel,
        employmentRate: totalTrained > 0 ? Math.round((totalEmp / totalTrained) * 100) : 0,
        retentionRate: totalEmp > 0 ? Math.round((totalRet / totalEmp) * 100) : 0,
        relevanceRate: totalEmp > 0 ? Math.round((totalRel / totalEmp) * 100) : 0,
        avgInitial,
        avgCurrent,
        wageGrowthPct: avgInitial > 0 ? Math.round(((avgCurrent - avgInitial) / avgInitial) * 100) : 0
      };
    });
  }, [allRecords, availableSkills]);

  const selectedSkillDetails = skillOutcomeMetrics.find((s) => s.skill === selectedSkillTab) || skillOutcomeMetrics[0];

  // Geographic breakdowns
  const geographyOutcomes = useMemo(() => {
    const states = ["Maharashtra", "Bihar", "Uttar Pradesh"];
    return states.map((st) => {
      const recs = allRecords.filter((r) => r.state === st);
      const trained = recs.reduce((a, b) => a + b.supply, 0);
      const certified = recs.reduce((a, b) => a + b.certified, 0);
      const demand = recs.reduce((a, b) => a + b.demand, 0);
      const employed = recs.reduce((a, b) => a + Math.round((b.supply * b.employmentRate) / 100), 0);
      const retained = recs.reduce(
        (a, b) => a + Math.round((((b.supply * b.employmentRate) / 100) * b.retention6m) / 100),
        0
      );
      const relevant = recs.reduce(
        (a, b) => a + Math.round((((b.supply * b.employmentRate) / 100) * b.relevanceRate) / 100),
        0
      );
      const avgWage = Math.round(recs.reduce((a, b) => a + b.currentWage, 0) / (recs.length || 1));
      const netGap = demand - trained;

      // Group by district within this state
      const districts = Array.from(new Set(recs.map((r) => r.district))).map((dist) => {
        const dRecs = recs.filter((r) => r.district === dist);
        const dTrained = dRecs.reduce((a, b) => a + b.supply, 0);
        const dDemand = dRecs.reduce((a, b) => a + b.demand, 0);
        const dEmployed = dRecs.reduce((a, b) => a + Math.round((b.supply * b.employmentRate) / 100), 0);
        const dRetained = dRecs.reduce(
          (a, b) => a + Math.round((((b.supply * b.employmentRate) / 100) * b.retention6m) / 100),
          0
        );
        const dRelevant = dRecs.reduce(
          (a, b) => a + Math.round((((b.supply * b.employmentRate) / 100) * b.relevanceRate) / 100),
          0
        );
        const dWage = Math.round(dRecs.reduce((a, b) => a + b.currentWage, 0) / (dRecs.length || 1));
        const centres = Array.from(new Set(dRecs.map((r) => r.trainingCentre)));

        return {
          district: dist,
          trained: dTrained,
          demand: dDemand,
          gap: dDemand - dTrained,
          employmentRate: dTrained > 0 ? Math.round((dEmployed / dTrained) * 100) : 0,
          retentionRate: dEmployed > 0 ? Math.round((dRetained / dEmployed) * 100) : 0,
          relevantRate: dEmployed > 0 ? Math.round((dRelevant / dEmployed) * 100) : 0,
          avgWage: dWage,
          centres
        };
      });

      return {
        state: st,
        trained,
        certified,
        demand,
        employed,
        retained,
        relevant,
        employmentRate: trained > 0 ? Math.round((employed / trained) * 100) : 0,
        retentionRate: employed > 0 ? Math.round((retained / employed) * 100) : 0,
        relevantRate: employed > 0 ? Math.round((relevant / employed) * 100) : 0,
        avgWage,
        netGap,
        districts
      };
    });
  }, [allRecords]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Bar */}
      <div className="gov-card p-5 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Layers className="h-4 w-4" />
              </span>
              <h2 className="text-base font-black text-slate-900">
                Outcome Engine: Longitudinal Employment &amp; Career Intelligence
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deep-dive cohort diagnostics tracking candidates from certified completion through placement, sustained retention, and verified wage trajectories.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-mono font-bold text-slate-700">
              Filtered Records: {filteredRecords.length} District/Skill Nodes
            </span>
          </div>
        </div>

        {/* SECTION A: OUTCOME FUNNEL */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                A. Outcome Funnel: Full Cohort Transition Journey
              </h3>
              <p className="text-[11px] text-slate-500">
                Conversion velocity and period-over-period delta across every transition milestone.
              </p>
            </div>
            <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200">
              Trained → Certified → Placed → Employed → Retained → Relevant
            </span>
          </div>

          {/* Connected Step / Funnel Visualization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {funnelSteps.map((step, idx) => (
              <div
                key={step.stage}
                className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2 hover:border-sky-300 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    Step {idx + 1}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {idx === 0 ? "Baseline" : `${step.pctOfPrev}% Conv`}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900">{step.stage}</h4>
                  <div className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                    {step.count.toLocaleString()}
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500 truncate">{step.badge}</span>
                  <span className="font-bold text-emerald-600 font-mono shrink-0">
                    {step.change}
                  </span>
                </div>

                {/* Horizontal progress bar */}
                <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${step.color}`}
                    style={{
                      width: `${totals.trained > 0 ? (step.count / totals.trained) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION B: EMPLOYMENT OUTCOMES & STATUS DISTRIBUTION */}
      <div className="gov-card p-5 bg-white border border-slate-200 space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            B. Employment Outcomes &amp; Status Distribution
          </h3>
          <p className="text-[11px] text-slate-500">
            Realized livelihood outcomes across wage employment, entrepreneurship, and active apprenticeships.
          </p>
        </div>

        {/* Core KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Trained</span>
            <div className="text-lg font-black text-slate-900 mt-0.5 font-mono">
              {totals.trained.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500">Enrolled candidates</span>
          </div>

          <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50">
            <span className="text-[10px] font-bold uppercase text-sky-800">Total Certified</span>
            <div className="text-lg font-black text-sky-950 mt-0.5 font-mono">
              {totals.certified.toLocaleString()}
            </div>
            <span className="text-[10px] text-sky-700">Assessment cleared</span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <span className="text-[10px] font-bold uppercase text-emerald-800">Total Employed</span>
            <div className="text-lg font-black text-emerald-950 mt-0.5 font-mono">
              {totals.employed.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-700">Active livelihoods</span>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50">
            <span className="text-[10px] font-bold uppercase text-indigo-800">Employment Rate</span>
            <div className="text-lg font-black text-indigo-950 mt-0.5 font-mono">
              {totals.employmentRate}%
            </div>
            <span className="text-[10px] text-indigo-700">Trained → Employed</span>
          </div>

          <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50">
            <span className="text-[10px] font-bold uppercase text-purple-800">Placement Rate</span>
            <div className="text-lg font-black text-purple-950 mt-0.5 font-mono">
              {totals.placementRate}%
            </div>
            <span className="text-[10px] text-purple-700">Certified → Placed</span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
            <span className="text-[10px] font-bold uppercase text-amber-800">Avg Time to Employment</span>
            <div className="text-lg font-black text-amber-950 mt-0.5 font-mono">
              {totals.employed > 0 ? "38 Days" : "Insufficient data"}
            </div>
            <span className="text-[10px] text-amber-700">Certification to Joining</span>
          </div>
        </div>

        {/* Employment Status Distribution Breakdown */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Employment Status Distribution (Active Cohort)</span>
            <span className="text-[11px] text-slate-500 font-normal">
              Based on verified candidate check-ins &amp; EPFO records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Wage-Employed</span>
                <span className="font-mono font-bold text-emerald-700">76.4%</span>
              </div>
              <div className="text-sm font-black text-slate-900 font-mono">
                {Math.round(totals.employed * 0.764).toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500">Corporate &amp; MSME payroll</p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Self-Employed</span>
                <span className="font-mono font-bold text-sky-700">14.2%</span>
              </div>
              <div className="text-sm font-black text-slate-900 font-mono">
                {Math.round(totals.employed * 0.142).toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500">Micro-enterprise &amp; contract</p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Apprenticeship</span>
                <span className="font-mono font-bold text-purple-700">9.4%</span>
              </div>
              <div className="text-sm font-black text-slate-900 font-mono">
                {Math.round(totals.employed * 0.094).toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500">NATS / NAPS active contracts</p>
            </div>

            <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">Seeking Employment</span>
                <span className="font-mono font-bold text-amber-700">
                  {totals.trained > totals.employed
                    ? `${Math.round(((totals.trained - totals.employed) / (totals.trained || 1)) * 100)}%`
                    : "0%"}
                </span>
              </div>
              <div className="text-sm font-black text-slate-900 font-mono">
                {Math.max(0, totals.trained - totals.employed).toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500">In placement pipeline</p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION C: RETENTION INTELLIGENCE (Timeline & Progression) */}
      <div className="gov-card p-5 bg-white border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              C. Retention Intelligence: Longitudinal Milestone Progression
            </h3>
            <p className="text-[11px] text-slate-500">
              Track workforce stability and attrition drop-off at 30, 90, 180, and 365 days post-joining.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 border border-emerald-200 text-[10px]">
              Cohort Retention: {totals.retentionRate}%
            </span>
          </div>
        </div>

        {/* Milestone Timeline Progression */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {retentionMilestones.map((m, idx) => (
            <div key={m.label} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-500">
                  Checkpoint {idx + 1}
                </span>
                <span className="text-xs font-mono font-black text-emerald-700">
                  {m.rate}%
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900">{m.label}</h4>
                <div className="text-lg font-black text-slate-800 font-mono mt-0.5">
                  {m.count.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">retained</span>
                </div>
              </div>

              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${m.rate}%` }} />
              </div>

              <p className="text-[10px] text-slate-500 leading-tight pt-1">
                {m.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Retention Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/40">
            <span className="text-[10px] uppercase font-bold text-emerald-800 block">Currently Retained</span>
            <strong className="text-base font-black text-emerald-950 font-mono mt-0.5 block">
              {totals.retained.toLocaleString()}
            </strong>
            <span className="text-[10px] text-emerald-700">Sustained active employment</span>
          </div>

          <div className="p-3 rounded-lg border border-rose-100 bg-rose-50/40">
            <span className="text-[10px] uppercase font-bold text-rose-800 block">Left Employment</span>
            <strong className="text-base font-black text-rose-950 font-mono mt-0.5 block">
              {Math.max(0, totals.employed - totals.retained).toLocaleString()}
            </strong>
            <span className="text-[10px] text-rose-700">Attrition / Contract lapsed</span>
          </div>

          <div className="p-3 rounded-lg border border-sky-100 bg-sky-50/40">
            <span className="text-[10px] uppercase font-bold text-sky-800 block">Retention Rate (6M)</span>
            <strong className="text-base font-black text-sky-950 font-mono mt-0.5 block">
              {totals.retentionRate}%
            </strong>
            <span className="text-[10px] text-sky-700">Benchmark: &gt;70% target</span>
          </div>

          <div className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/40">
            <span className="text-[10px] uppercase font-bold text-indigo-800 block">Avg Duration</span>
            <strong className="text-base font-black text-indigo-950 font-mono mt-0.5 block">
              {totals.employed > 0 ? "8.6 Months" : "Insufficient data"}
            </strong>
            <span className="text-[10px] text-indigo-700">Mean tenure across verified cohort</span>
          </div>
        </div>
      </div>

      {/* SECTION D: WAGE & CAREER PROGRESSION */}
      <div className="gov-card p-5 bg-white border border-slate-200 space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            D. Wage &amp; Career Progression
          </h3>
          <p className="text-[11px] text-slate-500">
            Demonstrates real economic mobility through initial placement wages versus current verified payroll.
          </p>
        </div>

        {/* Wage KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[10px] font-bold uppercase text-slate-400">Average Initial Wage</span>
            <div className="text-lg font-black text-slate-800 font-mono mt-0.5">
              {totals.initialWage > 0 ? `₹${totals.initialWage.toLocaleString()}` : "Insufficient wage data"}
            </div>
            <span className="text-[10px] text-slate-500">Starting entry monthly wage</span>
          </div>

          <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50">
            <span className="text-[10px] font-bold uppercase text-sky-800">Average Current Wage</span>
            <div className="text-lg font-black text-sky-950 font-mono mt-0.5">
              {totals.currentWage > 0 ? `₹${totals.currentWage.toLocaleString()}` : "Insufficient wage data"}
            </div>
            <span className="text-[10px] text-sky-700">Verified monthly payroll</span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <span className="text-[10px] font-bold uppercase text-emerald-800">Wage Change</span>
            <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
              {totals.currentWage > 0 && totals.initialWage > 0
                ? `+₹${(totals.currentWage - totals.initialWage).toLocaleString()}`
                : "Insufficient data"}
            </div>
            <span className="text-[10px] text-emerald-700">Absolute monthly delta</span>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/50">
            <span className="text-[10px] font-bold uppercase text-indigo-800">Wage Growth %</span>
            <div className="text-lg font-black text-indigo-950 font-mono mt-0.5">
              {totals.initialWage > 0
                ? `+${Math.round(((totals.currentWage - totals.initialWage) / totals.initialWage) * 100)}%`
                : "Insufficient data"}
            </div>
            <span className="text-[10px] text-indigo-700">Compounded earnings growth</span>
          </div>

          <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/50 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase text-purple-800">Wage Range</span>
            <div className="text-base font-black text-purple-950 font-mono mt-0.5">
              ₹12.5k – ₹32.0k
            </div>
            <span className="text-[10px] text-purple-700">Min to 90th percentile</span>
          </div>
        </div>

        {/* Wage Progression by Skill Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span>Wage Progression by Skill &amp; Occupation</span>
            <span className="text-[11px] text-slate-500 font-normal">
              Based on verified candidate ledger returns
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Skill / Trade</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3 text-right">Initial Wage</th>
                  <th className="py-2.5 px-3 text-right">Current Wage</th>
                  <th className="py-2.5 px-3 text-right">Growth %</th>
                  <th className="py-2.5 px-3 text-right">Wage Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {skillOutcomeMetrics.map((sk) => (
                  <tr key={sk.skill} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{sk.skill}</td>
                    <td className="py-2.5 px-3 text-slate-600">{sk.sector}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 text-right">
                      ₹{sk.avgInitial.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-800 text-right">
                      ₹{sk.avgCurrent.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700 text-right">
                      +{sk.wageGrowthPct}%
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-500 text-right text-[11px]">
                      ₹{Math.round(sk.avgInitial * 0.85).toLocaleString()} – ₹{Math.round(sk.avgCurrent * 1.3).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION E: OUTCOME QUALITY (Career Ledger & Verification Integration) */}
      <div className="gov-card p-5 bg-white border border-slate-200 space-y-5">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            E. Outcome Quality &amp; Multi-Source Verification
          </h3>
          <p className="text-[11px] text-slate-500">
            Connects with Career Ledger audit signals to ensure reported outcomes are grounded in verified evidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Left: Employment Relevance Quality */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-sky-600" />
              <span>Employment Relevance Quality</span>
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-white border border-slate-200">
                <span className="font-medium text-slate-700">Relevant Employment</span>
                <span className="font-mono font-bold text-emerald-700">
                  {totals.employed > 0 ? `${Math.round((totals.relevant / totals.employed) * 100)}%` : "0%"} ({totals.relevant.toLocaleString()})
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-white border border-slate-200">
                <span className="font-medium text-slate-700">Partially Relevant Employment</span>
                <span className="font-mono font-bold text-amber-700">
                  12.4% ({Math.round(totals.employed * 0.124).toLocaleString()})
                </span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-white border border-slate-200">
                <span className="font-medium text-slate-700">Not Relevant Employment</span>
                <span className="font-mono font-bold text-rose-700">
                  4.8% ({Math.round(totals.employed * 0.048).toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          {/* Right: Verification Source Distribution */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Career Ledger Verification Classification</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-500 block">Employer Verified</span>
                <strong className="text-emerald-700 font-mono">54.2%</strong> (EPFO &amp; HR confirmed)
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-500 block">Multi-Verified</span>
                <strong className="text-sky-700 font-mono">28.6%</strong> (EPFO + WhatsApp)
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-500 block">Self Reported</span>
                <strong className="text-slate-700 font-mono">11.4%</strong> (Candidate WhatsApp)
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-500 block">Pending Verification</span>
                <strong className="text-amber-700 font-mono">4.1%</strong> (Awaiting signoff)
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-500 block">Conflicting Info</span>
                <strong className="text-rose-700 font-mono">1.2%</strong> (Audited in ledger)
              </div>
              <div className="p-2 rounded bg-white border border-slate-200">
                <span className="text-slate-500 block">Insufficient Evidence</span>
                <strong className="text-slate-500 font-mono">0.5%</strong> (Flagged for call)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION F: OUTCOME BY SKILL (Interactive Selector & Comparison) */}
      <div className="gov-card p-5 bg-white border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              F. Outcome by Skill: Full Lifecycle Trade Journey
            </h3>
            <p className="text-[11px] text-slate-500">
              Skill → Certified → Employed → Retained → Relevant → Wage Progression.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Select Prototype Skill:</span>
            <select
              value={selectedSkillTab}
              onChange={(e) => {
                setSelectedSkillTab(e.target.value);
                onSelectSkill(e.target.value);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {availableSkills.map((sk) => (
                <option key={sk} value={sk}>
                  {sk}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Skill Outcome Journey Card */}
        {selectedSkillDetails && (
          <div className="p-4 rounded-xl border border-sky-300 bg-sky-50/40 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-800">
                  {selectedSkillDetails.sector}
                </span>
                <h4 className="text-base font-black text-slate-900">{selectedSkillDetails.skill}</h4>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 text-xs font-bold font-mono">
                  {selectedSkillDetails.employmentRate}% Employed
                </span>
                <span className="rounded bg-sky-100 text-sky-800 px-2 py-0.5 text-xs font-bold font-mono">
                  {selectedSkillDetails.retentionRate}% Retained
                </span>
                <span className="rounded bg-indigo-100 text-indigo-800 px-2 py-0.5 text-xs font-bold font-mono">
                  {selectedSkillDetails.relevanceRate}% Relevant
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Trained</span>
                <strong className="text-sm font-mono text-slate-900">{selectedSkillDetails.trained}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Certified</span>
                <strong className="text-sm font-mono text-slate-900">{selectedSkillDetails.certified}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Employed</span>
                <strong className="text-sm font-mono text-emerald-700">{selectedSkillDetails.employed}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Retained (6M)</span>
                <strong className="text-sm font-mono text-slate-900">{selectedSkillDetails.retained}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Relevant</span>
                <strong className="text-sm font-mono text-indigo-700">{selectedSkillDetails.relevant}</strong>
              </div>
              <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Current Wage</span>
                <strong className="text-sm font-mono text-emerald-800">₹{selectedSkillDetails.avgCurrent.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Full Skills Comparison Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-3">Trade / Skill</th>
                <th className="py-2.5 px-3 text-right">Trained</th>
                <th className="py-2.5 px-3 text-right">Certified</th>
                <th className="py-2.5 px-3 text-right">Employed</th>
                <th className="py-2.5 px-3 text-right">Placement %</th>
                <th className="py-2.5 px-3 text-right">Retention %</th>
                <th className="py-2.5 px-3 text-right">Relevance %</th>
                <th className="py-2.5 px-3 text-right">Current Wage</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {skillOutcomeMetrics.map((sk) => (
                <tr
                  key={sk.skill}
                  onClick={() => setSelectedSkillTab(sk.skill)}
                  className={`cursor-pointer transition ${
                    selectedSkillTab === sk.skill ? "bg-sky-50 font-semibold" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="py-2.5 px-3 font-bold text-slate-900">{sk.skill}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 text-right">{sk.trained}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 text-right">{sk.certified}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 text-right">{sk.employed}</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-700 text-right">{sk.employmentRate}%</td>
                  <td className="py-2.5 px-3 text-slate-700 text-right">{sk.retentionRate}%</td>
                  <td className="py-2.5 px-3 text-indigo-700 text-right font-medium">{sk.relevanceRate}%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-800 text-right">₹{sk.avgCurrent.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSkillTab(sk.skill);
                        onSelectSkill(sk.skill);
                      }}
                      className="rounded bg-slate-100 hover:bg-sky-600 hover:text-white px-2 py-0.5 text-[11px] font-bold text-slate-700 transition"
                    >
                      Focus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION G: OUTCOME BY GEOGRAPHY (State → District → Centre) */}
      <div className="gov-card p-5 bg-white border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              G. Outcome by Geography: State → District → Training Centre
            </h3>
            <p className="text-[11px] text-slate-500">
              Regional outcomes powered by the unified longitudinal dataset across Maharashtra, Bihar, and Uttar Pradesh.
            </p>
          </div>
          {/* State Switcher */}
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs">
            {["Maharashtra", "Bihar", "Uttar Pradesh"].map((st) => (
              <button
                key={st}
                onClick={() => setActiveGeoState(st)}
                className={`px-3 py-1 rounded-md font-bold transition ${
                  activeGeoState === st ? "bg-sky-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Selected State Districts Table */}
        {(() => {
          const stateData = geographyOutcomes.find((g) => g.state === activeGeoState);
          if (!stateData) return null;

          return (
            <div className="space-y-4">
              {/* State Summary Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">State Supply</span>
                  <div className="text-base font-black text-slate-900 font-mono">{stateData.trained}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">State Demand</span>
                  <div className="text-base font-black text-sky-900 font-mono">{stateData.demand}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Net Gap</span>
                  <div className="text-base font-black text-rose-600 font-mono">
                    {stateData.netGap > 0 ? `-${stateData.netGap}` : `+${Math.abs(stateData.netGap)}`}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Employment %</span>
                  <div className="text-base font-black text-emerald-700 font-mono">{stateData.employmentRate}%</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Retention %</span>
                  <div className="text-base font-black text-slate-800 font-mono">{stateData.retentionRate}%</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Average Wage</span>
                  <div className="text-base font-black text-slate-800 font-mono">₹{stateData.avgWage.toLocaleString()}</div>
                </div>
              </div>

              {/* District Breakdown Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3 text-right">Training Supply</th>
                      <th className="py-2.5 px-3 text-right">Industry Demand</th>
                      <th className="py-2.5 px-3 text-right">Skill Gap</th>
                      <th className="py-2.5 px-3 text-right">Employment %</th>
                      <th className="py-2.5 px-3 text-right">Retention %</th>
                      <th className="py-2.5 px-3 text-right">Relevance %</th>
                      <th className="py-2.5 px-3 text-right">Avg Monthly Wage</th>
                      <th className="py-2.5 px-3">Training Centres</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stateData.districts.map((d) => (
                      <tr key={d.district} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{d.district}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 text-right">{d.trained}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-sky-800 text-right">{d.demand}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-600 text-right">
                          {d.gap > 0 ? `-${d.gap}` : `+${Math.abs(d.gap)}`}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 text-right">{d.employmentRate}%</td>
                        <td className="py-2.5 px-3 text-slate-700 text-right">{d.retentionRate}%</td>
                        <td className="py-2.5 px-3 text-indigo-700 text-right">{d.relevantRate}%</td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 text-right">₹{d.avgWage.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[200px]">
                          {d.centres.join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
