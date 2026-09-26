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
  EmploymentStatus,
  RetentionStatus
} from "@/types";
import { mockFallback } from "./mockFallback";

// Safe API Base URL Resolution supporting NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_API_URL
const resolveApiBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl !== "undefined" && envUrl !== "null" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "http://127.0.0.1:8000";
};

const API_BASE_URL = resolveApiBaseUrl();

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  const fullUrl = `${API_BASE_URL}${cleanPath}`;
  
  // Safe header merging: spread options first, then ensure required headers are retained
  const customHeaders = (options?.headers as Record<string, string>) || {};
  const mergedHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...customHeaders
  };

  try {
    const res = await fetch(fullUrl, {
      ...options,
      headers: mergedHeaders
    });
    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      let message = "";
      try {
        const parsed = JSON.parse(errorText);
        message = parsed.detail || parsed.message || "";
      } catch {}
      throw new Error(message || errorText || `API HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[SkillPulse API Fetch Failure] [${options?.method || "GET"}] ${fullUrl}\n` +
        `Error: ${err?.message || err}\n` +
        `Fallback engaged for static/prototype deployment.`
      );
    }
    throw err;
  }
}

const shouldCallNetwork = (): boolean => {
  if (typeof window === "undefined") return true;
  const isHttps = window.location.protocol === "https:";
  const isLocalHttp = API_BASE_URL.startsWith("http://127.0.0.1") || API_BASE_URL.startsWith("http://localhost");
  // If running in browser on HTTPS (such as GitHub Pages) and backend is an insecure localhost URL,
  // browsers block it as Mixed Content. Return false to use prototype fallback instantly.
  if (isHttps && isLocalHttp) {
    return false;
  }
  return true;
};

async function withFallback<T>(apiCall: () => Promise<T>, fallbackCall: () => T | Promise<T>): Promise<T> {
  if (!shouldCallNetwork()) {
    return await fallbackCall();
  }
  try {
    return await apiCall();
  } catch (err) {
    return await fallbackCall();
  }
}

export interface Session {
  token: string;
  role: "admin" | "trainee" | "employer";
  display_name: string;
  identifier: string;
  trainee_id?: string;
  skillpulse_id?: string;
  needs_registration?: boolean;
}

export const api = {
  login: async (role: Session["role"], identifier: string, password: string): Promise<Session> => {
    return withFallback(
      () =>
        fetchJson<Session>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ role, identifier, password })
        }),
      () => mockFallback.login(role, identifier, password) as Session
    );
  },

  requestOtp: (mobile: string) =>
    withFallback(
      () => fetchJson<any>("/api/auth/otp", { method: "POST", body: JSON.stringify({ mobile }) }),
      () => mockFallback.requestOtp(mobile)
    ),

  verifyOtp: (mobile: string, otp: string) =>
    withFallback(
      () => fetchJson<Session>("/api/auth/otp/verify", { method: "POST", body: JSON.stringify({ mobile, otp }) }),
      () => mockFallback.verifyOtp(mobile, otp) as Session
    ),

  registerTrainee: (payload: Record<string, unknown>) =>
    withFallback(
      () => fetchJson<Session>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
      () => mockFallback.registerTrainee(payload) as Session
    ),

  searchAll: (q: string) =>
    withFallback(
      () => fetchJson<any>(`/api/search?q=${encodeURIComponent(q)}`),
      () => ({ items: [] })
    ),

  listJobs: (params?: { district?: string; sector?: string; skill?: string }) => {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => { if (value && !value.startsWith("All")) query.append(key, value); });
    return withFallback(
      () => fetchJson<{ items: any[] }>(`/api/jobs?${query.toString()}`),
      () => mockFallback.listJobs()
    );
  },

  createJob: (payload: Record<string, unknown>) =>
    withFallback(
      () => fetchJson<any>("/api/jobs", { method: "POST", body: JSON.stringify(payload) }),
      () => ({ ok: true, job: payload })
    ),

  extractSkills: (description: string) =>
    withFallback(
      () => fetchJson<{ skills: string[]; source: string }>("/api/jobs/extract-skills", { method: "POST", body: JSON.stringify({ description }) }),
      () => ({ skills: ["Skill Matching", "Technical Competency"], source: "SkillPulse Intelligent Extractor" })
    ),

  listApplications: (stage?: string) =>
    withFallback(
      () => fetchJson<{ items: any[] }>(`/api/applications${stage ? `?stage=${encodeURIComponent(stage)}` : ""}`),
      () => mockFallback.listApplications()
    ),

  applyToJob: (jobId: string) =>
    withFallback(
      () => fetchJson<any>("/api/applications", { method: "POST", body: JSON.stringify({ job_id: jobId }) }),
      () => ({ ok: true, application_id: "APP-" + Date.now() })
    ),

  moveApplication: (id: string, status: string) =>
    withFallback(
      () => fetchJson<any>(`/api/applications/${id}/stage`, { method: "POST", body: JSON.stringify({ status }) }),
      () => ({ ok: true, id, status })
    ),

  createEmployer: (payload: Record<string, unknown>) =>
    withFallback(
      () => fetchJson<any>("/api/employers", { method: "POST", body: JSON.stringify(payload) }),
      () => ({ ok: true })
    ),

  employerOverview: () =>
    withFallback(
      () => fetchJson<any>("/api/employers/overview"),
      () => mockFallback.employerOverview()
    ),

  recordOutcome: (payload: Record<string, unknown>) =>
    withFallback(
      () => fetchJson<any>("/api/employers/outcomes", { method: "POST", body: JSON.stringify(payload) }),
      () => ({ ok: true })
    ),

  dataQuality: () =>
    withFallback(
      () => fetchJson<any>("/api/quality"),
      () => ({ completeness: 98.2, accuracy: 96.4, timeliness: 94.8 })
    ),

  geo: (params?: { state?: string; skill?: string }) => {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => { if (value && !value.startsWith("All")) query.append(key, value); });
    return withFallback(
      () => fetchJson<{ notice: string; items: any[] }>(`/api/geo?${query.toString()}`),
      () => ({ notice: "Geo intelligence fallback", items: [] })
    );
  },

  // Trainees
  createTrainee: (data: Record<string, unknown>) =>
    withFallback(
      () => fetchJson<Trainee>("/api/trainees", { method: "POST", body: JSON.stringify(data) }),
      () => ({ ...(mockFallback.getTrainees().items[0] || {}), ...(data as any), id: "SP-TR-" + Date.now() } as Trainee)
    ),

  getTrainees: (params?: {
    district?: string;
    state?: string;
    programme?: string;
    skill?: string;
    status?: string;
    verification?: string;
    batch?: string;
    risk?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== "All" && !String(v).startsWith("All ")) {
          query.append(k, String(v));
        }
      });
    }
    return withFallback(
      () => fetchJson<{ total: number; page: number; page_size: number; total_pages: number; items: Trainee[] }>(
        `/api/trainees?${query.toString()}`
      ),
      () => mockFallback.getTrainees(params)
    );
  },

  exportTrainees: () =>
    withFallback(
      () => fetchJson<{ count: number; data: any[] }>("/api/trainees/export"),
      () => ({ count: mockFallback.getTrainees().items.length, data: mockFallback.getTrainees().items })
    ),

  getTraineeById: (id: string) =>
    withFallback(
      () => fetchJson<Trainee>(`/api/trainees/${id}`),
      () => mockFallback.getTraineeById(id) as Trainee
    ),

  updateOutcome: (
    id: string,
    data: {
      employment_status: EmploymentStatus;
      employer?: string;
      job_role?: string;
      current_wage?: number;
      joining_date?: string;
      current_location?: string;
      skill_relevance?: string;
      retention_status?: RetentionStatus;
      reason_for_leaving?: string;
    }
  ) =>
    withFallback(
      () =>
        fetchJson<Trainee>(`/api/trainees/${id}/update-outcome`, {
          method: "POST",
          body: JSON.stringify(data)
        }),
      () => ({ ...(mockFallback.getTraineeById(id) || {}), ...data } as Trainee)
    ),

  updateVerification: (
    id: string,
    data: {
      verification_status: VerificationStatus;
      notes?: string;
      verified_by?: string;
    }
  ) =>
    withFallback(
      () =>
        fetchJson<Trainee>(`/api/trainees/${id}/update-verification`, {
          method: "POST",
          body: JSON.stringify(data)
        }),
      () => ({ ...(mockFallback.getTraineeById(id) || {}), ...data } as Trainee)
    ),

  // Follow-ups
  getFollowUps: (params?: { status?: string; stage?: string; channel?: string; district?: string; state?: string; search?: string; page?: number; page_size?: number }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && !String(v).startsWith("All ") && v !== "All") {
          query.append(k, String(v));
        }
      });
    }
    return withFallback(
      () =>
        fetchJson<{ total: number; page: number; page_size: number; total_pages: number; summary: any; items: any[] }>(
          `/api/followups?${query.toString()}`
        ),
      () => mockFallback.getFollowUps(params)
    );
  },

  completeFollowUp: (traineeId: string, payload: any) =>
    withFallback(
      () =>
        fetchJson<any>(`/api/followups/${traineeId}/complete`, {
          method: "POST",
          body: JSON.stringify(payload)
        }),
      () => ({ ok: true, trainee_id: traineeId })
    ),

  // Analytics
  getKpis: (params?: { district?: string; state?: string; programme?: string; skill?: string; batch?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== "All" && !String(v).startsWith("All ")) {
          query.append(k, String(v));
        }
      });
    }
    return withFallback(
      () => fetchJson<DashboardKpis>(`/api/analytics/kpis?${query.toString()}`),
      () => mockFallback.getKpis(params)
    );
  },

  getChartsData: (params?: { district?: string; state?: string; programme?: string; skill?: string; batch?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== "All" && !String(v).startsWith("All ")) {
          query.append(k, String(v));
        }
      });
    }
    return withFallback(
      () => fetchJson<ChartDatasets>(`/api/analytics/charts?${query.toString()}`),
      () => mockFallback.getChartsData(params)
    );
  },

  getFilters: () =>
    withFallback(
      () =>
        fetchJson<{
          states: string[];
          districts: string[];
          programmes: string[];
          skills: string[];
          statuses: string[];
          verifications: string[];
          batches: string[];
          time_periods: string[];
        }>("/api/analytics/filters"),
      () => mockFallback.getFilters()
    ),

  // SkillMap
  getSkillMapLayers: () =>
    withFallback(
      () => fetchJson<any[]>("/api/skillmap/layers"),
      () => mockFallback.getSkillMapLayers()
    ),

  getDistricts: () =>
    withFallback(
      () => fetchJson<DistrictInfo[]>("/api/skillmap/districts"),
      () => mockFallback.getDistricts()
    ),

  getDistrictDetails: (districtName: string) =>
    withFallback(
      () => fetchJson<DistrictDetail>(`/api/skillmap/district/${districtName}`),
      () => mockFallback.getDistrictDetails(districtName)
    ),

  getMobilityFlows: () =>
    withFallback(
      () => fetchJson<any>("/api/skillmap/mobility-flows"),
      () => mockFallback.getMobilityFlows()
    ),

  getSkillIntelligence: (params?: { district?: string; sector?: string; role?: string; skill?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v && !String(v).startsWith("All")) query.append(k, String(v));
      });
    }
    return withFallback(
      () => fetchJson<any>(`/api/skillmap/intelligence?${query.toString()}`),
      () => mockFallback.getSkillIntelligence(params)
    );
  },

  nextFollowUpQuestion: (traineeId: string, history: Array<{ role: string; content: string; topic?: string }>, stage?: string) =>
    withFallback(
      () =>
        fetchJson<any>("/api/followups/next-question", {
          method: "POST",
          body: JSON.stringify({ trainee_id: traineeId, stage, history })
        }),
      () => ({
        question: "Could you confirm your current monthly take-home salary and if you are receiving regular wage slips?",
        topic: "Wage Verification"
      })
    ),

  matchCandidates: (requirements: Record<string, unknown>) =>
    withFallback(
      () => fetchJson<any>("/api/employers/match", { method: "POST", body: JSON.stringify(requirements) }),
      () => ({ matches: mockFallback.getTrainees().items.slice(0, 5) })
    ),

  getEmployers: () =>
    withFallback(
      () => fetchJson<{ notice: string; items: any[] }>("/api/employers"),
      () => ({ notice: "Employer list", items: [] })
    ),

  // Verification Summary
  getVerificationSummary: () =>
    withFallback(
      () => fetchJson<any>("/api/verification/summary"),
      () => mockFallback.getVerificationSummary()
    ),

  getVerificationConflicts: () =>
    withFallback(
      () => fetchJson<any[]>("/api/verification/conflicts"),
      () => mockFallback.getVerificationConflicts()
    ),

  resolveConflict: (id: string, resolution: any) =>
    withFallback(
      () => fetchJson<any>(`/api/verification/resolve/${id}`, { method: "POST", body: JSON.stringify(resolution) }),
      () => ({ ok: true, id })
    ),

  // AI & Gemini with Multi-turn Context and Grounding Support
  getAiStatus: () =>
    withFallback(
      () => fetchJson<{ mode: string; has_key: boolean; key_masked: string; model: string }>("/api/ai/status"),
      () => mockFallback.getAiStatus()
    ),

  setAiKey: (apiKey: string) =>
    withFallback(
      () =>
        fetchJson<any>("/api/ai/set-key", {
          method: "POST",
          body: JSON.stringify({ api_key: apiKey })
        }),
      () => ({ status: "Saved", key_masked: "••••••••" })
    ),

  askAi: async (
    question: string,
    context?: {
      state?: string;
      district?: string;
      skill?: string;
      programme?: string;
      conversation_history?: Array<{ role: string; content: string }>;
      dashboard_metrics?: Record<string, any>;
      compare_trainee_ids?: string[];
      tone?: "formal" | "friendly";
    }
  ): Promise<AiStructuredResponse> => {
    try {
      return await fetchJson<AiStructuredResponse>("/api/ai/ask", {
        method: "POST",
        body: JSON.stringify({
          question,
          context_district: context?.district,
          context_skill: context?.skill,
          context_programme: context?.programme,
          conversation_history: context?.conversation_history,
          dashboard_metrics: context?.dashboard_metrics,
          compare_trainee_ids: context?.compare_trainee_ids,
          tone: context?.tone || "formal"
        })
      });
    } catch {
      return mockFallback.askAi(question, context);
    }
  },

  getAiInsights: (district?: string) => {
    const q = district && !district.startsWith("All ") ? `?district=${district}` : "";
    return withFallback(
      () => fetchJson<AiInsightCard[]>(`/api/ai/insights${q}`),
      () => mockFallback.getAiInsights(district)
    );
  },

  explainSkillGap: (skillName: string, district?: string) =>
    withFallback(
      () =>
        fetchJson<AiStructuredResponse>(
          `/api/ai/explain-gap/${encodeURIComponent(skillName)}?district=${encodeURIComponent(district || "Pune")}`
        ),
      () => mockFallback.askAi(`Explain skill gap for ${skillName} in ${district || "Pune"}`)
    ),

  // Reports
  getReportTypes: () =>
    withFallback(
      () => fetchJson<any[]>("/api/reports/types"),
      () => mockFallback.getReportTypes()
    ),

  generateReport: (params: { report_type: string; state?: string; district?: string; programme?: string; time_period?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return withFallback(
      () => fetchJson<ReportData>(`/api/reports/generate?${q}`),
      () =>
        ({
          id: "REP-" + Date.now(),
          title: `${params.report_type || "Longitudinal Intelligence"} Report`,
          created_at: new Date().toISOString(),
          summary: "Comprehensive multi-cohort evaluation report with longitudinal employment and verification milestones.",
          metrics: mockFallback.getKpis(),
          sections: []
        } as any)
    );
  }
};
