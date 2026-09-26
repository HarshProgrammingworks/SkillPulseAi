"use client";

import React, { useState } from "react";
import {
  Settings,
  Shield,
  Key,
  Server,
  UserCheck,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Save,
  HelpCircle,
  Palette
} from "lucide-react";
import { SkillPulseMark } from "@/components/brand/SkillPulseMark";
import { useTheme, THEMES, ThemeId } from "@/components/theme/ThemeProvider";

interface SettingsViewProps {
  aiStatus: { mode: string; has_key: boolean; key_masked: string; model: string };
  onUpdateAiKey: (key: string) => Promise<void>;
  userRole: string;
  onChangeRole: (role: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  aiStatus,
  onUpdateAiKey,
  userRole,
  onChangeRole
}) => {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateAiKey(apiKeyInput);
      setSaveSuccess(true);
      setApiKeyInput("");
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="gov-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold" style={{ color: "var(--th-text-secondary)" }}>Profile</span>
            <SkillPulseMark className="h-4 w-4" />
          </div>
          <div className="text-lg font-black" style={{ color: "var(--th-text)" }}>{userRole}</div>
          <p className="text-[11px]" style={{ color: "var(--th-text-muted)" }}>Signed-in SkillPulse AI session. Preferences stay on this device.</p>
        </div>

        {/* Backend API Status */}
        <div className="gov-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold" style={{ color: "var(--th-text-secondary)" }}>FastAPI Backend Engine</span>
            <Server className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-700">127.0.0.1:8000 Online</div>
          <p className="text-[11px]" style={{ color: "var(--th-text-muted)" }}>Longitudinal In-Memory SQLite &amp; Vector Store</p>
          <div className="pt-2 text-[10px] font-mono" style={{ color: "var(--th-text-muted)" }}>2000+ Active Synthetic Records</div>
        </div>

        {/* Active Persona RBAC */}
        <div className="gov-card p-4 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold" style={{ color: "var(--th-text-secondary)" }}>Current Role / Persona</span>
            <UserCheck className="h-4 w-4" style={{ color: "var(--th-accent)" }} />
          </div>
          <div className="text-lg font-black" style={{ color: "var(--th-text)" }}>{userRole}</div>
          <p className="text-[11px]" style={{ color: "var(--th-text-muted)" }}>Full Administrative &amp; Audit Rights</p>
          <div className="pt-2 text-[10px] font-medium" style={{ color: "var(--th-accent)" }}>Session: Authenticated</div>
        </div>
      </div>

      {/* ===== THEME SETTINGS ===== */}
      <div className="gov-card p-5 space-y-4" style={{ borderColor: "var(--th-card-border)" }}>
        <div className="border-b pb-3 flex items-center gap-2" style={{ borderColor: "var(--th-border)" }}>
          <Palette className="h-4 w-4" style={{ color: "var(--th-accent)" }} />
          <h3 className="text-sm font-bold" style={{ color: "var(--th-text)" }}>Theme</h3>
          <span className="ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ background: "var(--th-accent)", color: "#FFFFFF" }}>
            {THEMES.find((t) => t.id === theme)?.name || "Default"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {THEMES.map((t) => {
            const isActive = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className="group relative rounded-xl p-3 text-left transition-all duration-200"
                style={{
                  background: isActive ? "var(--th-accent)" : "var(--th-surface)",
                  border: `2px solid ${isActive ? "var(--th-accent)" : "var(--th-card-border)"}`,
                  color: isActive ? "#FFFFFF" : "var(--th-text)"
                }}
              >
                {/* Preview swatches */}
                <div className="flex gap-1.5 mb-2.5">
                  <span className="h-5 w-5 rounded-md border" style={{ background: t.preview.bg, borderColor: t.preview.accent + "40" }} />
                  <span className="h-5 w-5 rounded-md border" style={{ background: t.preview.surface, borderColor: t.preview.accent + "40" }} />
                  <span className="h-5 w-5 rounded-md" style={{ background: t.preview.accent }} />
                  <span className="h-5 w-5 rounded-md" style={{ background: t.preview.text }} />
                </div>
                <div className="text-xs font-bold">{t.name}</div>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ opacity: isActive ? 0.85 : 0.6 }}>{t.description}</p>
                {isActive && (
                  <CheckCircle2 className="absolute top-2 right-2 h-4 w-4" style={{ color: "#FFFFFF" }} />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-[11px]" style={{ color: "var(--th-text-muted)" }}>
          Your theme preference is saved locally and persists across page refreshes and sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          ["Notifications", "Follow-up reminders stay inside the prototype and can be dismissed from the bell."],
          ["Security", "Role sign-in separates trainee, employer, and admin records."],
          ["Preferences", "State and district filters remember the last selection for this session."],
          ["Data sharing", "Employers see recruitment fields. Contact details stay with the trainee and admin roles."]
        ].map(([title, body]) => (
          <div key={title} className="gov-card p-4" style={{ borderColor: "var(--th-card-border)" }}>
            <h3 className="text-sm font-bold" style={{ color: "var(--th-text)" }}>{title}</h3>
            <p className="mt-1 text-xs" style={{ color: "var(--th-text-secondary)" }}>{body}</p>
          </div>
        ))}
      </div>

      {/* Privacy-by-Design Architecture Blueprint (Section 15 & Slide 16 of SIH PDF) */}
      <div className="gov-card p-5 space-y-4" style={{ borderColor: "var(--th-card-border)" }}>
        <div className="border-b pb-3 flex items-center justify-between" style={{ borderColor: "var(--th-border)" }}>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-700" />
            <h3 className="text-sm font-bold" style={{ color: "var(--th-text)" }}>
              Privacy-by-Design Governance Principles (SIH 26135 Compliance)
            </h3>
          </div>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
            Zero-Trust Architectural Baseline
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-xl space-y-1" style={{ background: "var(--th-bg)", border: "1px solid var(--th-border)" }}>
            <strong className="font-bold block" style={{ color: "var(--th-text)" }}>1. Consent Management &amp; Opt-Out</strong>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--th-text-secondary)" }}>
              Every follow-up channel (WhatsApp, IVR, Web) provides explicit consent validation. Trainees can withdraw
              consent at any milestone, halting proactive outreach without affecting credential status.
            </p>
          </div>

          <div className="p-3 rounded-xl space-y-1" style={{ background: "var(--th-bg)", border: "1px solid var(--th-border)" }}>
            <strong className="font-bold block" style={{ color: "var(--th-text)" }}>2. Pseudonymous Trainee Identifiers</strong>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--th-text-secondary)" }}>
              Trainees are tracked via internal pseudonymous IDs (<code className="font-mono" style={{ color: "var(--th-text)" }}>TRN-2025-XXXX</code>).
              Aadhaar numbers are never collected or stored, preventing unauthorized identity correlation.
            </p>
          </div>

          <div className="p-3 rounded-xl space-y-1" style={{ background: "var(--th-bg)", border: "1px solid var(--th-border)" }}>
            <strong className="font-bold block" style={{ color: "var(--th-text)" }}>3. Handling Uncertainty as Valid Data</strong>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--th-text-secondary)" }}>
              If a candidate does not answer a 6-month check-in, the platform records{" "}
              <em>&quot;Employment status: Unknown&quot;</em> with the last verified date. It never falsely infers unemployment.
            </p>
          </div>

          <div className="p-3 rounded-xl space-y-1" style={{ background: "var(--th-bg)", border: "1px solid var(--th-border)" }}>
            <strong className="font-bold block" style={{ color: "var(--th-text)" }}>4. Data Minimization &amp; Role Separation</strong>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--th-text-secondary)" }}>
              Training providers and evaluators only access aggregate cohort performance metrics and masked contact
              tokens, preserving trainee privacy while assuring institutional accountability.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
