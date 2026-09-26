"use client";

import React, { useState, useEffect } from "react";
import { api, setAuthToken, Session } from "@/lib/api";
import {
  Trainee,
  DashboardKpis,
  ChartDatasets,
  DistrictInfo,
  DistrictDetail,
  AiStructuredResponse,
  AiInsightCard,
  ReportData,
  VerificationStatus,
  EmploymentStatus
} from "@/types";

// Layout components
import { TopNav } from "@/components/layout/TopNav";
import { Sidebar } from "@/components/layout/Sidebar";

// Auth
import { LoginView } from "@/components/auth/LoginView";
import { AddTraineeModal } from "@/components/trainees/AddTraineeModal";
import { TraineeWorkspace } from "@/components/roles/TraineeWorkspace";
import { EmployerWorkspace } from "@/components/roles/EmployerWorkspace";
import { DataQualityPanel } from "@/components/admin/OutcomePanels";
import { GEOGRAPHY, districtsFor, stateChosen } from "@/data/geography";
import { EmployersPanel } from "@/components/employers/EmployersPanel";
import { UserProfileModal } from "@/components/profile/UserProfileModal";

// Dashboard
import { FilterBar } from "@/components/dashboard/FilterBar";
import { KpiCardsGrid } from "@/components/dashboard/KpiCardsGrid";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

// Trainees & Career Journey
import { TraineeDirectoryTable } from "@/components/trainees/TraineeDirectoryTable";
import { TraineeCareerProfile } from "@/components/trainees/TraineeCareerProfile";

// Verification & Follow-up
import { VerificationPanel } from "@/components/verification/VerificationPanel";
import { FollowUpEngine } from "@/components/followup/FollowUpEngine";

// Skill Intelligence
import { SkillGapAnalysis } from "@/components/skillgap/SkillGapAnalysis";

// AI & Retention
import { AiInsightsDashboard } from "@/components/ai/AiInsightsDashboard";
import { AskSkillPulseModal } from "@/components/ai/AskSkillPulseModal";
import { RetentionRiskDashboard } from "@/components/retention/RetentionRiskDashboard";

// Reports & Settings
import { ReportsEngine } from "@/components/reports/ReportsEngine";
import { SettingsView } from "@/components/settings/SettingsView";

import { CheckCircle2, AlertCircle, X, Menu } from "lucide-react";
import { SkillPulseMark } from "@/components/brand/SkillPulseMark";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showAddTrainee, setShowAddTrainee] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [employerList, setEmployerList] = useState<{ employer: string; skill: string }[]>([]);

  // Active view tab
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Independent Dashboard Filter State (Longitudinal Intelligence filters)
  const [dashboardFilters, setDashboardFilters] = useState({
    state: "All States",
    district: "All Districts",
    programme: "All Programmes",
    batch: "All Batches",
    status: "All Statuses"
  });

  // Independent Training (Trainee) Filter State
  const [trainingFilters, setTrainingFilters] = useState({
    state: "All States",
    district: "All Districts",
    programme: "All Programmes",
    skill: "All Skills",
    batch: "All Batches",
    status: "All Statuses",
    timePeriod: "All Time"
  });

  // Independent Follow-up Filter State
  const [followupFilters, setFollowupFilters] = useState({
    state: "All States",
    district: "All Districts",
    status: "Pending",
    stage: "All Stages",
    channel: "All Channels",
    search: "",
    page: 1
  });
  const [followupsLoading, setFollowupsLoading] = useState(false);

  const [filterOptions, setFilterOptions] = useState<{
    states: string[];
    districts: string[];
    programmes: string[];
    skills: string[];
    statuses: string[];
    batches: string[];
    time_periods: string[];
  }>({
    states: ["All States", "Maharashtra", "Bihar", "Uttar Pradesh"],
    districts: ["All Districts", ...Object.values(GEOGRAPHY).flat()],
    programmes: [
      "All Programmes",
      "State Skilling Mission - Data Entry & Office Automation",
      "Suryamitra - Solar PV Installation & Maintenance",
      "Power Sector Skill Council - Domestic & Industrial Electrician",
      "MSSD - Electric Vehicle & Battery Diagnostics",
      "Retail Association - Retail Sales & Store Operations",
      "Telecom & Hardware Council - Field Technician & Maintenance"
    ],
    skills: [
      "All Skills",
      "Data Entry Operator",
      "Solar Technician",
      "Electrician",
      "EV Technician",
      "Retail Associate",
      "Field Technician"
    ],
    statuses: ["All Statuses", "Employed", "Self-Employed", "Apprenticeship", "Further Education", "Unemployed", "Unknown"],
    batches: ["All Batches", "2024-Q3", "2024-Q4", "2025-Q1", "2025-Q2"],
    time_periods: ["All Time", "Last 30 Days", "Last 90 Days", "Last 6 Months", "Last 1 Year"]
  });

  // Data states
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [chartsData, setChartsData] = useState<ChartDatasets | null>(null);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [totalTrainees, setTotalTrainees] = useState<number>(0);
  const [traineePage, setTraineePage] = useState<number>(1);
  const [traineeSearch, setTraineeSearch] = useState<string>("");
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);

  // Verification & Follow-up states
  const [verificationSummary, setVerificationSummary] = useState<any>({
    total_records: 260,
    verified_rate: 78.5,
    counts: {},
    conflict_count: 5,
    pending_count: 14
  });
  const [verificationConflicts, setVerificationConflicts] = useState<any[]>([]);
  const [followupsData, setFollowupsData] = useState<any>({
    total: 0,
    page: 1,
    summary: { pending: 18, completed: 86, overdue: 6, response_rate: 82.4 },
    items: []
  });

  // SkillMap states
  const [districtsInfo, setDistrictsInfo] = useState<DistrictInfo[]>([]);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>("Pune");
  const [districtDetail, setDistrictDetail] = useState<DistrictDetail | null>(null);
  const [mobilityFlows, setMobilityFlows] = useState<any>(null);

  // AI & Reports states
  const [aiStatus, setAiStatus] = useState({
    mode: "SkillPulse AI",
    has_key: false,
    key_masked: "Configured",
    model: "gemini-1.5-flash"
  });
  const [aiInsights, setAiInsights] = useState<AiInsightCard[]>([]);
  const [askAiOpen, setAskAiOpen] = useState<boolean>(false);
  const [initialAiQuestion, setInitialAiQuestion] = useState<string>("");
  const [reportTypes, setReportTypes] = useState<any[]>([]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Initial Data Fetching
  const loadInitialData = async () => {
    try {
      const [fOptions, kpiData, cData, aiStat, rTypes, dList, mobFlows, vSumm, vConf] = await Promise.all([
        api.getFilters().catch(() => filterOptions),
        api.getKpis({ district: dashboardFilters.district, state: dashboardFilters.state, programme: dashboardFilters.programme }).catch(() => null),
        api.getChartsData({ district: dashboardFilters.district, state: dashboardFilters.state, programme: dashboardFilters.programme }).catch(() => null),
        api.getAiStatus().catch(() => aiStatus),
        api.getReportTypes().catch(() => []),
        api.getDistricts().catch(() => []),
        api.getMobilityFlows().catch(() => null),
        api.getVerificationSummary().catch(() => verificationSummary),
        api.getVerificationConflicts().catch(() => [])
      ]);

      if (fOptions) setFilterOptions(fOptions as any);
      if (kpiData) setKpis(kpiData);
      if (cData) setChartsData(cData);
      if (aiStat) setAiStatus(aiStat);
      if (rTypes) setReportTypes(rTypes);
      if (dList && dList.length > 0) setDistrictsInfo(dList);
      if (mobFlows) setMobilityFlows(mobFlows);
      if (vSumm) setVerificationSummary(vSumm);
      if (vConf) setVerificationConflicts(vConf);

      // Load district details for Pune
      const dDetail = await api.getDistrictDetails("Pune").catch(() => null);
      if (dDetail) setDistrictDetail(dDetail);

      // Load AI insights for Pune
      const insights = await api.getAiInsights("Pune").catch(() => []);
      if (insights) setAiInsights(insights);

      // Load initial trainees with training filters
      loadTrainees();
      loadFollowups();
    } catch (e) {
      console.error("Initial load error:", e);
    }
  };

  const loadTrainees = async () => {
    try {
      const res = await api.getTrainees({
        district: trainingFilters.district,
        state: trainingFilters.state,
        programme: trainingFilters.programme,
        skill: trainingFilters.skill,
        status: trainingFilters.status,
        batch: trainingFilters.batch,
        search: traineeSearch,
        page: traineePage,
        page_size: 15
      });
      if (res) {
        setTrainees(res.items);
        setTotalTrainees(res.total);
      }
    } catch (e) {
      console.error("Error loading trainees:", e);
    }
  };

  const loadFollowups = async () => {
    setFollowupsLoading(true);
    try {
      const res = await api.getFollowUps({
        state: followupFilters.state,
        district: followupFilters.district,
        status: followupFilters.status,
        stage: followupFilters.stage,
        channel: followupFilters.channel,
        search: followupFilters.search,
        page: followupFilters.page,
        page_size: 15
      });
      if (res) setFollowupsData(res);
    } catch (e) {
      console.error("Error loading followups:", e);
    } finally {
      setFollowupsLoading(false);
    }
  };

  useEffect(() => {
    const raw = sessionStorage.getItem("skillpulse-session");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Session;
      setAuthToken(parsed.token);
      setSession(parsed);
      setCurrentTab(parsed.role === "trainee" ? "home" : parsed.role === "employer" ? "matching" : "dashboard");
    } catch {
      sessionStorage.removeItem("skillpulse-session");
    }
  }, []);

  // Prevent browser back-button access to authenticated dashboard after logout
  useEffect(() => {
    const handlePopState = () => {
      const raw = sessionStorage.getItem("skillpulse-session");
      if (!raw) {
        setAuthToken(null);
        setSession(null);
      }
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        const raw = sessionStorage.getItem("skillpulse-session");
        if (!raw) {
          setAuthToken(null);
          setSession(null);
        }
      }
    };
    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  // Initial load when admin session is established
  useEffect(() => {
    if (session?.role === "admin") loadInitialData();
  }, [session]);

  // Recalculate Dashboard data independently when dashboardFilters change
  useEffect(() => {
    if (!session || session.role !== "admin") return;
    const refreshDashboardData = async () => {
      try {
        const [kpiData, cData, insights] = await Promise.all([
          api.getKpis({
            district: dashboardFilters.district,
            state: dashboardFilters.state,
            programme: dashboardFilters.programme,
            batch: dashboardFilters.batch,
            status: dashboardFilters.status
          }),
          api.getChartsData({
            district: dashboardFilters.district,
            state: dashboardFilters.state,
            programme: dashboardFilters.programme,
            batch: dashboardFilters.batch
          }),
          api.getAiInsights(dashboardFilters.district)
        ]);
        if (kpiData) setKpis(kpiData);
        if (cData) setChartsData(cData);
        if (insights) setAiInsights(insights);
      } catch (e) {
        console.error("Dashboard filter refresh error:", e);
      }
    };
    refreshDashboardData();
  }, [
    session,
    dashboardFilters.state,
    dashboardFilters.district,
    dashboardFilters.programme,
    dashboardFilters.batch,
    dashboardFilters.status
  ]);

  // Reload Trainees independently when trainingFilters, search, or page change
  useEffect(() => {
    if (!session || session.role !== "admin") return;
    loadTrainees();
  }, [
    session,
    trainingFilters.state,
    trainingFilters.district,
    trainingFilters.programme,
    trainingFilters.skill,
    trainingFilters.batch,
    trainingFilters.status,
    trainingFilters.timePeriod,
    traineeSearch,
    traineePage
  ]);

  // Reload Follow-ups independently when followupFilters change
  useEffect(() => {
    if (!session || session.role !== "admin") return;
    loadFollowups();
  }, [
    session,
    followupFilters.state,
    followupFilters.district,
    followupFilters.status,
    followupFilters.stage,
    followupFilters.channel,
    followupFilters.search,
    followupFilters.page
  ]);

  // Handle District selection in SkillMap
  const handleSelectDistrictInMap = async (dName: string) => {
    setSelectedDistrictName(dName);
    try {
      const detail = await api.getDistrictDetails(dName);
      if (detail) setDistrictDetail(detail);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Outcome Update
  const handleUpdateOutcome = async (traineeId: string, updatedData: any) => {
    try {
      const updated = await api.updateOutcome(traineeId, updatedData);
      setSelectedTrainee(updated);
      showToast(`Longitudinal Outcome updated for candidate ${updated.name} (₹${updated.current_wage || 0}/mo)`);
      // Refresh KPIs and charts dynamically using dashboardFilters!
      const [kpiData, cData] = await Promise.all([
        api.getKpis({ district: dashboardFilters.district, state: dashboardFilters.state }),
        api.getChartsData({ district: dashboardFilters.district, state: dashboardFilters.state })
      ]);
      if (kpiData) setKpis(kpiData);
      if (cData) setChartsData(cData);
      loadTrainees();
    } catch (e) {
      console.error(e);
      showToast("Error updating outcome.");
    }
  };

  // Handle Verification Update
  const handleUpdateVerification = async (traineeId: string, status: VerificationStatus, notes: string) => {
    try {
      const updated = await api.updateVerification(traineeId, {
        verification_status: status,
        notes,
        verified_by: session?.display_name || "Admin"
      });
      setSelectedTrainee(updated);
      showToast(`Verification status updated to ${status}`);
      // Refresh verification summary & conflicts
      const [vSumm, vConf] = await Promise.all([
        api.getVerificationSummary(),
        api.getVerificationConflicts()
      ]);
      if (vSumm) setVerificationSummary(vSumm);
      if (vConf) setVerificationConflicts(vConf);
      loadTrainees();
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Follow-up Completion
  const handleCompleteFollowUp = async (traineeId: string, payload: any) => {
    try {
      await api.completeFollowUp(traineeId, payload);
      showToast(`Check-in logged via ${payload.channel_used || 'WhatsApp'} and added to Career Ledger!`);
      loadFollowups();
      loadTrainees();
      const kpiData = await api.getKpis({ district: dashboardFilters.district, state: dashboardFilters.state });
      if (kpiData) setKpis(kpiData);
    } catch (e) {
      console.error(e);
    }
  };

  // Settings no longer expose a model key. This remains for older callers.
  const handleUpdateAiKey = async (apiKey: string) => {
    const res = await api.setAiKey(apiKey);
    if (res && res.ai_status) {
      setAiStatus(res.ai_status);
      showToast("SkillPulse AI settings updated.");
    }
  };

  const handleOpenAskAi = (question?: string) => {
    setInitialAiQuestion(question || "");
    setAskAiOpen(true);
  };

  const signOut = () => {
    setAuthToken(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("skillpulse-session");
      localStorage.removeItem("skillpulse-session");
      localStorage.removeItem("skillpulse_token");
      window.history.replaceState({ loggedOut: true }, "", window.location.pathname);
      window.history.pushState({ loggedOut: true }, "", window.location.pathname);
    }
    setSession(null);
    setCurrentTab("dashboard");
    setSelectedTrainee(null);
  };

  if (!session) {
    return (
      <LoginView
        error={loginError}
        onSession={(next) => {
          setAuthToken(next.token);
          sessionStorage.setItem("skillpulse-session", JSON.stringify(next));
          setSession(next);
          setLoginError(null);
          setCurrentTab(next.role === "trainee" ? "home" : next.role === "employer" ? "overview" : "dashboard");
        }}
        onLogin={async (role, identifier, password) => {
          try {
            const next = await api.login(role, identifier, password);
            setAuthToken(next.token);
            sessionStorage.setItem("skillpulse-session", JSON.stringify(next));
            setSession(next);
            setLoginError(null);
            setCurrentTab(role === "trainee" ? "home" : role === "employer" ? "overview" : "dashboard");
          } catch (err: any) {
            setLoginError(err?.message || "Sign-in failed.");
            throw err;
          }
        }}
      />
    );
  }

  const roleLabel = session.role === "admin" ? "Admin" : session.role === "employer" ? "Hiring Desk" : "Trainee";

  return (
    <div className="flex h-full font-sans antialiased overflow-hidden" style={{ backgroundColor: "var(--th-bg)", color: "var(--th-text)" }}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedTrainee(null);
          setCurrentTab(tab);
        }}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        userRole={roleLabel}
        role={session.role}
        displayName={session.display_name}
        onLogout={signOut}
      />

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNav
          currentTab={currentTab}
          onNavigate={(tab) => {
            setSelectedTrainee(null);
            setCurrentTab(tab);
          }}
          aiStatus={aiStatus}
          onOpenAiAssistant={() => handleOpenAskAi()}
          onSearchSelectTrainee={async (traineeId) => {
            try {
              const t = await api.getTraineeById(traineeId);
              if (t) setSelectedTrainee(t);
            } catch (e) {
              console.error(e);
            }
          }}
          userRole={roleLabel}
          displayName={session.display_name}
          onLogout={signOut}
          onOpenProfile={() => setShowProfileModal(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Mobile drawer toggle */}
          <div className="flex lg:hidden items-center justify-between pb-2 border-b border-slate-200 no-print">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </button>
            <span className="text-xs font-bold text-slate-500 uppercase">{currentTab}</span>
          </div>

          {session.role === "trainee" && session.trainee_id && (
            <TraineeWorkspace
              traineeId={session.trainee_id}
              tab={currentTab}
              onAsk={(question, trainee) =>
                api.askAi(
                  `${question} Use this trainee profile and the multi-state (Bihar, Uttar Pradesh, Maharashtra) prototype data. Do not tell them they must relocate.`,
                  { district: trainee.district, compare_trainee_ids: [trainee.id] }
                )
              }
            />
          )}

          {session.role === "employer" && (
            <EmployerWorkspace
              tab={currentTab}
              onCompare={(leftId, rightId) => {
                handleOpenAskAi(`Compare trainees ${leftId} and ${rightId}.`);
              }}
            />
          )}

          {session.role === "admin" && currentTab === "employers" && <EmployersPanel />}

          {/* VIEW 1: Main Dashboard (Command Centre) */}
          {session.role === "admin" && currentTab === "dashboard" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Overview Banner - Fully Responsive with Zero Overlap */}
              <div className="gov-card p-5 bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-slate-900 leading-snug break-words">
                      Employment and Workforce Overview
                    </h2>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                      Three states
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                      Demonstration Prototype Data
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-3xl">
                    Longitudinal post-training outcomes, retention, wage bands, and skill demand across Maharashtra, Bihar, and Uttar Pradesh. Figures are synthetic demonstration data.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenAskAi("Which district has the largest skill gap in Maharashtra?")}
                    className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-xs"
                  >
                    <SkillPulseMark className="h-3.5 w-3.5" />
                    <span>Ask AI About Skills</span>
                  </button>
                </div>
              </div>

              {/* Dashboard Filter Bar */}
              <FilterBar
                filters={dashboardFilters}
                filterOptions={filterOptions}
                onChangeFilter={(k, v) => {
                  if (k === "state") {
                    setDashboardFilters((prev) => {
                      const keep = stateChosen(v) && districtsFor(v).includes(prev.district);
                      return { ...prev, state: v, district: keep ? prev.district : "All Districts" };
                    });
                  } else {
                    setDashboardFilters((prev) => ({ ...prev, [k]: v }));
                  }
                }}
                onResetFilters={() => {
                  setDashboardFilters({
                    state: "All States",
                    district: "All Districts",
                    programme: "All Programmes",
                    batch: "All Batches",
                    status: "All Statuses"
                  });
                }}
                matchedCount={typeof kpis?.total_trainees?.value === "number" ? kpis.total_trainees.value : Number(kpis?.total_trainees?.value) || 0}
              />

              {/* 9 KPI Cards */}
              {kpis && <KpiCardsGrid kpis={kpis} />}

              {/* 8 Interactive Charts */}
              {chartsData && (
                <DashboardCharts
                  chartsData={chartsData}
                  onSelectDistrict={(d) => {
                    setDashboardFilters((prev) => ({ ...prev, district: d }));
                    setSelectedDistrictName(d);
                  }}
                  onSelectSkill={() => {
                    setCurrentTab("skillgap");
                  }}
                />
              )}
            </div>
          )}

          {/* VIEW 2: Trainee Directory & Records */}
          {session.role === "admin" && currentTab === "trainees" && (
            <div className="space-y-6 animate-fadeIn">
              <TraineeDirectoryTable
                trainees={trainees}
                totalTrainees={totalTrainees}
                currentPage={traineePage}
                pageSize={15}
                totalPages={Math.ceil(totalTrainees / 15) || 1}
                onPageChange={(p) => setTraineePage(p)}
                onSelectTrainee={(t) => setSelectedTrainee(t)}
                onExport={async () => {
                  const exp = await api.exportTrainees();
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exp.data, null, 2));
                  const dlAnchor = document.createElement("a");
                  dlAnchor.setAttribute("href", dataStr);
                  dlAnchor.setAttribute("download", `SkillPulse_Trainees_Export_${new Date().toISOString().split("T")[0]}.json`);
                  document.body.appendChild(dlAnchor);
                  dlAnchor.click();
                  dlAnchor.remove();
                  showToast(`Exported ${exp.count} trainee records.`);
                }}
                searchQuery={traineeSearch}
                onSearchChange={(q) => {
                  setTraineeSearch(q);
                  setTraineePage(1);
                }}
                selectedDistrict={trainingFilters.district}
                selectedState={trainingFilters.state}
                onStateDistrictChange={(st, dist) => {
                  setTrainingFilters((prev) => ({ ...prev, state: st, district: dist }));
                  setTraineePage(1);
                }}
                onStateChange={(state) => {
                  setTrainingFilters((prev) => {
                    const keep = stateChosen(state) && districtsFor(state).includes(prev.district);
                    return { ...prev, state, district: keep ? prev.district : "All Districts" };
                  });
                  setTraineePage(1);
                }}
                onDistrictChange={(d) => {
                  setTrainingFilters((prev) => ({ ...prev, district: d }));
                  setTraineePage(1);
                }}
                selectedProgramme={trainingFilters.programme}
                onProgrammeChange={(p) => {
                  setTrainingFilters((prev) => ({ ...prev, programme: p }));
                  setTraineePage(1);
                }}
                selectedStatus={trainingFilters.status}
                onStatusChange={(s) => {
                  setTrainingFilters((prev) => ({ ...prev, status: s }));
                  setTraineePage(1);
                }}
                districtsList={filterOptions.districts}
                programmesList={filterOptions.programmes}
                onAddTrainee={() => setShowAddTrainee(true)}
              />
            </div>
          )}

          {/* VIEW 3: Career Outcomes & Livelihood Analytics */}
          {session.role === "admin" && currentTab === "outcomes" && chartsData && (
            <div className="space-y-6 animate-fadeIn">
              <div className="gov-card p-5 bg-white border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Post-Training Livelihood & Attrition Deep-Dive
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Longitudinal tracking beyond certification to identify why candidates succeed or drop out of formal jobs.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Outcome classification breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Outcome Classification (Verified Signals)
                    </h4>
                    {chartsData.outcomes_breakdown.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="font-semibold text-slate-800">{item.name}</span>
                        </div>
                        <strong className="font-bold text-slate-900">{item.value} candidates</strong>
                      </div>
                    ))}
                  </div>

                  {/* Reasons for Attrition */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Primary Root Causes of Attrition / Non-Placement
                    </h4>
                    {chartsData.attrition_reasons.map((att) => (
                      <div key={att.reason} className="p-2.5 rounded-lg bg-rose-50/40 border border-rose-100 text-xs">
                        <div className="flex justify-between font-bold text-slate-900 mb-1">
                          <span>{att.reason}</span>
                          <span className="text-rose-700">{att.pct}% of exits</span>
                        </div>
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                          <div style={{ width: `${att.pct * 2}%` }} className="h-full bg-rose-500 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: Follow-up Engine */}
          {session.role === "admin" && currentTab === "followups" && (
            <div className="space-y-6 animate-fadeIn">
              <FollowUpEngine
                followupsData={followupsData}
                onCompleteFollowUp={handleCompleteFollowUp}
                onSelectTraineeId={async (tId) => {
                  const t = await api.getTraineeById(tId);
                  if (t) setSelectedTrainee(t);
                }}
                selectedDistrict={followupFilters.district}
                selectedState={followupFilters.state}
                onStateDistrictChange={(st, dist) => {
                  setFollowupFilters((prev) => ({ ...prev, state: st, district: dist, page: 1 }));
                }}
                onStateChange={(state) => {
                  setFollowupFilters((prev) => {
                    const keep = stateChosen(state) && districtsFor(state).includes(prev.district);
                    return { ...prev, state, district: keep ? prev.district : "All Districts", page: 1 };
                  });
                }}
                onDistrictChange={(d) => {
                  setFollowupFilters((prev) => ({ ...prev, district: d, page: 1 }));
                }}
                districtsList={filterOptions.districts}
                activeStatus={followupFilters.status}
                onStatusChange={(status) => setFollowupFilters((prev) => ({ ...prev, status, page: 1 }))}
                selectedStage={followupFilters.stage}
                onStageChange={(stage) => setFollowupFilters((prev) => ({ ...prev, stage, page: 1 }))}
                selectedChannel={followupFilters.channel}
                onChannelChange={(channel) => setFollowupFilters((prev) => ({ ...prev, channel, page: 1 }))}
                searchQuery={followupFilters.search}
                onSearchChange={(search) => setFollowupFilters((prev) => ({ ...prev, search, page: 1 }))}
                currentPage={followupFilters.page}
                pageSize={15}
                totalPages={followupsData?.total_pages || Math.max(1, Math.ceil((followupsData?.total || 0) / 15))}
                onPageChange={(page) => setFollowupFilters((prev) => ({ ...prev, page }))}
                isLoading={followupsLoading}
              />
            </div>
          )}


          {/* VIEW 6: Skill Intelligence */}
          {session.role === "admin" && currentTab === "skillgap" && (
            <div className="space-y-6 animate-fadeIn">
              <SkillGapAnalysis
                onAskAiWhyGap={(sk) => {
                  handleOpenAskAi(`Why is there a critical skill gap in ${sk} in ${dashboardFilters.district} and what specific policy intervention should be taken?`);
                }}
              />
            </div>
          )}

          {/* VIEW 7: AI Insights */}
          {session.role === "admin" && currentTab === "ai" && (
            <div className="space-y-6 animate-fadeIn">
              <AiInsightsDashboard
                insights={aiInsights}
                aiStatus={aiStatus}
                onOpenAskAi={(q) => handleOpenAskAi(q)}
                onAskLive={(question, tone) =>
                  api.askAi(question, {
                    district: dashboardFilters.district,
                    programme: dashboardFilters.programme,
                    tone: tone || "formal"
                  })
                }
                selectedDistrict={dashboardFilters.district}
              />
            </div>
          )}

          {/* VIEW 8: Reports */}
          {session.role === "admin" && currentTab === "reports" && (
            <div className="space-y-6 animate-fadeIn">
              <ReportsEngine
                reportTypes={reportTypes}
                onGenerateReport={(params) => api.generateReport(params)}
                districtsList={filterOptions.districts}
                programmesList={filterOptions.programmes}
              />
            </div>
          )}

          {/* VIEW 9: Settings & Privacy-by-Design */}
          {session.role === "admin" && currentTab === "settings" && (
            <div className="space-y-6 animate-fadeIn">
              <SettingsView
                aiStatus={aiStatus}
                onUpdateAiKey={handleUpdateAiKey}
                userRole={roleLabel}
                onChangeRole={() => signOut()}
              />
            </div>
          )}

          {/* VIEW 10: Multi-Verification Audit Panel (accessible from nav/tour) */}
          {session.role === "admin" && currentTab === "quality" && (
            <div className="space-y-6 animate-fadeIn"><DataQualityPanel /></div>
          )}

          {session.role === "admin" && currentTab === "verification" && (
            <div className="space-y-6 animate-fadeIn">
              <VerificationPanel
                summary={verificationSummary}
                conflicts={verificationConflicts}
                onResolveConflict={async (tId, newStatus, notes) => {
                  await handleUpdateVerification(tId, newStatus, notes);
                }}
                onSelectTraineeId={async (tId) => {
                  const t = await api.getTraineeById(tId);
                  if (t) setSelectedTrainee(t);
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Trainee Career Profile Modal */}
      {selectedTrainee && (
        <TraineeCareerProfile
          trainee={selectedTrainee}
          onClose={() => setSelectedTrainee(null)}
          onUpdateOutcome={handleUpdateOutcome}
          onUpdateVerification={handleUpdateVerification}
        />
      )}

      {/* Ask SkillPulse AI Conversational Modal */}
      <AskSkillPulseModal
        isOpen={askAiOpen}
        onClose={() => setAskAiOpen(false)}
        onAsk={async (q, history, tone) => {
          return await api.askAi(q, {
            district: dashboardFilters.district,
            programme: dashboardFilters.programme,
            conversation_history: history,
            tone: tone || "formal",
            dashboard_metrics: {
              ...(kpis ? {
                employment_rate: kpis.employment_rate.value,
                avg_monthly_wage: kpis.avg_monthly_wage.value,
                retention_6m: kpis.retention_6m.value,
                skill_gap_rate: kpis.skill_gap_rate.value,
                total_trainees: kpis.total_trainees.value,
                certified_count: kpis.certified.value,
                employed_count: kpis.employed.value
              } : {}),
              top_skill_gaps: chartsData?.skill_gaps || [
                { skill: "EV Diagnostics", demand: 1850, supply: 820, gap: 1030 },
                { skill: "CNC Operation", demand: 1420, supply: 760, gap: 660 },
                { skill: "Cloud Support & Scripting", demand: 1600, supply: 980, gap: 620 },
                { skill: "Financial Operations", demand: 1250, supply: 840, gap: 410 },
                { skill: "Warehouse Operations", demand: 980, supply: 710, gap: 270 }
              ],
              job_demand_by_sector: chartsData?.job_demand || [
                { sector: "IT & Digital Services", openings: 4200, growth_yoy: "+28%" },
                { sector: "EV & Automotive Engineering", openings: 3450, growth_yoy: "+36%" },
                { sector: "Precision Manufacturing & Automation", openings: 2800, growth_yoy: "+22%" },
                { sector: "Banking & Financial Services (BFSI)", openings: 2650, growth_yoy: "+18%" }
              ],
              retention_funnel: chartsData?.retention_cohort || [
                { stage: "Placed (Baseline)", retention_pct: 100.0 },
                { stage: "3 Months", retention_pct: 86.2 },
                { stage: "6 Months", retention_pct: 74.8 },
                { stage: "12 Months", retention_pct: 63.4 }
              ]
            }
          });
        }}
        initialQuestion={initialAiQuestion}
        selectedDistrict={dashboardFilters.district}
      />

      {/* Floating Ask AI Button */}
      <button
        type="button"
        aria-label="Open SkillPulse AI assistant"
        title="Ask SkillPulse AI"
        onClick={() => handleOpenAskAi()}
        className="fixed bottom-6 right-6 z-[60] group flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 px-5 py-3.5 text-white shadow-xl ring-1 ring-white/10 transition-all duration-300 hover:shadow-2xl hover:scale-[1.04] hover:ring-sky-400/50 active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-sky-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-sky-300 transition-transform duration-300 group-hover:scale-110">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="text-sm font-bold tracking-wide">Ask AI</span>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-400"></span>
        </span>
      </button>

      {showAddTrainee && (
        <AddTraineeModal
          programmes={filterOptions.programmes}
          onClose={() => setShowAddTrainee(false)}
          onSubmit={async (payload) => {
            const created = await api.createTrainee(payload);
            setShowAddTrainee(false);
            showToast(`${created.name} was added to the trainee directory.`);
            loadTrainees();
          }}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-5 left-5 z-[55] flex max-w-sm items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-2xl border border-slate-700 animate-slideUp">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Role Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        role={session.role}
        session={session}
      />
    </div>
  );
}
