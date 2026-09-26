"use client";

import React, { useEffect } from "react";
import {
  Shield,
  User,
  Building2,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Award,
  Briefcase,
  Layers,
  Clock,
  IdCard,
  FileCheck
} from "lucide-react";
import { Session } from "@/lib/api";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: "admin" | "trainee" | "employer";
  session: Session | null;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  role,
  session
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl transition-all"
        style={{
          backgroundColor: "var(--th-surface)",
          borderColor: "var(--th-border)",
          color: "var(--th-text)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon / Banner */}
        <div className="relative h-28 w-full bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 px-6 pt-6 flex items-start justify-between">
          <div className="flex items-center gap-2 text-white/80 text-xs font-semibold">
            {role === "admin" && <Shield className="h-4 w-4 text-sky-300" />}
            {role === "trainee" && <User className="h-4 w-4 text-emerald-300" />}
            {role === "employer" && <Building2 className="h-4 w-4 text-indigo-300" />}
            <span className="uppercase tracking-wider">
              {role === "admin" ? "Administrative Profile" : role === "trainee" ? "Trainee Longitudinal Profile" : "Hiring Desk / Employer Profile"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-black/20 hover:bg-black/40 text-white p-1.5 transition"
            aria-label="Close profile modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pb-6 pt-0 relative">
          {/* Avatar & Top Info */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 mb-6">
            <div className="flex items-end gap-3.5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-sky-950 border-4 border-[var(--th-surface)] text-xl font-black text-white shadow-lg">
                {role === "admin" ? "SK" : role === "trainee" ? (session?.display_name?.slice(0, 2) || "RV").toUpperCase() : "TP"}
              </div>
              <div className="mb-1">
                <h2 id="profile-modal-title" className="text-xl font-black tracking-tight" style={{ color: "var(--th-text)" }}>
                  {role === "admin" ? "S. K. Roy" : role === "trainee" ? (session?.display_name || "Rahul Kumar Verma") : (session?.display_name || "Tata Power Solar Systems Ltd.")}
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-semibold" style={{ color: "var(--th-text-muted)" }}>
                    {role === "admin" ? "Administrator" : role === "trainee" ? "Solar Technician Candidate" : "Lead Recruiter & Industry Partner"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-sky-500/10 border border-sky-500/20 px-3 py-1 text-xs font-mono font-bold text-sky-700">
                {role === "admin" ? "ID: SP-ADM-001" : role === "trainee" ? `ID: ${session?.trainee_id || "TRN-BR-2024-0012"}` : "ID: EMP-MH-2024-089"}
              </span>
            </div>
          </div>

          {/* Role-Specific Profile Sections */}
          {role === "admin" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Organization
                  </span>
                  <strong className="text-xs block mt-0.5" style={{ color: "var(--th-text)" }}>
                    SkillPulse AI Administration
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Account Type
                  </span>
                  <strong className="text-xs block mt-0.5" style={{ color: "var(--th-text)" }}>
                    Government / Program Administrator
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Official Email
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 font-mono text-xs" style={{ color: "var(--th-text)" }}>
                    <Mail className="h-3.5 w-3.5 text-sky-600" />
                    <span>admin@skillpulse.in</span>
                    <span className="text-[10px] text-slate-400 font-sans">(Prototype/Demo)</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Department
                  </span>
                  <strong className="text-xs block mt-0.5" style={{ color: "var(--th-text)" }}>
                    Directorate of Employment & Training / Skill Mission
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Access Level
                  </span>
                  <strong className="text-xs text-sky-700 block mt-0.5">
                    Super Admin / Full Executive Command Centre
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Last Login
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 font-mono text-xs" style={{ color: "var(--th-text)" }}>
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>26 Sep 2026, 09:30 AM IST</span>
                  </div>
                </div>
              </div>

              {/* Security & Audit Summary */}
              <div className="p-3.5 rounded-xl border bg-slate-500/5 space-y-1.5" style={{ borderColor: "var(--th-border)" }}>
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <FileCheck className="h-4 w-4 text-emerald-600" />
                  <span>Administrative Authority & Governance Scope</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--th-text-secondary)" }}>
                  Authorized to audit longitudinal career outcomes, configure verification criteria, inspect multi-district skill supply-demand radars, and coordinate state workforce policies across Maharashtra, Bihar, and Uttar Pradesh.
                </p>
              </div>
            </div>
          )}

          {role === "trainee" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Age & Gender
                  </span>
                  <strong className="text-xs block mt-0.5" style={{ color: "var(--th-text)" }}>
                    21 Years • Male
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    State & District
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 font-bold" style={{ color: "var(--th-text)" }}>
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    <span>Patna, Bihar</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Training Centre
                  </span>
                  <strong className="text-xs block mt-0.5" style={{ color: "var(--th-text)" }}>
                    Patna ITI &amp; Renewable Energy Skilling Hub
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Training Programme
                  </span>
                  <strong className="text-xs block mt-0.5 text-sky-700">
                    Suryamitra Solar PV Installation &amp; Maintenance
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Primary Skill & Certification
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Award className="h-3.5 w-3.5 text-amber-500" />
                    <strong style={{ color: "var(--th-text)" }}>Solar Technician</strong>
                    <span className="rounded bg-emerald-500/10 text-emerald-600 px-1.5 py-0.2 text-[10px] font-bold">
                      Certified
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Training Completion Date
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5 font-mono" style={{ color: "var(--th-text)" }}>
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>15 Jun 2025</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Employment Status & Role
                  </span>
                  <div className="mt-0.5">
                    <span className="font-bold text-emerald-700">Employed</span>
                    <span className="text-slate-400"> — </span>
                    <span style={{ color: "var(--th-text)" }}>Solar PV Installation Technician</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Verification Status
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-600" />
                    <strong className="text-sky-700">Employer Verified</strong>
                    <span className="text-[10px] text-slate-400 font-mono">(EPFO Joined: 01 Aug 2025)</span>
                  </div>
                </div>
              </div>

              {/* Career Ledger Status */}
              <div className="p-3.5 rounded-xl border bg-emerald-500/5 space-y-1.5" style={{ borderColor: "var(--th-border)" }}>
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Longitudinal Career Ledger Active</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--th-text-secondary)" }}>
                  All career progression checkpoints (30D, 90D, 180D) are verified through Employer wage deposit returns and WhatsApp micro check-ins.
                </p>
              </div>
            </div>
          )}

          {role === "employer" && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Organisation / Company Name
                  </span>
                  <strong className="text-xs block mt-0.5" style={{ color: "var(--th-text)" }}>
                    {session?.display_name || "Tata Power Solar Systems Ltd."}
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Industry / Sector
                  </span>
                  <strong className="text-xs block mt-0.5" style={{ color: "var(--th-text)" }}>
                    Renewable Energy &amp; Clean Tech
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Contact Person & Role
                  </span>
                  <strong className="text-xs block mt-0.5" style={{ color: "var(--th-text)" }}>
                    Rajesh Deshmukh (Head of Talent Acquisition)
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Location (State & District)
                  </span>
                  <div className="flex items-center gap-1 mt-0.5 font-bold" style={{ color: "var(--th-text)" }}>
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    <span>Pune, Maharashtra</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Hiring Desk Function
                  </span>
                  <strong className="text-xs block mt-0.5 text-sky-700">
                    Lead Recruiter &amp; Industry Placement Partner
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Official Contact
                  </span>
                  <div className="mt-0.5 font-mono text-[11px]" style={{ color: "var(--th-text)" }}>
                    contact@tatapower-hiring.in • +91 98220 12345 (Demo)
                  </div>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Active Job Openings
                  </span>
                  <strong className="text-lg font-black text-sky-800 block mt-0.5">
                    18 Requisitions
                  </strong>
                </div>

                <div className="p-3 rounded-xl border" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--th-text-muted)" }}>
                    Total Cohort Hires
                  </span>
                  <strong className="text-lg font-black text-emerald-700 block mt-0.5">
                    42 Verified Hires
                  </strong>
                </div>
              </div>

              {/* Partner Verification Status */}
              <div className="p-3.5 rounded-xl border bg-sky-500/5 space-y-1.5" style={{ borderColor: "var(--th-border)" }}>
                <div className="flex items-center gap-1.5 font-bold text-sky-800 dark:text-sky-300">
                  <CheckCircle2 className="h-4 w-4 text-sky-600" />
                  <span>Verified Corporate Hiring Partner</span>
                </div>
                <p className="text-[11px] leading-relaxed" style={{ color: "var(--th-text-secondary)" }}>
                  Connected to State Skilling Mission portals with authorized direct requisition publishing, candidate matching, and automated EPFO return verification.
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--th-border)" }}>
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold transition hover:bg-slate-500/10"
              style={{ color: "var(--th-text-secondary)" }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
