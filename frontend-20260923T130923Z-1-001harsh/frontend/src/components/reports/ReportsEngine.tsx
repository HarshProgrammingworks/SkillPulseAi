"use client";

import React, { useState, useRef } from "react";
import { ReportData } from "@/types";
import { StateDistrictFields } from "@/components/geo/StateDistrictFields";
import {
  FileText,
  Download,
  Printer,
  Filter,
  CheckCircle2,
  Calendar,
  Building,
  Loader2,
  Share2
} from "lucide-react";
import { SkillPulseMark } from "@/components/brand/SkillPulseMark";

interface ReportsEngineProps {
  reportTypes: any[];
  onGenerateReport: (params: {
    report_type: string;
    state?: string;
    district?: string;
    programme?: string;
    time_period?: string;
  }) => Promise<ReportData>;
  districtsList: string[];
  programmesList: string[];
}

export const ReportsEngine: React.FC<ReportsEngineProps> = ({
  reportTypes,
  onGenerateReport,
  districtsList,
  programmesList
}) => {
  const [selectedReportType, setSelectedReportType] = useState<string>("employment_outcome");
  const [selectedState, setSelectedState] = useState("All States");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("All Districts");
  const [selectedProgramme, setSelectedProgramme] = useState<string>("All Programmes");
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>("Last 6 Months");
  const [activeReport, setActiveReport] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [highlightActive, setHighlightActive] = useState(false);
  const reportContainerRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const data = await onGenerateReport({
        report_type: selectedReportType,
        state: selectedState,
        district: selectedDistrict,
        programme: selectedProgramme,
        time_period: selectedTimePeriod
      });
      setActiveReport(data);
      setHighlightActive(true);
      setTimeout(() => {
        reportContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      setTimeout(() => {
        setHighlightActive(false);
      }, 1900);
    } catch (e: any) {
      setGenerateError(e?.message || "The research report could not be generated.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Report Configuration Bar */}
      <div className="gov-card p-5 bg-white border border-slate-200 no-print">
        <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              State Workforce Intelligence & Outcome Report Compiler
            </h3>
            <p className="text-xs text-slate-500">
              Select parameters to compile validated KPIs, cohort tables, and SkillPulse AI executive briefs.
            </p>
          </div>
          <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            Govt Standard Format
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Report Classification</label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
            >
              {(reportTypes || []).map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <StateDistrictFields allowAll state={selectedState} district={selectedDistrict} onChange={(state, district) => { setSelectedState(state); setSelectedDistrict(district || "All Districts"); }} />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Trade / Programme</label>
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="w-full truncate rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
            >
              {(programmesList || []).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Reporting Period</label>
            <select
              value={selectedTimePeriod}
              onChange={(e) => setSelectedTimePeriod(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs focus:outline-none"
            >
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last 90 Days">Last 90 Days</option>
              <option value="Last 6 Months">Last 6 Months</option>
              <option value="Last 1 Year">Last 1 Year</option>
              <option value="All Time">All Available Cohorts</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[11px] text-slate-500">
            Reports synthesize multi-verified signals, EPF wage curves, and retention check-ins.
          </span>
          <button
            disabled={isGenerating}
            onClick={handleGenerate}
            className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-sm disabled:opacity-50 transition"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <SkillPulseMark className="h-4 w-4" />}
            <span>{isGenerating ? "Compiling with SkillPulse AI..." : "Generate Official Report"}</span>
          </button>
        </div>
        {generateError && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            <span>{generateError}</span>
            <button onClick={handleGenerate} className="rounded-md bg-white px-2 py-1 font-bold">Retry</button>
          </div>
        )}
        {isGenerating && (
          <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-indigo-900 font-bold text-xs">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Generating Official Report… Synthesizing multi-verified signals & longitudinal metrics</span>
            </div>
            <p className="text-[11px] text-indigo-700/80 mt-1">
              Please wait while the official evaluation document is compiled from active cohort records.
            </p>
          </div>
        )}
      </div>

      {/* Generated Report Preview (Print-Ready) */}
      {activeReport ? (
        <div
          ref={reportContainerRef}
          className={`gov-card printable-research-report p-8 bg-white border border-slate-200 shadow-xl space-y-6 report-open-animate transition-all duration-500 ${
            highlightActive ? "report-highlight-glow" : ""
          }`}
        >
          {/* Official Document Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {activeReport.authority}
                </span>
                <h2 className="text-xl font-black text-slate-900">{activeReport.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>Doc Ref: <strong className="font-mono text-slate-800">{activeReport.id}</strong></span>
                  <span>•</span>
                  <span>Generated: {activeReport.generated_at}</span>
                  <span>•</span>
                  <span>Region: {activeReport.filters?.district || selectedDistrict || "All Districts"}</span>
                </div>
              </div>

              {/* Action Buttons for Print / PDF */}
              <div className="flex items-center gap-2 self-start sm:self-center no-print">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
                >
                  <Printer className="h-3.5 w-3.5 text-slate-500" />
                  <span>Print / PDF Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Block */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              1. Executive Outcome Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {(activeReport.kpis || []).map((k, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-500 font-medium block line-clamp-1">{k.label}</span>
                  <strong className="text-base font-black text-slate-900 block mt-0.5">{k.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* SkillPulse AI executive brief */}
          {activeReport.ai_executive_summary && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <div className="flex items-center gap-2">
                  <SkillPulseMark className="h-4 w-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                    2. AI-Assisted Executive Decision Brief ({activeReport.ai_executive_summary.source_mode})
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-indigo-700">Ground-Truth Validated</span>
              </div>

              <div>
                <h5 className="text-xs font-bold text-slate-900 mb-1">
                  Strategic Synthesis: {activeReport.ai_executive_summary.insight}
                </h5>
                <p className="text-xs text-slate-700 leading-relaxed mb-2">
                  {activeReport.ai_executive_summary.explanation}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white border border-indigo-100 text-xs space-y-1">
                <strong className="text-indigo-900 block font-bold">Policy Recommendation:</strong>
                <p className="text-slate-800 leading-relaxed text-[11px]">
                  {activeReport.ai_executive_summary.recommendation}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 italic">
                Caveat: {activeReport.ai_executive_summary.limitations}
              </div>
            </div>
          )}

          {/* Key Findings List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              3. Verified Empirical Findings
            </h4>
            <div className="space-y-1.5">
              {(activeReport.key_findings || []).map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Cohort Snapshot Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              4. Representative Candidate Cohort Sample
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="gov-table-header">
                    <th className="py-2.5 px-3">Trainee ID</th>
                    <th className="py-2.5 px-3">Candidate Name</th>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Programme</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Current Wage</th>
                    <th className="py-2.5 px-3">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activeReport.sample_cohort || []).map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 px-3 font-mono font-bold text-sky-800">{c.id}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{c.name}</td>
                      <td className="py-2 px-3 text-slate-700">{c.district}</td>
                      <td className="py-2 px-3 text-slate-700 truncate max-w-xs">{c.programme}</td>
                      <td className="py-2 px-3 font-semibold text-emerald-700">{c.status}</td>
                      <td className="py-2 px-3 font-mono">
                        {typeof c.wage === "number" ? `₹${c.wage.toLocaleString()}` : c.wage}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                          {c.verification}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {activeReport.notice && (
            <p className="text-[11px] text-slate-500">{activeReport.notice}</p>
          )}
          {activeReport.ai_error && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              The narrative model did not respond: {activeReport.ai_error} The sections below are calculated from the dataset.
            </p>
          )}
          {activeReport.sections && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wide text-slate-600">Report sections</h4>
              <p className="whitespace-pre-wrap leading-relaxed">{activeReport.sections.executive_summary}</p>
              <p className="text-slate-500">{activeReport.sections.limitations}</p>
            </div>
          )}

          {/* Official Sign-off Stamp */}
          <div className="border-t border-slate-200 pt-6 flex items-center justify-between text-xs text-slate-500">
            <div>
              <div className="font-bold text-slate-800">State Skill Development Mission</div>
              <div className="text-[10px]">Department of Skills, Employment & Innovation</div>
            </div>
            <div className="text-right">
              <div className="font-bold text-slate-700">Demonstration prototype</div>
              <div className="text-[10px]">Not an official government publication</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="gov-card p-12 text-center text-xs text-slate-500 space-y-2">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="font-bold text-slate-700">No Report Generated Yet</p>
          <p>Select your required filters above and click "Generate Official Report" to compile.</p>
        </div>
      )}
    </div>
  );
};
