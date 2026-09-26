"use client";

import React, { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  Search,
  Bell,
  ShieldCheck,
  User,
  ChevronDown,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  LogOut
} from "lucide-react";
import { SkillPulseMark } from "@/components/brand/SkillPulseMark";

interface TopNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  aiStatus: { mode: string; has_key: boolean; key_masked: string };
  onOpenAiAssistant: () => void;
  onSearchSelectTrainee: (traineeId: string) => void;
  userRole: string;
  displayName?: string;
  onLogout?: () => void;
  onOpenProfile?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onNavigate,
  aiStatus,
  onOpenAiAssistant,
  onSearchSelectTrainee,
  userRole,
  displayName,
  onLogout,
  onOpenProfile
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{ trainees: any[]; skills: string[]; districts: string[]; jobs: any[] }>({ trainees: [], skills: [], districts: [], jobs: [] });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults({ trainees: [], skills: [], districts: [], jobs: [] });
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        setSearchResults(await api.searchAll(searchQuery.trim()));
      } catch {
        setSearchResults({ trainees: [], skills: [], districts: [], jobs: [] });
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setShowNotifications(false);
        setSearchOpen(false);
        setShowProfileMenu(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowNotifications(false);
        setSearchOpen(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Pre-configured mock alerts for the notification bell
  const notifications = [
    {
      id: "N1",
      title: "Conflicting Outcome Flagged",
      desc: "Trainee TRN-MH-2025-0014 reported employed, but Employer portal indicated contract lapsed.",
      time: "10 mins ago",
      type: "conflict",
      actionTab: "verification"
    },
    {
      id: "N2",
      title: "High Attrition Risk Alert",
      desc: "5 EV Diagnostics trainees placed in Chakan missed 60-day WhatsApp check-in.",
      time: "1 hour ago",
      type: "risk",
      actionTab: "followups"
    },
    {
      id: "N3",
      title: "New Job Demand Surge",
      desc: "180 EV Diagnostics vacancies registered by Tata Motors EV in Pune.",
      time: "3 hours ago",
      type: "opportunity",
      actionTab: "skillgap"
    }
  ];

  const formatTitle = (tab: string) => {
    switch (tab) {
      case "dashboard":
        return "Command Centre — Employment and Workforce Overview";
      case "trainees":
        return "Trainee Directory & Longitudinal Records";
      case "employers":
        return "Hiring Desk & Employer Requisitions";
      case "outcomes":
        return "Career Outcomes & Livelihood Analytics";
      case "followups":
        return "Follow-up Engine & Micro-Checkin Hub";
      case "skillgap":
        return "Skill Intelligence & Workforce Demand-Supply Radar";
      case "ai":
        return "AI-Assisted Policy Insights & Decision Support";
      case "reports":
        return "Executive Workforce Outcome Reports";
      case "quality":
        return "Data Quality & Multi-Verification Audit";
      case "verification":
        return "Independent Verification & Conflict Resolution";
      case "settings":
        return "Platform Settings & Privacy-by-Design";
      case "overview":
        return "Hiring Desk — Operations & Recruitment Overview";
      case "demand":
        return "Hiring Desk — Post Skill Demand";
      case "matches":
      case "matching":
        return "Hiring Desk — AI Candidate Matching";
      case "intelligence":
        return "Hiring Desk — Workforce & Skill Intelligence";
      case "pipeline":
        return "Hiring Desk — Talent Acquisition Pipeline";
      default:
        return "SkillPulse AI Platform";
    }
  };

  return (
    <header 
      ref={headerRef} 
      className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5 backdrop-blur sm:px-6 transition-colors"
      style={{
        backgroundColor: "var(--th-surface)",
        borderColor: "var(--th-border)",
        color: "var(--th-text)"
      }}
    >
      {/* Title & Badge */}
      <div className="min-w-0 flex-1 py-1">
        <h1 className="text-sm font-bold sm:text-base lg:text-lg leading-snug break-words" style={{ color: "var(--th-text)" }}>
          {formatTitle(currentTab)}
        </h1>
        <p className="mt-0.5 text-[11px] leading-normal hidden sm:block truncate" style={{ color: "var(--th-text-muted)" }}>
          SkillPulse AI • Maharashtra, Bihar, and Uttar Pradesh employment outcomes
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3 ml-auto">
        {/* Global Search Bar with Autocomplete Dropdown */}
        <div className="relative w-40 sm:w-56 2xl:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--th-text-muted)" }} />
            <input
              type="text"
              placeholder="Search candidate, trade, district..."
              value={searchQuery}
              onFocus={() => { setSearchOpen(true); setShowNotifications(false); }}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); setShowNotifications(false); }}
              className="w-full rounded-lg border pl-8 pr-7 py-1.5 text-xs transition focus:outline-none focus:ring-1 focus:ring-sky-500"
              style={{
                backgroundColor: "var(--th-input-bg)",
                borderColor: "var(--th-input-border)",
                color: "var(--th-text)"
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--th-text-muted)" }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete suggestions */}
          {searchOpen && searchQuery.length > 1 && (
            <div 
              className="absolute left-0 right-0 top-full mt-1.5 max-h-80 overflow-y-auto rounded-lg border p-1.5 shadow-xl z-50"
              style={{
                backgroundColor: "var(--th-surface)",
                borderColor: "var(--th-border)",
                color: "var(--th-text)"
              }}
            >
              {searching && <div className="px-2 py-2 text-xs" style={{ color: "var(--th-text-muted)" }}>Searching…</div>}
              {!searching && searchResults.trainees.length + searchResults.skills.length + searchResults.districts.length + searchResults.jobs.length === 0 && (
                <div className="px-2 py-2 text-xs" style={{ color: "var(--th-text-muted)" }}>No matching records found. Try changing your filters.</div>
              )}
              {searchResults.trainees.map((item) => (
                <button key={item.id} onClick={() => { onSearchSelectTrainee(item.id); setSearchQuery(""); setSearchOpen(false); }} className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-sky-500/10">
                  <span className="font-medium" style={{ color: "var(--th-text)" }}>{item.name}</span> <span style={{ color: "var(--th-text-muted)" }}>{item.skillpulse_id}</span>
                  <div className="text-[10px]" style={{ color: "var(--th-text-muted)" }}>{item.district}, {item.state}</div>
                </button>
              ))}
              {searchResults.skills.map((skill) => (
                <button key={skill} onClick={() => { onNavigate("skillgap"); setSearchOpen(false); }} className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-sky-500/10" style={{ color: "var(--th-text)" }}>Skill · {skill}</button>
              ))}
              {searchResults.jobs.map((job) => (
                <button key={job.id} onClick={() => { onNavigate("matches"); setSearchOpen(false); }} className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-sky-500/10" style={{ color: "var(--th-text)" }}>Role · {job.title} · {job.district}</button>
              ))}
              {searchResults.districts.map((district) => (
                <button key={district} onClick={() => { onNavigate("dashboard"); setSearchOpen(false); }} className="block w-full rounded-md px-2 py-1.5 text-left text-xs hover:bg-sky-500/10" style={{ color: "var(--th-text)" }}>District · {district}</button>
              ))}
            </div>
          )}
        </div>

        {/* SkillPulse AI status */}
        <button
          onClick={onOpenAiAssistant}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
            aiStatus.has_key
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              : "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20"
          }`}
          title="Ask SkillPulse AI"
        >
          <SkillPulseMark className="h-3.5 w-3.5" />
          <span className="hidden md:inline font-semibold">{aiStatus.mode}</span>
          <span className="md:hidden">Ask AI</span>
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setSearchOpen(false); }}
            className="relative rounded-lg p-2 transition hover:bg-slate-500/10"
            style={{ color: "var(--th-text-secondary)" }}
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            </span>
          </button>

          {/* Notifications Drawer */}
          {showNotifications && (
            <div 
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border p-3 shadow-2xl z-50"
              style={{
                backgroundColor: "var(--th-surface)",
                borderColor: "var(--th-border)",
                color: "var(--th-text)"
              }}
            >
              <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: "var(--th-border)" }}>
                <div className="flex items-center gap-1.5">
                  <Bell className="h-4 w-4" style={{ color: "var(--th-text)" }} />
                  <span className="text-xs font-bold" style={{ color: "var(--th-text)" }}>Workforce & Verification Alerts</span>
                </div>
                <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-500">
                  3 New
                </span>
              </div>
              <div className="mt-2 space-y-2">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      onNavigate(n.actionTab);
                      setShowNotifications(false);
                    }}
                    className="cursor-pointer rounded-lg border p-2.5 transition hover:bg-slate-500/5"
                    style={{ borderColor: "var(--th-border)" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 font-semibold text-xs" style={{ color: "var(--th-text)" }}>
                        {n.type === "conflict" && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
                        {n.type === "risk" && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        {n.type === "opportunity" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                        {n.title}
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--th-text-muted)" }}>{n.time}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-snug" style={{ color: "var(--th-text-secondary)" }}>{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Interactive Admin / User Menu */}
        <div className="relative border-l pl-2 sm:pl-3" style={{ borderColor: "var(--th-border)" }}>
          <button
            id="admin-profile-menu-button"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
                e.preventDefault();
                setShowProfileMenu(true);
              }
            }}
            className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
            aria-haspopup="true"
            aria-expanded={showProfileMenu}
            aria-label={`${userRole} menu`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-900 text-xs font-bold text-white shadow-xs shrink-0">
              {(displayName || userRole || "SK").slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left text-xs leading-tight">
              <div className="font-bold max-w-[130px] truncate" style={{ color: "var(--th-text)" }}>
                {displayName || (userRole === "Admin" ? "Dr. S. K. Roy" : userRole)}
              </div>
              <div className="text-[10px] font-medium" style={{ color: "var(--th-text-muted)" }}>
                {userRole}
              </div>
            </div>
            <ChevronDown
              className="h-3.5 w-3.5 transition-transform duration-200"
              style={{
                color: "var(--th-text-muted)",
                transform: showProfileMenu ? "rotate(180deg)" : "none"
              }}
            />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="admin-profile-menu-button"
              className="absolute right-0 top-full mt-2 w-56 sm:w-64 rounded-xl border p-2 shadow-2xl z-50 animate-fadeIn"
              style={{
                backgroundColor: "var(--th-surface)",
                borderColor: "var(--th-border)",
                color: "var(--th-text)"
              }}
            >
              {/* Profile Header */}
              <div className="p-2.5 border-b mb-1" style={{ borderColor: "var(--th-border)" }}>
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-900 text-xs font-bold text-white shrink-0">
                    {(displayName || userRole || "SK").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs truncate" style={{ color: "var(--th-text)" }}>
                      {displayName || (userRole === "Admin" ? "Dr. S. K. Roy" : userRole)}
                    </p>
                    <span className="inline-block rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] font-bold text-sky-600 mt-0.5">
                      {userRole} Account
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="space-y-1 text-xs" role="none">
                {/* Profile option */}
                <button
                  id="admin-profile-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onOpenProfile) {
                      onOpenProfile();
                    } else {
                      onNavigate("settings");
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium transition hover:bg-slate-500/10 text-left focus:outline-none focus:bg-slate-500/15"
                  style={{ color: "var(--th-text)" }}
                >
                  <User className="h-4 w-4" style={{ color: "var(--th-text-muted)" }} />
                  <span>Profile</span>
                </button>

                <div className="border-t my-1" style={{ borderColor: "var(--th-border)" }} />

                {/* Logout option */}
                <button
                  id="admin-logout-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setShowProfileMenu(false);
                    if (onLogout) {
                      onLogout();
                    }
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-bold text-rose-600 hover:bg-rose-500/10 transition text-left focus:outline-none focus:bg-rose-500/15"
                >
                  <LogOut className="h-4 w-4 text-rose-600" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
