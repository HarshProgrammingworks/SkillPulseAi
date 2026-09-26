import mockDataRaw from "@/data/mockApiData.json";
import {
  Trainee,
  DashboardKpis,
  ChartDatasets,
  DistrictInfo,
  DistrictDetail,
  AiStructuredResponse
} from "@/types";

const mockData = mockDataRaw as any;

export interface FallbackSession {
  token: string;
  role: "admin" | "trainee" | "employer";
  display_name: string;
  identifier: string;
  trainee_id?: string;
  skillpulse_id?: string;
  needs_registration?: boolean;
}

export const mockFallback = {
  login: (role: "admin" | "trainee" | "employer", identifier: string, password?: string): FallbackSession => {
    const id = (identifier || "").trim().toLowerCase();

    if (role === "admin") {
      return {
        token: "demo-admin-token-" + Date.now(),
        role: "admin",
        display_name: "Dr. S. K. Roy",
        identifier: "admin@skillpulse.in"
      };
    }

    if (role === "employer") {
      return {
        token: "demo-employer-token-" + Date.now(),
        role: "employer",
        display_name: "Hiring Desk",
        identifier: "employer@skillpulse.in"
      };
    }

    // Trainee persona
    const foundTrainee = mockData.trainees_page1?.items?.find((t: any) =>
      (t.id && t.id.toLowerCase() === id) ||
      (t.skillpulse_id && t.skillpulse_id.toLowerCase() === id) ||
      (t.phone && t.phone.includes(id)) ||
      (t.email && t.email.toLowerCase() === id)
    ) || mockData.trainees_page1?.items?.[0];

    return {
      token: "demo-trainee-token-" + Date.now(),
      role: "trainee",
      display_name: foundTrainee?.name || "Aarav Sharma",
      identifier: foundTrainee?.id || "SP-BR-10001",
      trainee_id: foundTrainee?.id || "SP-BR-10001",
      skillpulse_id: foundTrainee?.skillpulse_id || "SP-BR-10001"
    };
  },

  requestOtp: (mobile: string) => {
    return {
      sent: true,
      simulated: true,
      provider_note: "Prototype OTP (Use code 123456)",
      demo_otp: "123456",
      exists: true,
      skillpulse_id: "SP-BR-10001"
    };
  },

  verifyOtp: (mobile: string, otp: string): FallbackSession => {
    return {
      token: "demo-trainee-token-" + Date.now(),
      role: "trainee",
      display_name: "Aarav Sharma",
      identifier: "SP-BR-10001",
      trainee_id: "SP-BR-10001",
      skillpulse_id: "SP-BR-10001",
      needs_registration: false
    };
  },

  registerTrainee: (payload: any): FallbackSession => {
    return {
      token: "demo-trainee-token-" + Date.now(),
      role: "trainee",
      display_name: payload.name || "Aarav Sharma",
      identifier: "SP-BR-10001",
      trainee_id: "SP-BR-10001",
      skillpulse_id: "SP-BR-10001"
    };
  },

  getFilters: () => {
    return mockData.filters;
  },

  getKpis: (params?: { district?: string; state?: string; programme?: string }): DashboardKpis => {
    if (params?.district && mockData.kpis_by_district?.[params.district]) {
      return mockData.kpis_by_district[params.district];
    }
    return mockData.kpis_default;
  },

  getChartsData: (params?: { district?: string; state?: string; programme?: string }): ChartDatasets => {
    if (params?.district && mockData.charts_by_district?.[params.district]) {
      return mockData.charts_by_district[params.district];
    }
    return mockData.charts_default;
  },

  getDistricts: (): DistrictInfo[] => {
    return mockData.districts || [];
  },

  getDistrictDetails: (name: string): DistrictDetail => {
    if (name && mockData.district_details?.[name]) {
      return mockData.district_details[name];
    }
    return mockData.district_details?.["Pune"] || null;
  },

  getMobilityFlows: () => {
    return mockData.mobility_flows || null;
  },

  getSkillMapLayers: () => {
    return mockData.skillmap_layers || [];
  },

  getSkillIntelligence: (params?: any) => {
    return {
      district: params?.district || "Pune",
      skills: [
        { name: "Solar PV Installation", local_demand: "High", supply_gap: "-38%", avg_starting_wage: 21500 },
        { name: "Data Entry Operator", local_demand: "Moderate", supply_gap: "+12%", avg_starting_wage: 16500 },
        { name: "EV Battery Diagnostics", local_demand: "Very High", supply_gap: "-54%", avg_starting_wage: 26000 },
        { name: "Industrial Electrician", local_demand: "High", supply_gap: "-22%", avg_starting_wage: 23000 }
      ]
    };
  },

  getVerificationSummary: () => {
    return mockData.verification_summary || {
      total_records: 260,
      verified_rate: 78.5,
      counts: {},
      conflict_count: 5,
      pending_count: 14
    };
  },

  getVerificationConflicts: () => {
    return mockData.verification_conflicts || [];
  },

  getTrainees: (params?: {
    district?: string;
    state?: string;
    programme?: string;
    skill?: string;
    status?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    let items: Trainee[] = mockData.trainees_page1?.items || [];

    if (params) {
      if (params.state && !params.state.startsWith("All")) {
        items = items.filter((t) => t.state === params.state);
      }
      if (params.district && !params.district.startsWith("All")) {
        items = items.filter((t) => t.district === params.district);
      }
      if (params.programme && !params.programme.startsWith("All")) {
        items = items.filter((t) => t.programme === params.programme);
      }
      if (params.skill && !params.skill.startsWith("All")) {
        items = items.filter((t) =>
          (t.skills_acquired || []).some((s: string) => s.includes(params.skill!))
        );
      }
      if (params.status && !params.status.startsWith("All")) {
        items = items.filter((t) => t.employment_status === params.status);
      }
      if (params.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        items = items.filter((t) =>
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          (t.employer && t.employer.toLowerCase().includes(q))
        );
      }
    }

    const pageSize = params?.page_size || 15;
    const page = params?.page || 1;
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const paginatedItems = items.slice(start, start + pageSize);

    return {
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      items: paginatedItems
    };
  },

  getTraineeById: (id: string): Trainee | null => {
    const items: Trainee[] = mockData.trainees_page1?.items || [];
    return items.find((t) => t.id === id || t.skillpulse_id === id) || items[0] || null;
  },

  getFollowUps: (params?: any) => {
    return mockData.followups || { total: 0, page: 1, page_size: 50, total_pages: 1, items: [] };
  },

  listJobs: () => {
    return mockData.jobs || { items: [] };
  },

  listApplications: () => {
    return mockData.applications || { items: [] };
  },

  employerOverview: () => {
    return mockData.employers_overview || { metrics: {}, recent_hires: [] };
  },

  getReportTypes: () => {
    return mockData.report_types || [];
  },

  getAiStatus: () => {
    return mockData.ai_status || {
      mode: "SkillPulse AI (Prototype Fallback)",
      has_key: true,
      key_masked: "Configured (Prototype)",
      model: "gemini-1.5-flash"
    };
  },

  getAiInsights: (district?: string) => {
    return mockData.ai_insights_pune || [];
  },

  askAi: (question: string, context?: any): AiStructuredResponse => {
    const q = (question || "").toLowerCase();
    let headline = "Multimodal Workforce Intelligence Analysis";
    let summary = "Based on longitudinal workforce indicators across Bihar, Uttar Pradesh, and Maharashtra, placement retention averages 76.4% at the 6-month milestone.";
    
    if (q.includes("retention") || q.includes("attrition")) {
      headline = "Longitudinal Retention Analysis & Risk Mitigations";
      summary = "Retention drops notably between month 3 and month 6 when post-placement migration support is absent. Top performing trades with sustained retention (>82%) are Solar PV Installation and Industrial Electrician.";
    } else if (q.includes("wage") || q.includes("salary")) {
      headline = "Wage Progression & Upward Mobility Trends";
      summary = "Trainees entering EV diagnostics and Renewable Energy exhibit an average 24% wage increase between 90-day and 365-day verification checkpoints, exceeding conventional office trades.";
    } else if (q.includes("solar") || q.includes("green")) {
      headline = "Green Energy & Solar Technician Employment Trajectory";
      summary = "Suryamitra certified technicians in Pune and Patna demonstrate strong industry absorption with 88.5% employer-verified retention and accelerated placement timelines.";
    }

    return {
      insight: `${headline}: ${summary}`,
      evidence: [
        "Cohort 6-Month Retention Rate: 76.4%",
        "Employer Verification Coverage: 81.8%",
        "Average Verified Entry Wage: ₹19,250/mo"
      ],
      explanation: summary,
      recommendation: "Institute 90-day post-placement employer micro-checkins and expand industry apprenticeships.",
      limitations: "Synthesized using verified SkillPulse longitudinal cohort records.",
      source_mode: "SkillPulse AI Prototype Mode",
      comparison: null
    };
  }
};
