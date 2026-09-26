"use client";

import React, { useState } from "react";
import { VerificationStatus } from "@/types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  UserCheck,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Filter
} from "lucide-react";

interface VerificationPanelProps {
  summary: {
    total_records: number;
    verified_rate: number;
    counts: Record<string, number>;
    conflict_count: number;
    pending_count: number;
  };
  conflicts: any[];
  onResolveConflict: (traineeId: string, newStatus: VerificationStatus, notes: string) => Promise<void>;
  onSelectTraineeId?: (traineeId: string) => void;
}

export const VerificationPanel: React.FC<VerificationPanelProps> = ({
  summary,
  conflicts,
  onResolveConflict,
  onSelectTraineeId
}) => {
  const safeSummary = summary || { total_records: 0, verified_rate: 0, counts: {}, conflict_count: 0, pending_count: 0 };
  const safeCounts = safeSummary.counts || {};
  const safeConflicts = Array.isArray(conflicts) ? conflicts : [];

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("All");
  const [activeConflict, setActiveConflict] = useState<any | null>(safeConflicts[0] || null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  const statuses = [
    { label: "Multi-Verified", count: safeCounts["Multi-Verified"] || 0, color: "emerald", desc: "EPF + Employer + WhatsApp confirmed" },
    { label: "Employer Verified", count: safeCounts["Employer Verified"] || 0, color: "blue", desc: "HR confirmed placement directly" },
    { label: "Self Reported", count: (safeCounts["Self Reported"] || safeCounts["Self-Reported"] || 0), color: "amber", desc: "Trainee check-in without HR back-check" },
    { label: "Pending Verification", count: safeCounts["Pending Verification"] || 0, color: "slate", desc: "Awaiting automated or manual review" },
    { label: "Conflicting Information", count: safeCounts["Conflicting Information"] || 0, color: "rose", desc: "Trainee vs Employer data mismatch", isAlert: true },
    { label: "Insufficient Evidence", count: safeCounts["Insufficient Evidence"] || 0, color: "gray", desc: "Incomplete documentation or unverified" }
  ];

  const handleResolve = async (newStatus: VerificationStatus) => {
    if (!activeConflict) return;
    setIsResolving(true);
    try {
      await onResolveConflict(activeConflict.trainee_id, newStatus, resolutionNotes || "Resolved during state audit panel review");
      setActiveConflict(null);
      setResolutionNotes("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statuses.map((s) => (
          <div
            key={s.label}
            onClick={() => setSelectedStatusFilter(s.label === selectedStatusFilter ? "All" : s.label)}
            className={`gov-card p-3.5 cursor-pointer transition-all ${
              selectedStatusFilter === s.label
                ? "ring-2 ring-sky-500 bg-sky-50/20"
                : s.isAlert && s.count > 0
                ? "border-rose-300 bg-rose-50/20"
                : ""
            }`}
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-slate-700">{s.label}</span>
              {s.isAlert && <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />}
            </div>
            <div className="text-xl font-black text-slate-900 my-1">{s.count}</div>
            <p className="text-[10px] text-slate-400 leading-tight">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Conflict Resolution Queue */}
      <div className="gov-card p-5 border border-rose-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Conflicting Outcomes Requiring Authorized Review ({conflicts.length})
              </h3>
              <p className="text-xs text-slate-500">
                Data sources disagree (e.g. Trainee reports active employment, but Employer reports exit).
              </p>
            </div>
          </div>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 border border-rose-200">
            Priority Action Desk
          </span>
        </div>

        {conflicts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Conflict List */}
            <div className="lg:col-span-5 space-y-2.5">
              {conflicts.map((c) => (
                <div
                  key={c.trainee_id}
                  onClick={() => setActiveConflict(c)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    activeConflict?.trainee_id === c.trainee_id
                      ? "border-sky-500 bg-sky-50/50 shadow-xs"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-900">{c.trainee_name}</span>
                    <span className="font-mono text-[10px] text-sky-700">{c.trainee_id}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 mb-1">
                    {c.programme} • {c.district}
                  </div>
                  <div className="text-[10px] text-rose-700 font-medium line-clamp-1 bg-rose-50 p-1 rounded">
                    {c.conflict_reason}
                  </div>
                </div>
              ))}
            </div>

            {/* Resolution Inspector Panel */}
            {activeConflict && (
              <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Case Review: {activeConflict.trainee_name} ({activeConflict.trainee_id})
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Reported Employer: {activeConflict.reported_employer} • Wage: ₹{activeConflict.reported_wage ? activeConflict.reported_wage.toLocaleString() : 0}/mo
                    </span>
                  </div>
                  {onSelectTraineeId && (
                    <button
                      onClick={() => onSelectTraineeId(activeConflict.trainee_id)}
                      className="flex items-center gap-1 text-xs font-semibold text-sky-700 hover:text-sky-900"
                    >
                      <span>Open Profile</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Evidence Comparison Table */}
                <div className="space-y-2 text-xs">
                  <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider block">
                    Recorded Evidence Submissions:
                  </span>
                  {activeConflict.verifications?.map((v: any) => (
                    <div key={v.id} className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
                      <div className="flex justify-between font-semibold text-slate-800 mb-0.5">
                        <span>{v.field_name}</span>
                        <span className="text-[10px] font-bold text-slate-500">{v.source}</span>
                      </div>
                      <div className="text-slate-600 text-[11px] mb-1">
                        <strong>Claim:</strong> {v.claimed_value}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        <strong>Evidence Notes:</strong> {v.evidence_notes}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resolution Notes & Actions */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Authorized Officer Audit Determination Notes
                    </label>
                    <textarea
                      rows={2}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="e.g. Verified salary credit on bank statement; confirmed contract remains active..."
                      className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      disabled={isResolving}
                      onClick={() => handleResolve("Employer Verified" as VerificationStatus)}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Confirm as Employer Verified</span>
                    </button>

                    <button
                      disabled={isResolving}
                      onClick={() => handleResolve("Self Reported" as VerificationStatus)}
                      className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Accept as Self Reported</span>
                    </button>

                    <button
                      disabled={isResolving}
                      onClick={() => handleResolve("Insufficient Evidence" as VerificationStatus)}
                      className="flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-600 shadow-xs"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Mark Insufficient Evidence</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
            No active conflicting records. All reported employment records are aligned with employer signals.
          </div>
        )}
      </div>
    </div>
  );
};
