"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  PhoneCall,
  MapPin,
  GitCompare,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  GraduationCap,
  X
} from "lucide-react";
import { SkillPulseMark } from "@/components/brand/SkillPulseMark";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  userRole: string;
  role: "admin" | "trainee" | "employer";
  displayName?: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  userRole,
  role,
  displayName,
  onLogout
}) => {
  const adminItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { id: "trainees", label: "Trainees", icon: Users, badge: null },
    { id: "employers", label: "Hiring Desk", icon: Briefcase, badge: null },
    { id: "outcomes", label: "Career Outcomes", icon: Briefcase, badge: null },
    { id: "followups", label: "Follow-ups", icon: PhoneCall, badge: null },
    { id: "skillgap", label: "Skill Intelligence", icon: GitCompare, badge: null },
    { id: "ai", label: "AI Insights", icon: SkillPulseMark, badge: "AI", aiBadge: true },
    { id: "reports", label: "Reports", icon: FileText, badge: null },
    { id: "verification", label: "Verification", icon: ShieldCheck, badge: null },
    { id: "quality", label: "Data Quality", icon: ShieldCheck, badge: null },
    { id: "settings", label: "Settings", icon: Settings, badge: null }
  ];
  const traineeItems = [
    { id: "home", label: "Home", icon: LayoutDashboard, badge: null },
    { id: "training", label: "Training", icon: GraduationCap, badge: null },
    { id: "skills", label: "My Skills", icon: GitCompare, badge: null },
    { id: "career", label: "Longitudinal Career Journey", icon: Briefcase, badge: null },
    { id: "jobs", label: "Find Jobs", icon: Briefcase, badge: null },
    { id: "gaps", label: "Skill Gaps", icon: GitCompare, badge: null },
    { id: "advisor", label: "Learn", icon: SkillPulseMark, badge: null },
    { id: "updates", label: "Updates", icon: PhoneCall, badge: null },
    { id: "profile", label: "Profile", icon: Users, badge: null },
    { id: "verify", label: "AI Verification", icon: ShieldCheck, badge: null }
  ];
  const employerItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, badge: null },
    { id: "demand", label: "Post Demand", icon: Briefcase, badge: null },
    { id: "matches", label: "AI Matches", icon: GitCompare, badge: null },
    { id: "intelligence", label: "Skill Intelligence", icon: MapPin, badge: null },
    { id: "pipeline", label: "Hiring Pipeline", icon: Briefcase, badge: null },
    { id: "outcomes", label: "Outcomes", icon: ShieldCheck, badge: null }
  ];
  const navItems = role === "trainee" ? traineeItems : role === "employer" ? employerItems : adminItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--th-surface)",
          borderColor: "var(--th-border)",
          color: "var(--th-text)",
        }}
      >
        {/* Brand Header */}
        <div 
          className="flex h-16 items-center justify-between border-b px-5"
          style={{ borderColor: "var(--th-border)" }}
        >
          <div className="flex items-center gap-3">
            <SkillPulseMark className="h-9 w-9 shadow-sm shadow-sky-900/20" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight" style={{ color: "var(--th-text)" }}>SkillPulse</span>
                <span className="rounded-md bg-sky-600 px-1.5 py-0.2 text-[10px] font-bold text-white uppercase tracking-wider">
                  AI
                </span>
              </div>
              <p className="text-[10px] font-medium tracking-tight" style={{ color: "var(--th-text-muted)" }}>Workforce Intelligence</p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1 hover:bg-slate-500/10 lg:hidden"
            style={{ color: "var(--th-text-muted)" }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div 
            className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--th-text-muted)" }}
          >
            Lifecycle Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-sky-900 text-white shadow-sm shadow-sky-900/20"
                    : "hover:bg-slate-500/10"
                }`}
                style={!isActive ? { color: "var(--th-text-secondary)" } : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 transition ${
                      isActive
                        ? "text-sky-300"
                        : "aiBadge" in item && item.aiBadge
                        ? "text-indigo-400 group-hover:text-indigo-300"
                        : "opacity-70 group-hover:opacity-100"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "aiBadge" in item && item.aiBadge
                        ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom User Profile, Role Switcher, and Logout */}
        <div 
          className="border-t p-3.5 space-y-2.5"
          style={{ 
            borderColor: "var(--th-border)",
            backgroundColor: "rgba(0,0,0,0.02)"
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-900 text-xs font-bold text-white shadow-xs">
                {(displayName || userRole).slice(0, 1)}
              </div>
              <div className="overflow-hidden">
                <div className="truncate text-xs font-bold" style={{ color: "var(--th-text)" }}>{displayName || "Signed in"}</div>
                <div className="truncate text-[10px]" style={{ color: "var(--th-text-muted)" }}>{userRole}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="rounded-lg p-1.5 hover:bg-rose-500/10 hover:text-rose-500 transition"
              style={{ color: "var(--th-text-muted)" }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div 
            className="rounded-lg border px-2 py-1.5 text-[10px] font-semibold"
            style={{ 
              borderColor: "var(--th-border)",
              backgroundColor: "var(--th-bg)",
              color: "var(--th-text-secondary)"
            }}
          >
            Access is limited to the signed-in role. Sign out to switch.
          </div>
        </div>
      </aside>
    </>
  );
};
