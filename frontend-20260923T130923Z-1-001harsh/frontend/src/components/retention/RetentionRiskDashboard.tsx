"use client";

import React, { useState } from "react";
import { Trainee } from "@/types";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Briefcase,
  UserCheck,
  Zap,
  Info,
  ChevronRight,
  Filter
} from "lucide-react";

interface RetentionRiskDashboardProps {
  trainees: Trainee[];
  onSelectTrainee: (trainee: Trainee) => void;
}

export const RetentionRiskDashboard: React.FC<RetentionRiskDashboardProps> = ({
  trainees,
  onSelectTrainee
}) => {
  const [riskFilter, setRiskFilter] = useState<string>("All");

  const highRiskTrainees = trainees.filter((t) => t.retention_risk === "High");
  const mediumRiskTrainees = trainees.filter((t) => t.retention_risk === "Medium");
  const lowRiskTrainees = trainees.filter((t) => t.retention_risk === "Low");

  const displayList = trainees.filter((t) => {
    if (riskFilter === "High") return t.retention_risk === "High";
    if (riskFilter === "Medium") return t.retention_risk === "Medium";
    if (riskFilter === "Low") return t.retention_risk === "Low";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Model Transparency Banner */}
      <div className="gov-card p-4 bg-amber-50/50 border border-amber-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <strong className="font-bold block">
              Predictive Retention Risk & Early Intervention Engine (Model Transparency Note)
            </strong>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Synthesized outcome-risk modeling utilizes XGBoost signals: placement timing, training-to-job match,
              unanswered follow-ups, and local industry wage density. Predictions serve exclusively as decision support
              to trigger early human counseling, never automated adverse decisions.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Risk Cohort Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setRiskFilter(riskFilter === "High" ? "All" : "High")}
          className={`gov-card p-4 cursor-pointer transition ${
            riskFilter === "High" ? "ring-2 ring-rose-500 bg-rose-50/20" : "hover:border-rose-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-rose-800">High Attrition Risk</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 my-1">{highRiskTrainees.length} candidates</div>
          <p className="text-[10px] text-slate-500">Unanswered check-in or critical trade mismatch</p>
        </div>

        <div
          onClick={() => setRiskFilter(riskFilter === "Medium" ? "All" : "Medium")}
          className={`gov-card p-4 cursor-pointer transition ${
            riskFilter === "Medium" ? "ring-2 ring-amber-500 bg-amber-50/20" : "hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-amber-800">Moderate Retention Risk</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 my-1">{mediumRiskTrainees.length} candidates</div>
          <p className="text-[10px] text-slate-500">First-time interstate placement or wage stagnation</p>
        </div>

        <div
          onClick={() => setRiskFilter(riskFilter === "Low" ? "All" : "Low")}
          className={`gov-card p-4 cursor-pointer transition ${
            riskFilter === "Low" ? "ring-2 ring-emerald-500 bg-emerald-50/20" : "hover:border-emerald-300"
          }`}
        >
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-emerald-800">Stable / High Retention</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 my-1">{lowRiskTrainees.length} candidates</div>
          <p className="text-[10px] text-slate-500">Verified employer continuity &gt;6 months with wage increments</p>
        </div>
      </div>

      {/* Candidates at Risk & Intervention Queue */}
      <div className="gov-card p-5 bg-white border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Candidate Retention Signals & Early Action Registry ({displayList.length})
            </h3>
            <p className="text-xs text-slate-500">
              Identifies candidates requiring remedial interview preparation, transition allowances, or reskilling.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium">Filter Risk:</span>
            {["All", "High", "Medium", "Low"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setRiskFilter(lvl)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                  riskFilter === lvl
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {displayList.slice(0, 12).map((t) => {
            const isHigh = t.retention_risk === "High";
            return (
              <div
                key={t.id}
                onClick={() => onSelectTrainee(t)}
                className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isHigh ? "border-rose-200 bg-rose-50/30 hover:bg-rose-50/60" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{t.name}</span>
                    <span className="font-mono text-[10px] text-slate-500">({t.id})</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        t.retention_risk === "High"
                          ? "bg-rose-100 text-rose-800"
                          : t.retention_risk === "Medium"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {t.retention_risk} Risk
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    {t.programme} • {t.district} • Employer: {t.employer || "Unassigned"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Skill Relevance: <strong className="text-slate-700">{t.skill_relevance}</strong> • Wage:{" "}
                    <strong>{t.current_wage ? `₹${t.current_wage.toLocaleString()}` : "N/A"}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="rounded-lg bg-white p-2 border border-slate-200 text-right text-[11px] max-w-xs">
                    <span className="font-bold text-sky-900 block">Recommended Action</span>
                    <span className="text-slate-600 line-clamp-1">
                      {isHigh
                        ? "Urgent counselor tele-checkin & interview remediation"
                        : "Post-placement 90-day supervisor check"}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
