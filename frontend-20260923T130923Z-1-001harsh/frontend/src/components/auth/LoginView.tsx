"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  ArrowRight,
  Shield,
  UserRound,
  Building2,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  Phone,
  Mail,
  Lock,
  RefreshCw
} from "lucide-react";
import { api, Session } from "@/lib/api";
import { StateDistrictFields } from "@/components/geo/StateDistrictFields";
import { SkillPulseMark } from "@/components/brand/SkillPulseMark";

export type AppRole = "admin" | "trainee" | "employer";

interface LoginViewProps {
  onLogin: (role: AppRole, identifier: string, password: string) => Promise<void>;
  onSession: (session: Session) => void;
  error?: string | null;
}

const ROLES: { id: AppRole; title: string; detail: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "admin", title: "Admin / Government", detail: "Monitor programmes & employment outcomes.", icon: Shield },
  { id: "trainee", title: "Trainee", detail: "Track your skills, career journey & opportunities.", icon: UserRound },
  { id: "employer", title: "Hiring Desk", detail: "Find skilled talent & manage hiring.", icon: Building2 }
];

const STATUSES = ["Employed", "Unemployed", "Self-Employed", "Apprenticeship", "Further Education", "Unknown"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onSession, error }) => {
  const [role, setRole] = useState<AppRole | null>("admin");
  const [identifier, setIdentifier] = useState("admin@skillpulse.in");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [mobile, setMobile] = useState("9800000001");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [traineeAuthMode, setTraineeAuthMode] = useState<"otp" | "password">("otp");
  const [registering, setRegistering] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    age: "21",
    state: "Bihar",
    district: "Patna",
    education: "ITI Technical Trade",
    programme: "Suryamitra Solar Technician",
    training_centre: "Patna Skill Centre",
    certification_status: "Certified",
    employment_status: "Unemployed",
    skills: [{ name: "Solar Installation", level: "Beginner" }]
  });

  const selected = ROLES.find((item) => item.id === role);

  const fillCredentials = (targetRole: AppRole) => {
    setRole(targetRole);
    setLocalError(null);
    if (targetRole === "admin") {
      setIdentifier("admin@skillpulse.in");
      setPassword("admin123");
    } else if (targetRole === "employer") {
      setIdentifier("employer@skillpulse.in");
      setPassword("employer123");
    } else if (targetRole === "trainee") {
      setMobile("9800000001");
      setIdentifier("SP-BR-10001");
      setPassword("trainee123");
      setOtp("123456");
    }
  };

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!role) return;
    setSubmitting(true);
    setLocalError(null);
    try {
      await onLogin(role, identifier.trim(), password);
    } catch (err: any) {
      setLocalError(err?.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendOtp = async () => {
    setSubmitting(true);
    setLocalError(null);
    try {
      await api.requestOtp(mobile);
      setOtpSent(true);
      setOtp("123456");
    } catch (err: any) {
      setLocalError(err?.message || "OTP could not be sent.");
    } finally {
      setSubmitting(false);
    }
  };

  const verify = async () => {
    setSubmitting(true);
    setLocalError(null);
    try {
      const result = await api.verifyOtp(mobile, otp);
      if (result.needs_registration) {
        setRegistering(true);
        setStep(1);
        return;
      }
      if (result.token) onSession(result);
    } catch (err: any) {
      setLocalError(err?.message || "OTP verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const finishRegistration = async () => {
    setSubmitting(true);
    setLocalError(null);
    try {
      const session = await api.registerTrainee({ ...form, phone: mobile, skills: form.skills.filter((item) => item.name.trim()) });
      onSession(session);
    } catch (err: any) {
      setLocalError(err?.message || "Registration could not be completed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen overflow-y-auto px-4 py-8 md:py-12 pb-24 transition-colors" style={{ backgroundColor: "var(--th-bg)", color: "var(--th-text)" }}>
      <div className="mx-auto w-full max-w-4xl">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex items-center justify-center">
            <SkillPulseMark className="h-14 w-14 rounded-2xl shadow-lg shadow-sky-900/20" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "var(--th-text)" }}>SkillPulse</h1>
            <span className="rounded-md bg-sky-600 px-2 py-0.5 text-xs font-bold text-white uppercase tracking-wider">
              AI
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium" style={{ color: "var(--th-text-secondary)" }}>
            Multimodal Workforce Intelligence & Career Outcome Verification Platform
          </p>
        </div>

        {/* Demo Credentials Showcase Card (Always Visible & Prominent) */}
        <div 
          className="gov-card p-4 sm:p-5 mb-8 border transition-all shadow-md"
          style={{
            backgroundColor: "var(--th-surface)",
            borderColor: "var(--th-card-border)",
            color: "var(--th-text)"
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3.5" style={{ borderColor: "var(--th-border)" }}>
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-sky-500" />
              <span className="text-xs sm:text-sm font-bold tracking-tight" style={{ color: "var(--th-text)" }}>
                Demo Credentials & Quick Sign-in
              </span>
            </div>
            <span className="text-[11px] font-semibold text-sky-500 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" /> Click any persona below to auto-fill
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Admin Credentials */}
            <div 
              onClick={() => fillCredentials("admin")}
              className={`cursor-pointer rounded-xl border p-3 transition-all hover:scale-[1.01] ${
                role === "admin" 
                  ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-500/10" 
                  : "border-slate-500/20 hover:border-slate-400 bg-slate-500/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: "var(--th-text)" }}>
                  <Shield className="h-3.5 w-3.5 text-sky-500" />
                  <span>Admin / Government</span>
                </div>
                {role === "admin" && <span className="text-[10px] font-bold text-sky-500">Active</span>}
              </div>
              <div className="mt-2 text-[11px] space-y-1" style={{ color: "var(--th-text-secondary)" }}>
                <div><span className="font-semibold text-slate-400">Email:</span> <span className="font-mono" style={{ color: "var(--th-text)" }}>admin@skillpulse.in</span></div>
                <div><span className="font-semibold text-slate-400">Password:</span> <span className="font-mono" style={{ color: "var(--th-text)" }}>admin123</span></div>
              </div>
              <button 
                type="button"
                className="mt-2.5 w-full rounded-lg py-1 px-2 text-[10px] font-bold transition flex items-center justify-center gap-1 bg-sky-500 text-white hover:bg-sky-600"
              >
                Auto-fill Admin
              </button>
            </div>

            {/* Trainee Credentials */}
            <div 
              onClick={() => fillCredentials("trainee")}
              className={`cursor-pointer rounded-xl border p-3 transition-all hover:scale-[1.01] ${
                role === "trainee" 
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/10" 
                  : "border-slate-500/20 hover:border-slate-400 bg-slate-500/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: "var(--th-text)" }}>
                  <UserRound className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Trainee</span>
                </div>
                {role === "trainee" && <span className="text-[10px] font-bold text-emerald-500">Active</span>}
              </div>
              <div className="mt-2 text-[11px] space-y-1" style={{ color: "var(--th-text-secondary)" }}>
                <div><span className="font-semibold text-slate-400">Mobile:</span> <span className="font-mono" style={{ color: "var(--th-text)" }}>9800000001</span> (OTP: 123456)</div>
                <div><span className="font-semibold text-slate-400">ID / Pass:</span> <span className="font-mono" style={{ color: "var(--th-text)" }}>SP-BR-10001 / trainee123</span></div>
              </div>
              <button 
                type="button"
                className="mt-2.5 w-full rounded-lg py-1 px-2 text-[10px] font-bold transition flex items-center justify-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Auto-fill Trainee
              </button>
            </div>

            {/* Employer Credentials */}
            <div 
              onClick={() => fillCredentials("employer")}
              className={`cursor-pointer rounded-xl border p-3 transition-all hover:scale-[1.01] ${
                role === "employer" 
                  ? "border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/10" 
                  : "border-slate-500/20 hover:border-slate-400 bg-slate-500/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs" style={{ color: "var(--th-text)" }}>
                  <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Hiring Desk</span>
                </div>
                {role === "employer" && <span className="text-[10px] font-bold text-indigo-500">Active</span>}
              </div>
              <div className="mt-2 text-[11px] space-y-1" style={{ color: "var(--th-text-secondary)" }}>
                <div><span className="font-semibold text-slate-400">Email:</span> <span className="font-mono" style={{ color: "var(--th-text)" }}>employer@skillpulse.in</span></div>
                <div><span className="font-semibold text-slate-400">Password:</span> <span className="font-mono" style={{ color: "var(--th-text)" }}>employer123</span></div>
              </div>
              <button 
                type="button"
                className="mt-2.5 w-full rounded-lg py-1 px-2 text-[10px] font-bold transition flex items-center justify-center gap-1 bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Auto-fill Hiring Desk
              </button>
            </div>
          </div>
        </div>

        {/* Role Tab Selector */}
        <div className="flex rounded-xl p-1 mb-6 border" style={{ backgroundColor: "var(--th-surface)", borderColor: "var(--th-border)" }}>
          {ROLES.map((item) => {
            const Icon = item.icon;
            const isActive = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setRole(item.id);
                  setLocalError(null);
                  if (item.id === "admin") {
                    setIdentifier("admin@skillpulse.in");
                    setPassword("admin123");
                  } else if (item.id === "employer") {
                    setIdentifier("employer@skillpulse.in");
                    setPassword("employer123");
                  } else if (item.id === "trainee") {
                    setMobile("9800000001");
                    setIdentifier("SP-BR-10001");
                    setPassword("trainee123");
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition ${
                  isActive
                    ? "bg-sky-600 text-white shadow-xs"
                    : "hover:bg-slate-500/10"
                }`}
                style={!isActive ? { color: "var(--th-text-secondary)" } : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Trainee Login Form */}
        {role === "trainee" && !registering && (
          <div 
            className="mx-auto max-w-md gov-card p-6 sm:p-7 border space-y-4 shadow-lg"
            style={{
              backgroundColor: "var(--th-surface)",
              borderColor: "var(--th-card-border)",
              color: "var(--th-text)"
            }}
          >
            <div>
              <h2 className="text-lg font-black tracking-tight" style={{ color: "var(--th-text)" }}>Trainee Sign-In</h2>
              <p className="mt-1 text-xs" style={{ color: "var(--th-text-secondary)" }}>
                Sign in with your registered mobile via simulated OTP, or using your SkillPulse ID.
              </p>
            </div>

            {/* Trainee Auth Mode Switcher */}
            <div className="flex rounded-lg border p-0.5 text-xs font-semibold" style={{ borderColor: "var(--th-border)", backgroundColor: "var(--th-bg)" }}>
              <button
                type="button"
                onClick={() => setTraineeAuthMode("otp")}
                className={`flex-1 py-1.5 rounded-md transition ${traineeAuthMode === "otp" ? "bg-sky-600 text-white" : ""}`}
                style={traineeAuthMode !== "otp" ? { color: "var(--th-text-secondary)" } : undefined}
              >
                Mobile + OTP
              </button>
              <button
                type="button"
                onClick={() => setTraineeAuthMode("password")}
                className={`flex-1 py-1.5 rounded-md transition ${traineeAuthMode === "password" ? "bg-sky-600 text-white" : ""}`}
                style={traineeAuthMode !== "password" ? { color: "var(--th-text-secondary)" } : undefined}
              >
                SkillPulse ID + Password
              </button>
            </div>

            {traineeAuthMode === "otp" ? (
              <div className="space-y-4">
                {/* Persistent Field Label: Mobile */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--th-text)" }}>
                    Phone Number
                  </label>
                  <p className="text-[11px] mb-1.5" style={{ color: "var(--th-text-muted)" }}>
                    Enter your 10-digit registered mobile number
                  </p>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--th-text-muted)" }} />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(event) => setMobile(event.target.value)}
                      className="w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500"
                      style={{
                        backgroundColor: "var(--th-input-bg)",
                        borderColor: "var(--th-input-border)",
                        color: "var(--th-text)"
                      }}
                      placeholder="Enter 10-digit mobile number (e.g. 9800000001)"
                    />
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--th-text)" }}>
                      One-Time Password (OTP)
                    </label>
                    <p className="text-[11px] mb-1.5" style={{ color: "var(--th-text-muted)" }}>
                      Enter the 6-digit simulated verification code (Demo code: 123456)
                    </p>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--th-text-muted)" }} />
                      <input
                        type="text"
                        value={otp}
                        onChange={(event) => setOtp(event.target.value)}
                        className="w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm font-mono font-bold tracking-widest transition focus:outline-none focus:ring-2 focus:ring-sky-500"
                        style={{
                          backgroundColor: "var(--th-input-bg)",
                          borderColor: "var(--th-input-border)",
                          color: "var(--th-text)"
                        }}
                        placeholder="Enter 6-digit code (123456)"
                      />
                    </div>
                  </div>
                )}

                {(localError || error) && (
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-500 font-medium">
                    {localError || error}
                  </div>
                )}

                {!otpSent ? (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={submitting || mobile.length < 10}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-sm font-bold text-white transition disabled:opacity-50 shadow-sm"
                  >
                    <span>{submitting ? "Sending OTP…" : "Request OTP"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={verify}
                    disabled={submitting || otp.length < 4}
                    className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-sm font-bold text-white transition disabled:opacity-50 shadow-sm"
                  >
                    {submitting ? "Verifying…" : "Verify and Continue"}
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={submitPassword} className="space-y-4">
                {/* Persistent Field Label: Trainee ID */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--th-text)" }}>
                    SkillPulse ID or Phone Number
                  </label>
                  <p className="text-[11px] mb-1.5" style={{ color: "var(--th-text-muted)" }}>
                    Enter your SkillPulse ID (e.g. SP-BR-10001) or phone number
                  </p>
                  <div className="relative">
                    <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--th-text-muted)" }} />
                    <input
                      required
                      type="text"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      className="w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500"
                      style={{
                        backgroundColor: "var(--th-input-bg)",
                        borderColor: "var(--th-input-border)",
                        color: "var(--th-text)"
                      }}
                      placeholder="SP-BR-10001"
                    />
                  </div>
                </div>

                {/* Persistent Field Label: Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--th-text)" }}>
                    Password
                  </label>
                  <p className="text-[11px] mb-1.5" style={{ color: "var(--th-text-muted)" }}>
                    Enter your trainee account password (Demo: trainee123)
                  </p>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--th-text-muted)" }} />
                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500"
                      style={{
                        backgroundColor: "var(--th-input-bg)",
                        borderColor: "var(--th-input-border)",
                        color: "var(--th-text)"
                      }}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {(localError || error) && (
                  <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-500 font-medium">
                    {localError || error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-sm font-bold text-white transition disabled:opacity-50 shadow-sm"
                >
                  {submitting ? "Signing in…" : "Sign In"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Admin & Employer Password Login Form */}
        {selected && role !== "trainee" && (
          <form 
            onSubmit={submitPassword} 
            className="mx-auto max-w-md gov-card p-6 sm:p-7 border space-y-4 shadow-lg"
            style={{
              backgroundColor: "var(--th-surface)",
              borderColor: "var(--th-card-border)",
              color: "var(--th-text)"
            }}
          >
            <div>
              <h2 className="text-lg font-black tracking-tight" style={{ color: "var(--th-text)" }}>{selected.title} Sign-In</h2>
              <p className="mt-1 text-xs" style={{ color: "var(--th-text-secondary)" }}>{selected.detail}</p>
            </div>

            {/* Persistent Field Label: Email Address */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--th-text)" }}>
                Email Address
              </label>
              <p className="text-[11px] mb-1.5" style={{ color: "var(--th-text-muted)" }}>
                Enter your authorized official email address
              </p>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--th-text-muted)" }} />
                <input
                  required
                  type="email"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500"
                  style={{
                    backgroundColor: "var(--th-input-bg)",
                    borderColor: "var(--th-input-border)",
                    color: "var(--th-text)"
                  }}
                  placeholder={role === "admin" ? "admin@skillpulse.in" : "employer@skillpulse.in"}
                />
              </div>
            </div>

            {/* Persistent Field Label: Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--th-text)" }}>
                Password
              </label>
              <p className="text-[11px] mb-1.5" style={{ color: "var(--th-text-muted)" }}>
                Enter your password
              </p>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--th-text-muted)" }} />
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-500"
                  style={{
                    backgroundColor: "var(--th-input-bg)",
                    borderColor: "var(--th-input-border)",
                    color: "var(--th-text)"
                  }}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {(localError || error) && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-500 font-medium">
                {localError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-sky-600 hover:bg-sky-500 py-3 text-sm font-bold text-white transition disabled:opacity-50 shadow-sm"
            >
              {submitting ? "Signing in…" : "Sign In to Command Centre"}
            </button>
          </form>
        )}

        {/* Trainee Self-Registration Modal Flow */}
        {role === "trainee" && registering && (
          <div 
            className="mx-auto max-w-lg gov-card p-6 border space-y-4 shadow-lg"
            style={{
              backgroundColor: "var(--th-surface)",
              borderColor: "var(--th-card-border)",
              color: "var(--th-text)"
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--th-text-muted)" }}>
              Registration step {step} of 4
            </p>
            {step === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold" style={{ color: "var(--th-text)" }}>
                <label className="block">
                  Full name
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium" />
                </label>
                <label className="block">
                  Age
                  <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium" />
                </label>
                <div className="sm:col-span-2">
                  <StateDistrictFields state={form.state} district={form.district} onChange={(state, district) => setForm({ ...form, state, district })} />
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="grid grid-cols-1 gap-3 text-xs font-bold" style={{ color: "var(--th-text)" }}>
                <label className="block">
                  Education
                  <input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium" />
                </label>
                <label className="block">
                  Training programme
                  <input value={form.programme} onChange={(e) => setForm({ ...form, programme: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium" />
                </label>
                <label className="block">
                  Training centre
                  <input value={form.training_centre} onChange={(e) => setForm({ ...form, training_centre: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium" />
                </label>
                <label className="block">
                  Certification
                  <input value={form.certification_status} onChange={(e) => setForm({ ...form, certification_status: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-medium" />
                </label>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-2">
                {form.skills.map((skill, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <input value={skill.name} onChange={(e) => { const skills = [...form.skills]; skills[index] = { ...skill, name: e.target.value }; setForm({ ...form, skills }); }} className="rounded-lg border px-3 py-2 text-xs" placeholder="Skill" />
                    <select value={skill.level} onChange={(e) => { const skills = [...form.skills]; skills[index] = { ...skill, level: e.target.value }; setForm({ ...form, skills }); }} className="rounded-lg border px-3 py-2 text-xs">
                      {LEVELS.map((level) => <option key={level}>{level}</option>)}
                    </select>
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, skills: [...form.skills, { name: "", level: "Beginner" }] })} className="text-xs font-bold text-sky-500">
                  + Add another skill
                </button>
              </div>
            )}
            {step === 4 && (
              <label className="block text-xs font-bold" style={{ color: "var(--th-text)" }}>
                Employment status
                <select value={form.employment_status} onChange={(e) => setForm({ ...form, employment_status: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm">
                  {STATUSES.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
            )}
            {(localError || error) && <p className="text-xs text-rose-500 font-medium">{localError || error}</p>}
            <div className="flex gap-2 pt-2">
              {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="rounded-lg border px-4 py-2 text-xs font-bold" style={{ borderColor: "var(--th-border)" }}>Back</button>}
              {step < 4 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500">Continue</button>
              ) : (
                <button type="button" onClick={finishRegistration} disabled={submitting || !form.name.trim()} className="rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50 hover:bg-sky-500">Create SkillPulse ID</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
