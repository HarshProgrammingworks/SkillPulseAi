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
      console.error(
        `[SkillPulse API Fetch Failure] [${options?.method || "GET"}] ${fullUrl}\n` +
        `Error: ${err?.message || err}\n` +
        `Target Host: ${API_BASE_URL}\n` +
        `Ensure FastAPI backend is running and CORS is configured.`
      );
    }
    throw err;
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
  login: (role: Session["role"], identifier: string, password: string) =>
    fetchJson<Session>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ role, identifier, password })
    }),

  requestOtp: (mobile: string) => fetchJson<any>("/api/auth/otp", { method: "POST", body: JSON.stringify({ mobile }) }),
  verifyOtp: (mobile: string, otp: string) => fetchJson<Session>("/api/auth/otp/verify", { method: "POST", body: JSON.stringify({ mobile, otp }) }),
  registerTrainee: (payload: Record<string, unknown>) => fetchJson<Session>("/api/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  searchAll: (q: string) => fetchJson<any>(`/api/search?q=${encodeURIComponent(q)}`),
  listJobs: (params?: { district?: string; sector?: string; skill?: string }) => {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => { if (value && !value.startsWith("All")) query.append(key, value); });
    return fetchJson<{ items: any[] }>(`/api/jobs?${query.toString()}`);
  },
  createJob: (payload: Record<string, unknown>) => fetchJson<any>("/api/jobs", { method: "POST", body: JSON.stringify(payload) }),
  extractSkills: (description: string) => fetchJson<{ skills: string[]; source: string }>("/api/jobs/extract-skills", { method: "POST", body: JSON.stringify({ description }) }),
  listApplications: (stage?: string) => fetchJson<{ items: any[] }>(`/api/applications${stage ? `?stage=${encodeURIComponent(stage)}` : ""}`),
  applyToJob: (jobId: string) => fetchJson<any>("/api/applications", { method: "POST", body: JSON.stringify({ job_id: jobId }) }),
  moveApplication: (id: string, status: string) => fetchJson<any>(`/api/applications/${id}/stage`, { method: "POST", body: JSON.stringify({ status }) }),
  createEmployer: (payload: Record<string, unknown>) => fetchJson<any>("/api/employers", { method: "POST", body: JSON.stringify(payload) }),
  employerOverview: () => fetchJson<any>("/api/employers/overview"),
  recordOutcome: (payload: Record<string, unknown>) => fetchJson<any>("/api/employers/outcomes", { method: "POST", body: JSON.stringify(payload) }),
  dataQuality: () => fetchJson<any>("/api/quality"),
  geo: (params?: { state?: string; skill?: string }) => {
    const query = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => { if (value && !value.startsWith("All")) query.append(key, value); });
    return fetchJson<{ notice: string; items: any[] }>(`/api/geo?${query.toString()}`);
  },

  // Trainees
  createTrainee: (data: Record<string, unknown>) =>
    fetchJson<Trainee>("/api/trainees", { method: "POST", body: JSON.stringify(data) }),

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
    return fetchJson<{ total: number; page: number; page_size: number; total_pages: number; items: Trainee[] }>(
      `/api/trainees?${query.toString()}`
    );
  },

  exportTrainees: () => fetchJson<{ count: number; data: any[] }>("/api/trainees/export"),

  getTraineeById: (id: string) => fetchJson<Trainee>(`/api/trainees/${id}`),

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
    fetchJson<Trainee>(`/api/trainees/${id}/update-outcome`, {
      method: "POST",
      body: JSON.stringify(data)
    }),

  updateVerification: (
    id: string,
    data: {
      verification_status: VerificationStatus;
      notes?: string;
      verified_by?: string;
    }
  ) =>
    fetchJson<Trainee>(`/api/trainees/${id}/update-verification`, {
      method: "POST",
      body: JSON.stringify(data)
    }),

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
    return fetchJson<{ total: number; page: number; page_size: number; total_pages: number; summary: any; items: any[] }>(
      `/api/followups?${query.toString()}`
    );
  },

  completeFollowUp: (traineeId: string, payload: any) =>
    fetchJson<any>(`/api/followups/${traineeId}/complete`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),

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
    return fetchJson<DashboardKpis>(`/api/analytics/kpis?${query.toString()}`);
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
    return fetchJson<ChartDatasets>(`/api/analytics/charts?${query.toString()}`);
  },

  getFilters: () =>
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

  // SkillMap
  getSkillMapLayers: () => fetchJson<any[]>("/api/skillmap/layers"),
  getDistricts: () => fetchJson<DistrictInfo[]>("/api/skillmap/districts"),
  getDistrictDetails: (districtName: string) => fetchJson<DistrictDetail>(`/api/skillmap/district/${districtName}`),
  getMobilityFlows: () => fetchJson<any>("/api/skillmap/mobility-flows"),
  getSkillIntelligence: (params?: { district?: string; sector?: string; role?: string; skill?: string }) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v && !String(v).startsWith("All")) query.append(k, String(v));
      });
    }
    return fetchJson<any>(`/api/skillmap/intelligence?${query.toString()}`);
  },

  nextFollowUpQuestion: (traineeId: string, history: Array<{ role: string; content: string; topic?: string }>, stage?: string) =>
    fetchJson<any>("/api/followups/next-question", {
      method: "POST",
      body: JSON.stringify({ trainee_id: traineeId, stage, history })
    }),

  matchCandidates: (requirements: Record<string, unknown>) =>
    fetchJson<any>("/api/employers/match", { method: "POST", body: JSON.stringify(requirements) }),

  getEmployers: () => fetchJson<{ notice: string; items: any[] }>("/api/employers"),

  // Verification Summary
  getVerificationSummary: () => fetchJson<any>("/api/verification/summary"),
  getVerificationConflicts: () => fetchJson<any[]>("/api/verification/conflicts"),

  // AI & Gemini with Multi-turn Context and Grounding Support
  getAiStatus: () => fetchJson<{ mode: string; has_key: boolean; key_masked: string; model: string }>("/api/ai/status"),
  setAiKey: (apiKey: string) =>
    fetchJson<any>("/api/ai/set-key", {
      method: "POST",
      body: JSON.stringify({ api_key: apiKey })
    }),
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
    const askBody = {
      question,
      context_state: context?.state,
      context_district: context?.district,
      context_skill: context?.skill,
      context_programme: context?.programme,
      conversation_history: context?.conversation_history,
      dashboard_metrics: context?.dashboard_metrics,
      compare_trainee_ids: context?.compare_trainee_ids
    };

    let grounding: Record<string, unknown> | null = null;
    try {
      grounding = await fetchJson<Record<string, unknown>>("/api/ai/grounding", {
        method: "POST",
        body: JSON.stringify(askBody)
      });
    } catch (groundingError) {
      console.warn("Grounding lookup failed; the ask endpoint will rebuild it.", groundingError);
    }

    // 1. Try local server-side Next.js Gemini endpoint (/api/gemini)
    try {
      const geminiRes = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuestion: question,
          dashboardData: {
            ...(context?.dashboard_metrics || {}),
            grounding,
            selectedDistrict: context?.district || "All Districts",
            selectedSkill: context?.skill,
            selectedProgramme: context?.programme
          },
          context: {
            selectedDistrict: context?.district || "All Districts",
            selectedState: context?.state || "All States",
            selectedMetric: "Workforce & Skill Intelligence",
            activeFilters: {
              district: context?.district,
              skill: context?.skill,
              programme: context?.programme
            }
          },
          conversationHistory: context?.conversation_history,
          tone: context?.tone || "formal"
        })
      });

      if (geminiRes.ok) {
        return await geminiRes.json();
      }

      // If /api/gemini returned a structured error, inspect it
      const errJson = await geminiRes.json().catch(() => null);
      if (errJson?.error && !errJson.error.includes("temporarily unavailable")) {
        throw new Error(errJson.error);
      }
    } catch (e: any) {
      // If error was a specific key or user error, rethrow
      if (e.message && (e.message.includes("API key") || e.message.includes("rate limit"))) {
        throw e;
      }
      console.warn("Direct /api/gemini attempt fell through, querying backend /api/ai/ask:", e);
    }

    // 2. Query backend Python FastAPI endpoint (/api/ai/ask) as robust fallback
    return fetchJson<AiStructuredResponse>("/api/ai/ask", {
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
  },
  getAiInsights: (district?: string) => {
    const q = district && !district.startsWith("All ") ? `?district=${district}` : "";
    return fetchJson<AiInsightCard[]>(`/api/ai/insights${q}`);
  },
  explainSkillGap: (skillName: string, district?: string) =>
    fetchJson<AiStructuredResponse>(
      `/api/ai/explain-gap/${encodeURIComponent(skillName)}?district=${encodeURIComponent(district || "Pune")}`
    ),

  // Reports
  getReportTypes: () => fetchJson<any[]>("/api/reports/types"),
  generateReport: (params: { report_type: string; state?: string; district?: string; programme?: string; time_period?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchJson<ReportData>(`/api/reports/generate?${q}`);
  }
};
