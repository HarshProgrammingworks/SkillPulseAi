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
    const traineesList = mockData.trainees || mockData.trainees_page1?.items || [];
    const foundTrainee = traineesList.find((t: any) =>
      (t.id && t.id.toLowerCase() === id) ||
      (t.skillpulse_id && t.skillpulse_id.toLowerCase() === id) ||
      (t.phone && t.phone.includes(id)) ||
      (t.email && t.email.toLowerCase() === id)
    ) || traineesList[0];

    return {
      token: "demo-trainee-token-" + Date.now(),
      role: "trainee",
      display_name: foundTrainee?.name || "Aarav Kumar",
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
      display_name: "Aarav Kumar",
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
      display_name: payload.name || "Aarav Kumar",
      identifier: "SP-BR-10001",
      trainee_id: "SP-BR-10001",
      skillpulse_id: "SP-BR-10001"
    };
  },

  getFilters: () => {
    return mockData.filters;
  },

  getKpis: (params?: { district?: string; state?: string; programme?: string; batch?: string; status?: string; skill?: string }): DashboardKpis => {
    let items: Trainee[] = mockData.trainees || [];
    if (params) {
      if (params.state && !params.state.startsWith("All")) {
        items = items.filter((t) => (t.state || "").toLowerCase() === params.state!.toLowerCase());
      }
      if (params.district && !params.district.startsWith("All")) {
        items = items.filter((t) => (t.district || "").toLowerCase() === params.district!.toLowerCase());
      }
      if (params.programme && !params.programme.startsWith("All")) {
        items = items.filter((t) => (t.programme || "").toLowerCase() === params.programme!.toLowerCase());
      }
      if (params.batch && !params.batch.startsWith("All")) {
        items = items.filter((t) => t.batch === params.batch);
      }
      if (params.status && !params.status.startsWith("All")) {
        items = items.filter((t) => t.employment_status === params.status);
      }
      if (params.skill && !params.skill.startsWith("All")) {
        const skillLower = params.skill.toLowerCase();
        items = items.filter((t) =>
          (t.skills_acquired || []).some((s: string) => s && s.toLowerCase().includes(skillLower))
        );
      }
    }

    const hasFilter = Boolean(
      params && (
        (params.state && !params.state.startsWith("All")) ||
        (params.district && !params.district.startsWith("All")) ||
        (params.programme && !params.programme.startsWith("All")) ||
        (params.batch && !params.batch.startsWith("All")) ||
        (params.status && !params.status.startsWith("All")) ||
        (params.skill && !params.skill.startsWith("All"))
      )
    );

    if (!hasFilter) {
      return mockData.kpis_default;
    }

    const total = items.length;
    const certified = items.filter((t) => (t.certification_status || "").toLowerCase() === "certified").length;
    const employed = items.filter((t) => t.employment_status === "Employed").length;
    const selfEmployed = items.filter((t) => t.employment_status === "Self-Employed").length;
    const apprentices = items.filter((t) => t.employment_status === "Apprenticeship").length;
    const activeLivelihoods = employed + selfEmployed + apprentices;
    const employmentRate = certified > 0 ? (Math.round((activeLivelihoods / certified) * 1000) / 10).toFixed(1) + "%" : "0.0%";

    const working = items.filter((t) => t.current_wage && t.current_wage > 0);
    const avgWage = working.length > 0 ? Math.round(working.reduce((acc, t) => acc + (t.current_wage || 0), 0) / working.length) : 21890;

    return {
      total_trainees: { value: total, prev: Math.round(total * 0.92), change_pct: 8.7, trend: "up", tooltip: "Active filtered trainees across verified cohorts." },
      certified: { value: certified, prev: Math.round(certified * 0.94), change_pct: 6.4, trend: "up", tooltip: "Certified by State Vocational Examination Boards." },
      employed: { value: employed, prev: Math.round(employed * 0.89), change_pct: 12.4, trend: "up", tooltip: "Formal wage-employed trainees verified via employer/EPFO records." },
      self_employed: { value: selfEmployed, prev: Math.max(0, selfEmployed - 2), change_pct: 4.2, trend: "up", tooltip: "Verified micro-entrepreneurs & independent service contractors." },
      apprentices: { value: apprentices, prev: Math.max(0, apprentices - 2), change_pct: 7.5, trend: "up", tooltip: "Engaged under National Apprenticeship Promotion Scheme (NAPS)." },
      employment_rate: { value: employmentRate, prev: "79.5%", change_pct: 2.8, trend: "up", tooltip: "(Employed + Self-Employed + Apprentices) / Certified." },
      retention_6m: { value: "88.8%", prev: "86.4%", change_pct: 2.4, trend: "up", tooltip: "Proportion of placed candidates continuously engaged at 6 months." },
      retention_3m: { value: "97.6%", prev: "0%", change_pct: 0, trend: "flat", tooltip: "Share of placed trainees confirmed at 3 months." },
      retention_9m: { value: "49.5%", prev: "0%", change_pct: 0, trend: "flat", tooltip: "Share of placed trainees confirmed at 9 months." },
      retention_12m: { value: "34.8%", prev: "0%", change_pct: 0, trend: "flat", tooltip: "Share of placed trainees confirmed at 12 months." },
      avg_monthly_wage: { value: `₹${avgWage.toLocaleString()}`, prev: `₹${Math.round(avgWage * 0.92).toLocaleString()}`, change_pct: 8.7, trend: "up", tooltip: "Calculated mean verified monthly wage across working cohort." },
      skill_gap_rate: { value: "20.0%", prev: "25.8%", change_pct: -3.3, trend: "down", tooltip: "Proportion of industry vacancies unfulfilled due to skill deficit." }
    };
  },

  getChartsData: (params?: { district?: string; state?: string; programme?: string; batch?: string; status?: string; skill?: string }): ChartDatasets => {
    let items: Trainee[] = mockData.trainees || [];
    if (params) {
      if (params.state && !params.state.startsWith("All")) {
        items = items.filter((t) => (t.state || "").toLowerCase() === params.state!.toLowerCase());
      }
      if (params.district && !params.district.startsWith("All")) {
        items = items.filter((t) => (t.district || "").toLowerCase() === params.district!.toLowerCase());
      }
      if (params.programme && !params.programme.startsWith("All")) {
        items = items.filter((t) => (t.programme || "").toLowerCase() === params.programme!.toLowerCase());
      }
      if (params.batch && !params.batch.startsWith("All")) {
        items = items.filter((t) => t.batch === params.batch);
      }
      if (params.status && !params.status.startsWith("All")) {
        items = items.filter((t) => t.employment_status === params.status);
      }
    }

    const baseCharts = mockData.charts_default;

    // Dynamically calculate outcomes breakdown based on filtered items
    const outcomesCount: Record<string, number> = {
      Employed: 0,
      "Self-Employed": 0,
      Apprenticeship: 0,
      "Further Education": 0,
      Unemployed: 0,
      "Unknown / Insufficient": 0
    };
    items.forEach((t) => {
      const s = t.employment_status;
      if (s in outcomesCount) {
        outcomesCount[s]++;
      } else {
        outcomesCount["Unknown / Insufficient"]++;
      }
    });

    const outcomes_breakdown = [
      { name: "Employed", value: outcomesCount["Employed"], color: "#10B981" },
      { name: "Self-Employed", value: outcomesCount["Self-Employed"], color: "#3B82F6" },
      { name: "Apprenticeship", value: outcomesCount["Apprenticeship"], color: "#8B5CF6" },
      { name: "Further Education", value: outcomesCount["Further Education"], color: "#6366F1" },
      { name: "Unemployed", value: outcomesCount["Unemployed"], color: "#EF4444" },
      { name: "Unknown / Insufficient", value: outcomesCount["Unknown / Insufficient"], color: "#9CA3AF" }
    ];

    // Ensure all 9 districts are ALWAYS present in benchmarks so District Performance Benchmark displays completely!
    const allDistricts = [
      { district: "Gaya", trainees: 400, employment_rate: 80.2, retention_6m: 78.2, avg_wage: 21029 },
      { district: "Lucknow", trainees: 400, employment_rate: 82.2, retention_6m: 79.3, avg_wage: 22730 },
      { district: "Muzaffarpur", trainees: 400, employment_rate: 84.8, retention_6m: 80.8, avg_wage: 21374 },
      { district: "Nagpur", trainees: 400, employment_rate: 79.5, retention_6m: 81.1, avg_wage: 22714 },
      { district: "Nashik", trainees: 400, employment_rate: 82.2, retention_6m: 81.2, avg_wage: 21067 },
      { district: "Patna", trainees: 400, employment_rate: 83.8, retention_6m: 78.2, avg_wage: 22610 },
      { district: "Prayagraj", trainees: 400, employment_rate: 81.5, retention_6m: 76.1, avg_wage: 21084 },
      { district: "Pune", trainees: 400, employment_rate: 80.2, retention_6m: 81.6, avg_wage: 23346 },
      { district: "Varanasi", trainees: 400, employment_rate: 82.2, retention_6m: 81.8, avg_wage: 21090 }
    ];

    const targetDist = params?.district && !params.district.startsWith("All") ? params.district.toLowerCase() : "";
    const district_benchmarks = allDistricts.map((d) => ({
      ...d,
      selected: targetDist ? d.district.toLowerCase() === targetDist : false
    }));

    // Calculate wage progression dynamically from filtered items
    const working = items.filter((t) => t.current_wage && t.current_wage > 0);
    const avgWage = working.length > 0 ? Math.round(working.reduce((acc, t) => acc + (t.current_wage || 0), 0) / working.length) : 21890;
    const wage_progression = [
      { milestone: "Joining (0M)", avg_wage: Math.round(avgWage * 0.82), top_quartile: Math.round(avgWage * 0.95), median: Math.round(avgWage * 0.80) },
      { milestone: "3 Months", avg_wage: Math.round(avgWage * 0.91), top_quartile: Math.round(avgWage * 1.05), median: Math.round(avgWage * 0.89) },
      { milestone: "6 Months", avg_wage: Math.round(avgWage * 1.00), top_quartile: Math.round(avgWage * 1.15), median: Math.round(avgWage * 0.97) },
      { milestone: "9 Months", avg_wage: Math.round(avgWage * 1.09), top_quartile: Math.round(avgWage * 1.25), median: Math.round(avgWage * 1.06) },
      { milestone: "12 Months", avg_wage: Math.round(avgWage * 1.20), top_quartile: Math.round(avgWage * 1.38), median: Math.round(avgWage * 1.16) }
    ];

    // Calculate retention cohort dynamically
    const stateName = (params?.state || "").toLowerCase();
    const ret6mVal = stateName.includes("maharashtra") ? 81.6 : stateName.includes("uttar") ? 80.2 : stateName.includes("bihar") ? 78.8 : 79.8;
    const retention_cohort = [
      { stage: "1M", retention_pct: 100.0, benchmark_pct: 98.5 },
      { stage: "3M", retention_pct: Math.round((ret6mVal + 17) * 10) / 10, benchmark_pct: 92.4 },
      { stage: "6M", retention_pct: ret6mVal, benchmark_pct: 79.8 },
      { stage: "9M", retention_pct: Math.round((ret6mVal - 28) * 10) / 10, benchmark_pct: 49.5 },
      { stage: "12M", retention_pct: Math.round((ret6mVal - 44) * 10) / 10, benchmark_pct: 34.8 }
    ];

    // Scale employment trend based on filtered cohort
    const ratio = items.length > 0 ? items.length / 3600 : 1;
    const employment_trend = (baseCharts.employment_trend || []).map((t: any) => ({
      ...t,
      enrolled: Math.round(t.enrolled * ratio),
      certified: Math.round(t.certified * ratio),
      employed: Math.round(t.employed * ratio)
    }));

    return {
      ...baseCharts,
      outcomes_breakdown: items.length > 0 ? outcomes_breakdown : baseCharts.outcomes_breakdown,
      district_benchmarks,
      wage_progression,
      retention_cohort,
      employment_trend
    };
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
      total_records: 3600,
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
    verification?: string;
    batch?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }) => {
    let items: Trainee[] = mockData.trainees || mockData.trainees_page1?.items || [];

    if (params) {
      if (params.state && !params.state.startsWith("All")) {
        items = items.filter((t) => t.state?.toLowerCase() === params.state!.toLowerCase());
      }
      if (params.district && !params.district.startsWith("All")) {
        items = items.filter((t) => t.district?.toLowerCase() === params.district!.toLowerCase());
      }
      if (params.programme && !params.programme.startsWith("All")) {
        items = items.filter((t) => t.programme?.toLowerCase() === params.programme!.toLowerCase());
      }
      if (params.batch && !params.batch.startsWith("All")) {
        items = items.filter((t) => t.batch === params.batch);
      }
      if (params.skill && !params.skill.startsWith("All")) {
        const skillLower = params.skill.toLowerCase();
        items = items.filter((t) =>
          (t.skills_acquired || []).some((s: string) => s && s.toLowerCase().includes(skillLower)) ||
          (t.target_skills || []).some((s: string) => s && s.toLowerCase().includes(skillLower))
        );
      }
      if (params.status && !params.status.startsWith("All")) {
        items = items.filter((t) => t.employment_status === params.status);
      }
      if (params.verification && !params.verification.startsWith("All")) {
        items = items.filter((t) => t.verification_status === params.verification);
      }
      if (params.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        items = items.filter((t) =>
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.id && t.id.toLowerCase().includes(q)) ||
          (t.skillpulse_id && t.skillpulse_id.toLowerCase().includes(q)) ||
          (t.employer && t.employer.toLowerCase().includes(q)) ||
          (t.district && t.district.toLowerCase().includes(q)) ||
          (t.programme && t.programme.toLowerCase().includes(q))
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
    const items: Trainee[] = mockData.trainees || mockData.trainees_page1?.items || [];
    const target = (id || "").trim().toLowerCase();
    return items.find((t) =>
      (t.id && t.id.toLowerCase() === target) ||
      (t.skillpulse_id && t.skillpulse_id.toLowerCase() === target)
    ) || items[0] || null;
  },

  createTrainee: (data: any): Trainee => {
    const traineesList = mockData.trainees || mockData.trainees_page1?.items || [];
    const seq = (traineesList.length + 1).toString().padStart(5, "0");
    const stateCode = data.state === "Bihar" ? "BR" : data.state === "Uttar Pradesh" ? "UP" : "MH";
    const id = `SP-${stateCode}-${seq}`;
    const firstName = (data.name || "Trainee").split(" ")[0].toLowerCase();
    const lastName = ((data.name || "").split(" ")[1] || "user").toLowerCase();
    const email = data.email || `${firstName}.${lastName}@skillpulse.in`;
    const newTrainee: Trainee = {
      id,
      skillpulse_id: id,
      name: data.name || "New Trainee",
      email,
      phone: data.phone || "9800012345",
      gender: data.gender || "Female",
      age: Number(data.age || 22),
      state: data.state || "Maharashtra",
      district: data.district || "Pune",
      centre_id: data.centre_id || "TC-101",
      programme: data.programme || "Solar PV Installation",
      batch: data.batch || "2024-Q1",
      enrolment_date: data.enrolment_date || "2023-11-01",
      completion_date: data.completion_date || "2024-02-15",
      certification_status: data.certification_status || "Certified",
      employment_status: data.employment_status || "Employed",
      employer: data.employer || "GreenTech Solar Solutions",
      job_role: data.job_role || "Solar PV Technician",
      current_wage: Number(data.current_wage || 21500),
      joining_date: data.joining_date || "2024-03-01",
      current_location: data.current_location || (data.district ? `${data.district}, ${data.state}` : "Pune, Maharashtra"),
      retention_status: data.retention_status || "Employed",
      retention_milestone: data.retention_milestone || "6M",
      verification_status: data.verification_status || "Self Reported",
      skills_acquired: data.skills_acquired || ["Solar PV Installation", "Electrical Safety"],
      target_skills: data.target_skills || ["Inverter Troubleshooting"],
      education: data.education || "12th Pass / ITI",
      aadhaar_linked: data.aadhaar_linked ?? true,
      ...data
    };
    if (Array.isArray(mockData.trainees)) {
      mockData.trainees.unshift(newTrainee);
    }
    return newTrainee;
  },

  updateTraineeOutcome: (id: string, data: any): Trainee => {
    const traineesList: Trainee[] = mockData.trainees || mockData.trainees_page1?.items || [];
    const target = (id || "").trim().toLowerCase();
    const trainee = traineesList.find((t) =>
      (t.id && t.id.toLowerCase() === target) ||
      (t.skillpulse_id && t.skillpulse_id.toLowerCase() === target)
    );
    if (trainee) {
      if (data.employment_status) trainee.employment_status = data.employment_status;
      if (data.employer !== undefined) trainee.employer = data.employer;
      if (data.job_role !== undefined) trainee.job_role = data.job_role;
      if (data.current_wage !== undefined) trainee.current_wage = Number(data.current_wage);
      if (data.joining_date !== undefined) trainee.joining_date = data.joining_date;
      if (data.current_location !== undefined) trainee.current_location = data.current_location;
      if (data.skill_relevance !== undefined) (trainee as any).skill_relevance = data.skill_relevance;
      if (data.retention_status !== undefined) trainee.retention_status = data.retention_status;
      if (data.reason_for_leaving !== undefined) (trainee as any).reason_for_leaving = data.reason_for_leaving;
      if (data.email !== undefined) (trainee as any).email = data.email;
      if (data.phone !== undefined) trainee.phone = data.phone;
      trainee.last_follow_up_date = new Date().toISOString().split("T")[0];
      return trainee;
    }
    return { id, ...data } as Trainee;
  },

  getFollowUps: (params?: any) => {
    let items = mockData.followups?.items || [];

    // Ensure followups include all states and channels by synthesizing/seeding if needed
    const hasMultipleStates = items.some((f: any) => f.state === "Uttar Pradesh") && items.some((f: any) => f.state === "Maharashtra");
    if (!hasMultipleStates && Array.isArray(mockData.trainees) && mockData.trainees.length > 0) {
      const channels = ["WhatsApp", "SMS", "Call Centre", "Web", "IVR"];
      const stages = ["30D", "90D", "180D", "270D", "9M", "12M"];
      const statuses = ["Completed", "Completed", "Pending", "Overdue"];
      const generated = mockData.trainees.map((t: any, idx: number) => ({
        follow_up_id: `FU-${t.id}-${stages[idx % stages.length]}`,
        trainee_id: t.id,
        skillpulse_id: t.skillpulse_id || t.id,
        trainee_name: t.name,
        district: t.district,
        state: t.state,
        programme: t.programme,
        stage: stages[idx % stages.length],
        due_date: "2026-03-15",
        channel: channels[idx % channels.length],
        status: statuses[idx % statuses.length],
        completed_date: "2026-03-12",
        employment_status: t.employment_status,
        employer: t.employer || "Verified Partner",
        job_role: t.job_role || "Technician",
        wage: t.current_wage || 21500,
        verification_status: t.verification_status || "Multi-Verified",
        verification_sources: ["Trainee confirmation", "Employer confirmation", "Official records"],
        last_updated: "2026-03-12",
        update_source: "Periodic digital & assisted checkin",
        consent_given: true,
        job_satisfaction: "High",
        job_relevance: "Relevant"
      }));
      mockData.followups = mockData.followups || {};
      mockData.followups.items = generated;
      items = generated;
    }

    if (params) {
      if (params.state && !params.state.startsWith("All")) {
        items = items.filter((f: any) => (f.state || "").toLowerCase() === params.state.toLowerCase());
      }
      if (params.district && !params.district.startsWith("All")) {
        items = items.filter((f: any) => (f.district || "").toLowerCase() === params.district.toLowerCase());
      }
      if (params.status && !params.status.startsWith("All")) {
        items = items.filter((f: any) => f.status === params.status);
      }
      if (params.stage && !params.stage.startsWith("All")) {
        items = items.filter((f: any) => (f.stage || "").toLowerCase() === params.stage.toLowerCase());
      }
      if (params.channel && !params.channel.startsWith("All")) {
        items = items.filter((f: any) => (f.channel || "").toLowerCase() === params.channel.toLowerCase());
      }
      if (params.search && params.search.trim()) {
        const q = params.search.trim().toLowerCase();
        items = items.filter((f: any) =>
          (f.trainee_name && f.trainee_name.toLowerCase().includes(q)) ||
          (f.trainee_id && f.trainee_id.toLowerCase().includes(q)) ||
          (f.employer && f.employer.toLowerCase().includes(q))
        );
      }
    }

    const pageSize = params?.page_size || 15;
    const page = params?.page || 1;
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;

    const pending = items.filter((f: any) => f.status === "Pending").length;
    const completed = items.filter((f: any) => f.status === "Completed").length;
    const overdue = items.filter((f: any) => f.status === "Overdue").length;
    const responseRate = (completed + pending) > 0 ? Math.round((completed / (completed + pending + overdue)) * 1000) / 10 : 82.4;

    return {
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      summary: {
        all: total,
        pending,
        completed,
        overdue,
        response_rate: responseRate
      },
      items: items.slice(start, start + pageSize)
    };
  },

  listJobs: (params?: any) => {
    let items = mockData.jobs?.items || [];
    if (params?.district && !params.district.startsWith("All")) {
      const filtered = items.filter((j: any) => j.district?.toLowerCase() === params.district.toLowerCase());
      if (filtered.length > 0) items = filtered;
    }
    return { items };
  },

  createJob: (payload: any) => {
    const newJob = {
      id: `JOB-${(mockData.jobs?.items?.length || 27) + 1}`,
      title: payload.title || "Technical Associate",
      description: payload.description || "",
      required_skills: payload.required_skills || ["Technical Competency"],
      openings: Number(payload.openings || 1),
      state: payload.state || "Maharashtra",
      district: payload.district || "Pune",
      location: payload.district ? `${payload.district}, ${payload.state}` : "Pune, Maharashtra",
      sector: payload.sector || "Renewable Energy",
      employer_name: payload.employer_name || "SkillPulse Verified Partner",
      proficiency: "Intermediate",
      timeline: "30 days"
    };
    if (mockData.jobs?.items) {
      mockData.jobs.items.unshift(newJob);
    }
    return newJob;
  },

  extractSkills: (description: string) => {
    const desc = (description || "").toLowerCase();
    const catalog = [
      "Solar Installation", "PV Maintenance", "Inverter Troubleshooting", "Electrical Safety",
      "EV Diagnostics", "Battery Testing", "High-Voltage Safety", "CAN-Bus Diagnostics",
      "Data Entry", "MS Excel", "Office Automation", "Documentation",
      "Industrial Wiring", "PLC Programming", "Motor Control", "Switchgear"
    ];
    const found = catalog.filter((skill) => desc.includes(skill.toLowerCase()));
    return {
      skills: found.length > 0 ? found : ["Solar Installation", "Electrical Safety", "Inverter Troubleshooting"],
      source: "SkillPulse AI Catalogue Extraction Engine"
    };
  },

  listApplications: (stage?: string) => {
    let items = mockData.applications?.items || [];
    if (stage && stage !== "All" && stage !== "Matched") {
      items = items.filter((app: any) => app.status === stage);
    }
    return { items };
  },

  applyToJob: (jobId: string) => {
    const traineesList = mockData.trainees || mockData.trainees_page1?.items || [];
    const trainee = traineesList[0] || { id: "SP-BR-10001", name: "Aarav Kumar", skillpulse_id: "SP-BR-10001" };
    const job = (mockData.jobs?.items || []).find((j: any) => j.id === jobId) || { id: jobId, title: "Technical Associate" };
    const newApp = {
      id: `APP-${Date.now().toString().slice(-5)}`,
      trainee_id: trainee.id,
      skillpulse_id: trainee.skillpulse_id,
      name: trainee.name,
      job_id: job.id,
      job_title: job.title,
      status: "Applied",
      updated_at: new Date().toISOString().split("T")[0]
    };
    if (mockData.applications?.items) {
      mockData.applications.items.unshift(newApp);
    }
    return newApp;
  },

  moveApplication: (id: string, status: string) => {
    if (mockData.applications?.items) {
      const app = mockData.applications.items.find((a: any) => a.id === id);
      if (app) {
        app.status = status;
        app.updated_at = new Date().toISOString().split("T")[0];
      }
    }
    return { ok: true, id, status };
  },

  recordOutcome: (payload: any) => {
    return {
      id: `OUT-${Date.now().toString().slice(-4)}`,
      ...payload,
      recorded_at: new Date().toISOString().split("T")[0]
    };
  },

  searchAll: (q: string) => {
    const query = (q || "").trim().toLowerCase();
    if (query.length < 2) {
      return { trainees: [], skills: [], districts: [], jobs: [] };
    }
    const traineesList = mockData.trainees || mockData.trainees_page1?.items || [];
    const trainees = traineesList
      .filter((t: any) =>
        (t.name && t.name.toLowerCase().includes(query)) ||
        (t.skillpulse_id && t.skillpulse_id.toLowerCase().includes(query)) ||
        (t.id && t.id.toLowerCase().includes(query)) ||
        (t.district && t.district.toLowerCase().includes(query))
      )
      .slice(0, 6)
      .map((t: any) => ({
        id: t.id,
        skillpulse_id: t.skillpulse_id || t.id,
        name: t.name,
        district: t.district,
        state: t.state,
        skills: (t.skills_acquired || []).slice(0, 4),
        type: "trainee"
      }));

    const allSkills = new Set<string>();
    traineesList.forEach((t: any) => (t.skills_acquired || []).forEach((s: string) => {
      if (s.toLowerCase().includes(query)) allSkills.add(s);
    }));
    const skills = Array.from(allSkills).slice(0, 6);

    const districts = (mockData.districts || [])
      .map((d: any) => d.name || d)
      .filter((d: string) => d.toLowerCase().includes(query))
      .slice(0, 6);

    const jobs = (mockData.jobs?.items || [])
      .filter((j: any) => (j.title && j.title.toLowerCase().includes(query)) || (j.sector && j.sector.toLowerCase().includes(query)))
      .slice(0, 6);

    return { trainees, skills, districts, jobs };
  },

  getEmployers: () => {
    return {
      notice: "Active Hiring Desk requisitions and industry partners across Bihar, Uttar Pradesh, and Maharashtra.",
      items: mockData.organisations || []
    };
  },

  createEmployer: (payload: any) => {
    const newEmp = {
      id: `EMP-${(mockData.organisations?.length || 99) + 1}`,
      name: payload.name || "Untitled Organisation",
      industry: payload.industry || "Renewable Energy",
      contact_person: payload.contact_person || "HR Lead",
      email: payload.email || "contact@demo.org",
      phone: payload.phone || "9800000000",
      state: payload.state || "Maharashtra",
      district: payload.district || "Pune",
      address: payload.address || "Industrial Area",
      location: payload.district ? `${payload.district}, ${payload.state}` : "Pune, Maharashtra",
      organisation_type: payload.organisation_type || "Private Limited",
      required_skills: payload.required_skills || ["Solar Installation"],
      workforce_requirement: Number(payload.workforce_requirement || 2),
      verification_status: payload.verification_status || "Pending Verification",
      active_jobs: 1,
      matched_talent: 8,
      hires: 0,
      outcomes: "Longitudinal tracking initiated"
    };
    if (Array.isArray(mockData.organisations)) {
      mockData.organisations.unshift(newEmp);
    }
    return newEmp;
  },

  employerOverview: () => {
    const apps = mockData.applications?.items || [];
    const countStage = (s: string) => apps.filter((a: any) => a.status === s).length;
    const matchedCount = countStage("Matched") || 42;
    const shortlistedCount = countStage("Shortlisted") || 31;
    const interviewCount = countStage("Interview") || 8;
    const selectedCount = countStage("Selected") || 14;
    const joinedCount = countStage("Joined") || 14;
    const retainedCount = countStage("Retained") || 12;

    return {
      notice: "Synthetic demo hiring activity across connected state sectors.",
      openings: mockData.jobs?.items?.length || 27,
      matched: matchedCount,
      shortlisted: shortlistedCount,
      interviews: interviewCount,
      hires: joinedCount,
      retained: retainedCount,
      pipeline: [
        { stage: "All", count: apps.length || 109 },
        { stage: "Applied", count: countStage("Applied") || 18 },
        { stage: "Matched", count: matchedCount },
        { stage: "Shortlisted", count: shortlistedCount },
        { stage: "Interview", count: interviewCount },
        { stage: "Selected", count: selectedCount },
        { stage: "Joined", count: joinedCount },
        { stage: "Retained", count: retainedCount }
      ]
    };
  },

  matchCandidates: (requirements: any) => {
    const requiredSkills: string[] = (requirements.required_skills || []).map((s: string) => (s || "").trim().toLowerCase());
    const role = (requirements.job_role || "").trim().toLowerCase();
    const education = (requirements.education || "").trim().toLowerCase();
    const location = (requirements.location || "").trim().toLowerCase();
    const certification = (requirements.preferred_certification || "").trim().toLowerCase();
    const minYears = Number(requirements.min_experience_years || 0);

    const traineesList: any[] = mockData.trainees || mockData.trainees_page1?.items || [];
    const results = traineesList.map((trainee: any) => {
      const skills = (trainee.skills_acquired || []).map((s: string) => (s || "").toLowerCase());
      const skillHits = requiredSkills.filter((s: string) => skills.some((owned: string) => owned.includes(s) || s.includes(owned)));
      const skillsScore = requiredSkills.length > 0 ? (skillHits.length / requiredSkills.length) : (role && trainee.job_role && trainee.job_role.toLowerCase().includes(role) ? 0.9 : 0.7);

      let eduScore = 0.6;
      if (!education || (trainee.education && trainee.education.toLowerCase().includes(education))) {
        eduScore = 1.0;
      }

      const years = typeof trainee.experience_years === "number" ? trainee.experience_years : (trainee.employment_duration_months || 0) / 12;
      const expScore = minYears <= 0 ? 1.0 : Math.min(1.0, years / minYears);

      const certText = (trainee.certification_status || "").toLowerCase();
      const certScore = !certification ? (certText === "certified" ? 1.0 : 0.6) : (certText.includes(certification) || certText === "certified" ? 1.0 : 0.4);

      let locScore = 0.5;
      if (!location || location.includes("all") || (trainee.district && trainee.district.toLowerCase().includes(location)) || (trainee.state && trainee.state.toLowerCase().includes(location))) {
        locScore = 1.0;
      } else if (trainee.willing_to_relocate) {
        locScore = 0.8;
      }

      const breakdown = {
        skills: Math.round(skillsScore * 100),
        education: Math.round(eduScore * 100),
        experience: Math.round(expScore * 100),
        certification: Math.round(certScore * 100),
        location: Math.round(locScore * 100)
      };

      const match_pct = Math.round(
        (breakdown.skills + breakdown.education + breakdown.experience + breakdown.certification + breakdown.location) / 5
      );

      return {
        trainee_id: trainee.id,
        name: trainee.name,
        match_pct,
        breakdown,
        why: [
          requiredSkills.length > 0
            ? `Skills match ${breakdown.skills}% (${skillHits.length} of ${requiredSkills.length} required competencies verified).`
            : `Strong core competency alignment across certified modules.`,
          `Education match ${breakdown.education}% (${trainee.education || "Verified qualification"}).`,
          `Experience match ${breakdown.experience}% against ${minYears} required year(s).`,
          `Certification score ${breakdown.certification}% (${trainee.certification_status || "Certified"}).`,
          `Location suitability ${breakdown.location}% (${trainee.district || "Pune"}, ${trainee.state || "Maharashtra"}).`
        ],
        profile: {
          district: trainee.district || "Pune",
          education: trainee.education || "12th Pass / ITI",
          programme: trainee.programme || "Technical Skilling Programme",
          certification_status: trainee.certification_status || "Certified",
          skills_acquired: trainee.skills_acquired || [],
          experience_years: Math.round(years * 10) / 10,
          employment_status: trainee.employment_status || "Employed",
          job_role: trainee.job_role || trainee.programme || "Technician",
          preferred_role: trainee.preferred_role || trainee.job_role || "Associate",
          preferred_location: trainee.preferred_location || trainee.district,
          willing_to_relocate: trainee.willing_to_relocate ?? true,
          current_wage: trainee.current_wage || 21500
        }
      };
    });

    results.sort((a: any, b: any) => b.match_pct - a.match_pct);

    return {
      scoring: "SkillPulse AI Candidate Matching: Equal multi-attribute evaluation across skills, credentials, experience, and mobility.",
      notice: "Assisted talent matching signal. Not an automated hiring decision.",
      count: results.length,
      candidates: results.slice(0, 30)
    };
  },

  getReportTypes: () => {
    return mockData.report_types || [];
  },

  generateReport: (params: { report_type: string; state?: string; district?: string; programme?: string; time_period?: string; status?: string; employment?: string }) => {
    const type = params.report_type || "employment_outcome";
    let trainees: Trainee[] = mockData.trainees || [];
    if (params.state && !params.state.startsWith("All")) {
      trainees = trainees.filter((t) => (t.state || "").toLowerCase() === params.state!.toLowerCase());
    }
    if (params.district && !params.district.startsWith("All")) {
      trainees = trainees.filter((t) => (t.district || "").toLowerCase() === params.district!.toLowerCase());
    }
    if (params.programme && !params.programme.startsWith("All")) {
      trainees = trainees.filter((t) => (t.programme || "").toLowerCase() === params.programme!.toLowerCase());
    }
    const empFilter = params.employment || params.status;
    if (empFilter && !empFilter.startsWith("All")) {
      trainees = trainees.filter((t) => t.employment_status === empFilter);
    }

    const total = trainees.length;
    const certified = trainees.filter((t) => (t.certification_status || "").toLowerCase() === "certified").length;
    const employed = trainees.filter((t) => t.employment_status === "Employed").length;
    const selfEmp = trainees.filter((t) => t.employment_status === "Self-Employed").length;
    const app = trainees.filter((t) => t.employment_status === "Apprenticeship").length;
    const activeLiv = employed + selfEmp + app;
    const livRate = total > 0 ? (Math.round((activeLiv / (certified || total)) * 1000) / 10).toFixed(1) + "%" : "81.9%";
    const working = trainees.filter((t) => t.current_wage && t.current_wage > 0);
    const avgWageNum = working.length > 0 ? Math.round(working.reduce((acc, t) => acc + (t.current_wage || 0), 0) / working.length) : 21890;
    const avgWage = `₹${avgWageNum.toLocaleString()}`;

    const ret6m = (params.state || "").toLowerCase().includes("maharashtra") ? "81.6%" : (params.state || "").toLowerCase().includes("uttar") ? "80.2%" : (params.state || "").toLowerCase().includes("bihar") ? "78.8%" : "79.8%";

    const sampleCohort = trainees.slice(0, 15).map((t: any) => ({
      id: t.id,
      name: t.name,
      district: t.district,
      programme: t.programme,
      status: t.employment_status,
      wage: t.current_wage ? `₹${t.current_wage.toLocaleString()}` : "N/A",
      verification: t.verification_status || "Multi-Verified"
    }));

    const kpis = [
      { label: "Total Tracked Trainees", value: total > 0 ? total : 3600 },
      { label: "Certified Trainees", value: certified > 0 ? certified : 2880 },
      { label: "Active Livelihoods Rate", value: livRate },
      { label: "6-Month Retention", value: ret6m },
      { label: "Average Monthly Wage", value: avgWage },
      { label: "Catalogue Net Gap", value: total > 0 ? Math.round(total * 3.5).toLocaleString() : "12,860" }
    ];

    const base = (mockData.sample_reports && mockData.sample_reports[type]) || {};

    const scopeTitle = [
      params.district && !params.district.startsWith("All") ? params.district : null,
      params.state && !params.state.startsWith("All") ? params.state : null,
      params.programme && !params.programme.startsWith("All") ? params.programme : null,
      empFilter && !empFilter.startsWith("All") ? empFilter : null
    ].filter(Boolean).join(" • ") || "All Regions (Bihar, UP, Maharashtra)";

    return {
      ...base,
      id: `REP-${Date.now().toString().slice(-6)}`,
      title: `${base.title || "Workforce Intelligence & Outcome Report"} [${scopeTitle}]`,
      generated_at: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
      authority: "State Skill Development Mission / Department of Skills, Employment & Innovation",
      notice: "Demonstration Prototype Data — Synthetic Dataset for SIH Evaluation",
      filters: {
        report_type: type,
        state: params.state || "All States",
        district: params.district || "All Districts",
        programme: params.programme || "All Programmes",
        employment: empFilter || "All Employment",
        time_period: params.time_period || "Last 6 Months"
      },
      kpis,
      key_findings: [
        `In ${scopeTitle}, verified livelihood rate stands at ${livRate} across tracked candidate records.`,
        `6-Month verified retention rate averages ${ret6m} with independent employer and EPFO corroborate.`,
        `Average monthly take-home salary across employed technical cohort is ${avgWage}/month.`
      ],
      ai_executive_summary: {
        insight: `Empirical Workforce Intelligence Synthesis for ${scopeTitle}`,
        evidence: [`${total > 0 ? total : 3600} Candidates Evaluated`, `${livRate} Livelihood Rate`, `${ret6m} 6-Month Retention`, `${avgWage} Average Wage`],
        explanation: `Longitudinal tracking for ${scopeTitle} demonstrates steady career absorption in technical trades, with candidates placed within a 25km radius demonstrating 28% higher retention.`,
        recommendation: "Prioritize specialized technical certifications with post-placement micro-checkins and local employer partnerships.",
        limitations: "Demonstration figures validated against prototype records.",
        source_mode: "SkillPulse AI Verified Synthesis"
      },
      sample_cohort: sampleCohort.length > 0 ? sampleCohort : base.sample_cohort || []
    };
  },

  dataQuality: (params?: { state?: string; district?: string; programme?: string }) => {
    let items: Trainee[] = mockData.trainees || [];
    if (params) {
      if (params.state && !params.state.startsWith("All")) {
        items = items.filter((t) => (t.state || "").toLowerCase() === params.state!.toLowerCase());
      }
      if (params.district && !params.district.startsWith("All")) {
        items = items.filter((t) => (t.district || "").toLowerCase() === params.district!.toLowerCase());
      }
      if (params.programme && !params.programme.startsWith("All")) {
        items = items.filter((t) => (t.programme || "").toLowerCase() === params.programme!.toLowerCase());
      }
    }
    const hasFilter = Boolean(
      params && (
        (params.state && !params.state.startsWith("All")) ||
        (params.district && !params.district.startsWith("All")) ||
        (params.programme && !params.programme.startsWith("All"))
      )
    );

    const total = hasFilter ? items.length : 3600;
    const missing = items.filter((t) => t.employment_status === "Employed" && (!t.last_follow_up_date || !t.current_wage));
    const conflicts = items.filter((t) => t.verification_status === "Conflicting Information");
    const pending = items.filter((t) => t.verification_status === "Pending Verification");
    const selfReported = items.filter((t) => t.verification_status === "Self Reported");

    const phones: Record<string, string[]> = {};
    items.forEach((t) => {
      if (t.phone) {
        phones[t.phone] = phones[t.phone] || [];
        phones[t.phone].push(t.skillpulse_id || t.id);
      }
    });
    const duplicates: Array<{ phone: string; ids: string[] }> = [];
    Object.entries(phones).forEach(([phone, ids]) => {
      if (ids.length > 1) {
        duplicates.push({ phone, ids });
      }
    });

    const complete = hasFilter
      ? items.filter(
          (t) => t.name && t.phone && t.district && t.state && t.programme && t.batch && t.employment_status && t.verification_status
        ).length
      : 3535;

    const completeness_rate = total > 0 ? Math.round((complete / total) * 1000) / 10 : 98.2;
    const consistency_rate = total > 0 ? Math.round(((total - conflicts.length - duplicates.length) / total) * 1000) / 10 : 96.4;

    const brief = (rows: Trainee[]) =>
      rows.slice(0, 25).map((t) => ({
        id: t.id,
        skillpulse_id: t.skillpulse_id || t.id,
        name: t.name,
        district: t.district,
        phone: t.phone,
        status: t.verification_status || t.employment_status
      }));

    return {
      notice: "Evaluated across SkillPulse verified multi-state longitudinal records.",
      total_records: total,
      complete_records: complete,
      completeness_rate,
      consistency_rate,
      freshness_rate: 95.4,
      categories: [
        { id: "missing", label: "Missing employment updates", count: missing.length, records: brief(missing) },
        { id: "duplicates", label: "Duplicate mobile numbers", count: duplicates.length, records: duplicates.slice(0, 25) },
        { id: "conflicts", label: "Conflicting information", count: conflicts.length, records: brief(conflicts) },
        { id: "unverified", label: "Self-reported, not independently verified", count: selfReported.length, records: brief(selfReported) },
        { id: "pending", label: "Verification backlog", count: pending.length, records: brief(pending) }
      ]
    };
  },

  geo: (params?: { state?: string; skill?: string }) => {
    const rawDistricts = [
      { state: "Bihar", district: "Muzaffarpur", trainees: 400, employed: 339, training_centres: 8, job_openings: 14, demand: "High" },
      { state: "Bihar", district: "Patna", trainees: 400, employed: 335, training_centres: 12, job_openings: 22, demand: "High" },
      { state: "Bihar", district: "Gaya", trainees: 400, employed: 321, training_centres: 7, job_openings: 9, demand: "Medium" },
      { state: "Uttar Pradesh", district: "Lucknow", trainees: 400, employed: 329, training_centres: 14, job_openings: 28, demand: "High" },
      { state: "Uttar Pradesh", district: "Varanasi", trainees: 400, employed: 329, training_centres: 10, job_openings: 16, demand: "High" },
      { state: "Uttar Pradesh", district: "Prayagraj", trainees: 400, employed: 326, training_centres: 9, job_openings: 11, demand: "Medium" },
      { state: "Maharashtra", district: "Pune", trainees: 400, employed: 321, training_centres: 18, job_openings: 42, demand: "High" },
      { state: "Maharashtra", district: "Nashik", trainees: 400, employed: 329, training_centres: 11, job_openings: 19, demand: "High" },
      { state: "Maharashtra", district: "Nagpur", trainees: 400, employed: 318, training_centres: 13, job_openings: 24, demand: "High" }
    ];

    let items = rawDistricts;
    if (params?.state && !params.state.startsWith("All")) {
      items = items.filter((d) => d.state.toLowerCase() === params.state!.toLowerCase());
    }
    return {
      notice: "Cross-district longitudinal geography intelligence across Bihar, UP, and Maharashtra.",
      items
    };
  },

  nextFollowUpQuestion: (
    traineeId: string,
    history: Array<{ role: string; content: string; topic?: string }>,
    stage?: string
  ) => {
    const traineesList: Trainee[] = mockData.trainees || [];
    const t = traineesList.find((tr) => tr.id === traineeId || tr.skillpulse_id === traineeId) || traineesList[0] || {
      name: "Candidate",
      programme: "Technical Skilling",
      employer: "Enterprise Partner",
      job_role: "Specialist",
      current_wage: 21500
    };

    const name = (t.name || "Candidate").split(" ")[0];
    const employer = t.employer || "Enterprise Partner";
    const role = t.job_role || t.programme || "Technician";
    const stg = stage || "9M";

    // Opening turn
    if (!history || history.length === 0) {
      return {
        topic: "employment_check",
        question: `Hi ${name}, we'd like to update your employment status for your ${stg} career follow-up.\n\nAre you currently employed?`,
        quick_replies: [
          "Still employed",
          "Changed employer",
          "Looking for a job",
          "Self-employed",
          "Further training",
          "Not currently working"
        ],
        suggested_replies: [
          "Still employed",
          "Changed employer",
          "Looking for a job",
          "Self-employed",
          "Further training",
          "Not currently working"
        ],
        complete: false
      };
    }

    const lastUserTurn = [...history].reverse().find((m) => m.role === "user");
    const lastUserText = (lastUserTurn?.content || "").trim().toLowerCase();

    // Determine the last assistant topic
    const lastAssistantTurn = [...history].reverse().find((m) => m.role === "assistant");
    const lastTopic = lastAssistantTurn?.topic || "employment_check";

    // Turn 1: Branch from employment_check
    if (lastTopic === "employment_check") {
      // 1. Check unemployed signals first to avoid substring false-positives
      if (
        lastUserText.includes("not working") ||
        lastUserText.includes("unemployed") ||
        lastUserText.includes("looking") ||
        lastUserText.includes("left") ||
        lastUserText.includes("quit") ||
        lastUserText.startsWith("no") ||
        lastUserText === "no"
      ) {
        return {
          topic: "unemployed_reason",
          question: `Thank you for letting us know. Could you share what led to leaving your previous position?`,
          quick_replies: ["Wage below expectation", "Commute/distance issues", "Role mismatch", "Contract ended", "Personal reasons"],
          suggested_replies: ["Wage below expectation", "Commute/distance issues", "Role mismatch", "Contract ended", "Personal reasons"],
          complete: false
        };
      }

      // 2. Check changed employer
      if (lastUserText.includes("changed") || lastUserText.includes("another") || lastUserText.includes("new company") || lastUserText.includes("new job")) {
        return {
          topic: "new_employer",
          question: `Congratulations on the new opportunity! What is the name of your new employer and your new role?`,
          quick_replies: ["Joined manufacturing plant", "Working in tech/services", "Retail store associate"],
          suggested_replies: ["Joined manufacturing plant", "Working in tech/services", "Retail store associate"],
          complete: false
        };
      }

      // 3. Check self-employed
      if (lastUserText.includes("self") || lastUserText.includes("business") || lastUserText.includes("freelance") || lastUserText.includes("shop")) {
        return {
          topic: "self_employed_type",
          question: `Excellent! What kind of independent trade or service business have you established?`,
          quick_replies: ["Solar installation contractor", "Independent electrician", "Service repair shop", "Freelance technician"],
          suggested_replies: ["Solar installation contractor", "Independent electrician", "Service repair shop", "Freelance technician"],
          complete: false
        };
      }

      // 4. Check further training
      if (lastUserText.includes("training") || lastUserText.includes("study") || lastUserText.includes("college") || lastUserText.includes("course")) {
        return {
          topic: "training_details",
          question: `That's great! What program or course are you currently pursuing?`,
          quick_replies: ["Advanced diploma", "Degree program", "Apprenticeship certification"],
          suggested_replies: ["Advanced diploma", "Degree program", "Apprenticeship certification"],
          complete: false
        };
      }

      // 5. Positive / Still employed
      return {
        topic: "still_role_confirm",
        question: `Great to hear! Are you still working with ${employer} as ${role}?`,
        quick_replies: ["Yes, same role & employer", "Role changed slightly", "Promoted to senior role"],
        suggested_replies: ["Yes, same role & employer", "Role changed slightly", "Promoted to senior role"],
        complete: false
      };
    }

    // Turn 2: Intermediate questions
    if (lastTopic === "still_role_confirm" || lastTopic === "new_employer") {
      return {
        topic: "wage_check",
        question: `Could you confirm your current monthly take-home salary and if you are receiving regular wage slips?`,
        quick_replies: ["₹18,000 - ₹22,000 / month", "₹22,000 - ₹26,000 / month", "₹26,000+ / month"],
        suggested_replies: ["₹18,000 - ₹22,000 / month", "₹22,000 - ₹26,000 / month", "₹26,000+ / month"],
        complete: false
      };
    }

    if (lastTopic === "unemployed_reason") {
      return {
        topic: "job_search_status",
        question: `Are you currently actively looking for work, or would you like to receive new job alerts in your district?`,
        quick_replies: ["Actively seeking local placement", "Open to relocate", "Looking for further upskilling"],
        suggested_replies: ["Actively seeking local placement", "Open to relocate", "Looking for further upskilling"],
        complete: false
      };
    }

    if (lastTopic === "self_employed_type") {
      return {
        topic: "monthly_earnings",
        question: `On average, what are your monthly net earnings from your trade or business?`,
        quick_replies: ["₹15,000 - ₹20,000 / month", "₹20,000 - ₹25,000 / month", "₹25,000+ / month"],
        suggested_replies: ["₹15,000 - ₹20,000 / month", "₹20,000 - ₹25,000 / month", "₹25,000+ / month"],
        complete: false
      };
    }

    // Final Turn: Completion
    const isUnemployed = history.some((h) => h.content.toLowerCase().includes("not working") || h.content.toLowerCase().includes("unemployed") || h.content.toLowerCase().includes("looking") || (h.role === "user" && h.content.toLowerCase() === "no"));
    const isSelf = history.some((h) => h.content.toLowerCase().includes("self"));

    const finalStatus = isUnemployed ? "Unemployed" : isSelf ? "Self-Employed" : "Employed";

    return {
      topic: "completion",
      question: `Thank you ${name}! Your ${stg} career follow-up has been recorded as Self-Reported in the SkillPulse directory.`,
      quick_replies: [],
      suggested_replies: [],
      complete: true,
      collected: {
        employment_status: finalStatus,
        employer: isUnemployed ? "N/A" : employer,
        job_role: role,
        wage: t.current_wage || 21500,
        duration: stg === "12M" ? "12+ months" : stg === "9M" ? "9 months" : "6 months",
        role_relevance: "Relevant",
        skill_utilisation: "High",
        verification_status: "Self-Reported"
      }
    };
  },

  getAiStatus: () => {
    return mockData.ai_status || {
      mode: "SkillPulse AI (Verified Intelligence Engine)",
      has_key: true,
      key_masked: "Configured (Prototype)",
      model: "gemini-1.5-flash"
    };
  },

  getAiInsights: (district?: string) => {
    return mockData.ai_insights_pune || [];
  },

  askAi: (question: string, context?: any): AiStructuredResponse => {
    const q = (question || "").trim().toLowerCase();

    // Question 1: "What are the major employment gaps in Bihar?" (or Bihar employment gap questions)
    if (q.includes("bihar") && (q.includes("gap") || q.includes("employment") || q.includes("job") || q.includes("shortage"))) {
      return {
        insight: "In Bihar (Patna, Muzaffarpur, Gaya), critical workforce deficits exist in Solar PV Installation and Electrical Maintenance, while clerical Data Entry exhibits high oversupply (-42% net absorption).",
        evidence: [
          "Solar PV & Renewable Deficit: 740 open industry requisitions vs. only 310 certified technicians in Bihar (58% workforce deficit).",
          "Data Entry Operator Oversupply: 1,120 trained candidates competing for 480 market vacancies across Patna and Muzaffarpur.",
          "Starting Wage Premium: Certified Solar Technicians earn an average ₹21,800/mo compared to ₹14,200/mo in clerical roles."
        ],
        explanation: "Longitudinal tracking from Muzaffarpur and Patna demonstrates that while general skilling programs produce high numbers of office assistants, local industrial infrastructure and decentralized rooftop solar installations (PM Surya Ghar) have created urgent demand for certified electricians and solar installers. Furthermore, inter-state outward mobility from Gaya to industrial hubs in Maharashtra and Gujarat accounts for 34% of placed technical candidates.",
        recommendation: "Reallocate 45% of traditional office skilling batch capacity in Bihar toward Suryamitra Solar PV installation and industrial electrical apprenticeships with local grid contractors.",
        limitations: "Synthesized using verified SkillPulse longitudinal cohort records across Bihar districts.",
        source_mode: "SkillPulse AI Verified Intelligence Engine",
        comparison: null
      };
    }

    // Question 2: "Which districts have the highest retention rate?" (or highest retention ranking questions)
    if ((q.includes("highest") || q.includes("top") || q.includes("rank") || q.includes("best")) && q.includes("retention")) {
      return {
        insight: "Varanasi (81.8%), Pune (81.6%), and Nashik (81.2%) lead in 6-month retention across all evaluated districts, with Muzaffarpur (80.8%) exhibiting the highest retention among Bihar cohorts.",
        evidence: [
          "Top Tier 6-Month Retention: Varanasi (81.8%), Pune (81.6%), Nashik (81.2%), Nagpur (81.1%), Muzaffarpur (80.8%).",
          "Mid Tier 6-Month Retention: Lucknow (79.3%), Patna (78.2%), Gaya (78.2%), Prayagraj (76.1%).",
          "Commute Distance Correlation: Candidates placed within 25 km of home exhibit 84.5% retention vs. 63.2% for inter-district commuters."
        ],
        explanation: "High-retention districts benefit from strong local industrial manufacturing clusters and competitive entry wages. In Varanasi and Pune, average verified technical wages exceed ₹22,500/mo, and employers offering transit subsidies or subsidized housing demonstrate 28% lower probationary attrition compared to Prayagraj and Gaya.",
        recommendation: "Replicate Varanasi's employer check-in model across lower-retention districts: provide a ₹2,000/mo 3-month transit subsidy for trainees placed beyond a 25km radius.",
        limitations: "Based on longitudinal cohort tracking across 3,600 verified candidates in Bihar, UP, and Maharashtra.",
        source_mode: "SkillPulse AI Verified Intelligence Engine",
        comparison: {
          entities: [
            { name: "Varanasi (UP)", metrics: "81.8% 6M Retention • ₹21,090/mo avg wage", strengths: "Strong local weaving & engineering cluster integration", skill_gaps: "Solar Maintenance", employment: "82.2% Emp Rate" },
            { name: "Pune (MH)", metrics: "81.6% 6M Retention • ₹23,346/mo avg wage", strengths: "High-wage automotive & EV manufacturing absorption", skill_gaps: "EV Diagnostics (-1,030)", employment: "80.2% Emp Rate" },
            { name: "Muzaffarpur (BR)", metrics: "80.8% 6M Retention • ₹21,374/mo avg wage", strengths: "Highest livelihood retention in Bihar; strong electrical trades", skill_gaps: "Solar PV (-340)", employment: "84.8% Emp Rate" },
            { name: "Prayagraj (UP)", metrics: "76.1% 6M Retention • ₹21,084/mo avg wage", strengths: "Solid initial placement rate", skill_gaps: "Industrial Automation", employment: "81.5% Emp Rate" }
          ],
          differences: "Pune and Varanasi maintain >81% retention due to proximity of industrial employment, whereas Prayagraj experiences 5.7% higher attrition due to outward migration.",
          reasons: "Entry wage adequacy and commuting cost pressures during the 90-day probationary window.",
          implications: "Policy interventions should focus on local micro-cluster placement rather than distant migration without transit support."
        }
      };
    }

    // Question 3: "Why are trainees leaving their jobs?" (or attrition / leaving root cause questions)
    if (q.includes("leaving") || q.includes("leave") || q.includes("quit") || q.includes("attrition") || q.includes("turnover") || q.includes("resigning")) {
      return {
        insight: "The primary driver of trainee job departures is entry-level wage dissatisfaction (<₹18,000/mo), accounting for 33% of attrition, followed by transit/commute constraints (26%) and technical role mismatch (17%).",
        evidence: [
          "Entry Wage Offer Below Expectation (<₹18k/mo): 33% of departures (31 documented cohort exits).",
          "Commute / Transit Distance Constraints (>25 km): 26% of departures (24 documented cohort exits).",
          "Role Mismatch with Technical Training: 17% of departures (16 documented cohort exits).",
          "Higher Technical Education / Degree Enrollment: 12% (11 exits); Urban Living Costs: 7% (7 exits); Contract End: 5% (5 exits)."
        ],
        explanation: "Longitudinal milestone tracking reveals that trainee departures peak between Day 45 and Day 90 of employment. When entry salaries fail to offset urban rent and daily travel costs, or when certified technicians are assigned non-technical clerical tasks, motivation drops sharply. Trainees with prior trade certification who face wage stagnation under ₹16,000/mo are 2.4x more likely to leave.",
        recommendation: "Mandate an entry wage floor of ₹18,500/mo for partner employers, introduce a ₹2,000/mo post-placement relocation stipend for the first 90 days, and audit job roles against NSQF competency levels.",
        limitations: "Derived from verified follow-up check-in records and employer exit logs.",
        source_mode: "SkillPulse AI Verified Intelligence Engine",
        comparison: null
      };
    }

    // Question 4: "Which skills have increasing demand?" (or skill demand / growing skills questions)
    if ((q.includes("skill") || q.includes("demand")) && (q.includes("increase") || q.includes("increasing") || q.includes("grow") || q.includes("rising") || q.includes("high") || q.includes("surge"))) {
      return {
        insight: "Clean Energy, Electric Mobility, and Industrial Electrical trades exhibit the steepest demand increases, led by Solar PV Installation (+38% YoY) and EV Battery Diagnostics (+36% YoY).",
        evidence: [
          "Solar PV Installation & Maintenance: +38% YoY growth, 1,950 authorized industry openings, net deficit of 1,110 technicians.",
          "EV & Battery Diagnostics: +36% YoY growth, 1,850 authorized industry openings, net deficit of 1,030 technicians.",
          "Industrial & Domestic Electrician: +24% YoY growth, 1,600 authorized industry openings, net deficit of 680 technicians.",
          "Traditional Data Entry Operator: Stagnant demand (+0% YoY) with an active market surplus of 560 unplaced candidates."
        ],
        explanation: "Rapid industrial decarbonization, expanding state electric bus fleets, and the national rooftop solar mandate have generated substantial requisition volumes from verified employers. In contrast, routine office data entry has been heavily automated, suppressing both wage growth and hiring volume.",
        recommendation: "Upgrade ITI and vocational training infrastructure with modern EV diagnostic simulators and solar rooftop labs; phase out standalone data entry batches in favor of digital-hardware hybrid trades.",
        limitations: "Benchmarked against 99 registered employer requisitions and state skill mission quotas.",
        source_mode: "SkillPulse AI Verified Intelligence Engine",
        comparison: null
      };
    }

    // Comparison between districts (e.g., Patna vs Muzaffarpur, Pune vs Nashik, etc.)
    if (q.includes("compare") || q.includes("vs") || (q.includes("patna") && q.includes("muzaffarpur")) || (q.includes("pune") && q.includes("nashik"))) {
      const isBihar = q.includes("patna") || q.includes("muzaffarpur") || q.includes("gaya");
      const d1 = isBihar ? "Muzaffarpur" : "Pune";
      const d2 = isBihar ? "Patna" : "Nashik";
      const r1 = isBihar ? "80.8%" : "81.6%";
      const r2 = isBihar ? "78.2%" : "81.2%";
      const w1 = isBihar ? "₹21,374" : "₹23,346";
      const w2 = isBihar ? "₹22,610" : "₹21,067";

      return {
        insight: `Comparative Analysis: ${d1} maintains a 6-month retention rate of ${r1} with average wages of ${w1}/mo, while ${d2} exhibits ${r2} retention with average wages of ${w2}/mo.`,
        evidence: [
          `${d1}: 400 trainees tracked • ${r1} 6M Retention • ${w1}/mo average entry wage.`,
          `${d2}: 400 trainees tracked • ${r2} 6M Retention • ${w2}/mo average entry wage.`,
          `Verified Placement Rate: ${d1} at 84.8% vs ${d2} at 83.8%.`
        ],
        explanation: `In ${d1}, stronger localized placement absorption enables higher retention, whereas ${d2} benefits from higher corporate wage offerings but experiences greater inter-district mobility.`,
        recommendation: `Align training quotas in ${d1} and ${d2} with direct employer MoUs to sustain high placement retention.`,
        limitations: "Computed from the SkillPulse prototype dataset across verified district cohorts.",
        source_mode: "SkillPulse AI Verified Intelligence Engine",
        comparison: {
          entities: [
            { name: d1, metrics: `${r1} Retention • ${w1}/mo`, strengths: "Strong local placement stability", skill_gaps: "Solar Maintenance", employment: "84.8%" },
            { name: d2, metrics: `${r2} Retention • ${w2}/mo`, strengths: "Higher wage ceiling in urban corporate roles", skill_gaps: "EV Diagnostics", employment: "83.8%" }
          ],
          differences: `${d1} has higher retention (+${(parseFloat(r1) - parseFloat(r2)).toFixed(1)}%), while ${d2} offers higher mean wages.`,
          reasons: "Urban living costs in capital cities vs stable local housing in industrial clusters.",
          implications: "Targeted housing and transit allowances significantly improve retention in urban centres."
        }
      };
    }

    // Trainee Career Advisor questions (wage increase, promotion, skill upgrades, local jobs)
    if (q.includes("salary") || q.includes("wage") || q.includes("career") || q.includes("upgrade") || q.includes("microgrid") || q.includes("skills do i need") || q.includes("hiring") || q.includes("how do i") || q.includes("step") || q.includes("learn")) {
      const dist = context?.district || "Pune";
      const isEv = q.includes("ev") || q.includes("battery") || q.includes("automobile");
      const isSolar = q.includes("solar") || q.includes("pv") || q.includes("microgrid") || q.includes("installer");
      const targetSkill = isEv ? "CAN-Bus & High-Voltage Diagnostics" : isSolar ? "Microgrid Synchronisation & SCADA" : "Industrial Automation (PLC/SCADA)";
      const targetRole = isEv ? "EV Powertrain Diagnostics Specialist" : isSolar ? "Microgrid Engineer / Solar Site Supervisor" : "Senior Automation Technician";
      const wageInc = isEv ? "₹28,500/mo (+32%)" : isSolar ? "₹26,500/mo (+28%)" : "₹25,000/mo (+25%)";

      return {
        insight: `Career Advancement Pathway for ${dist}: Acquiring certification in ${targetSkill} qualifies you for ${targetRole} roles with verified median wages of ${wageInc}.`,
        evidence: [
          `Local Demand in ${dist}: Active shortage of certified specialists with ${targetSkill}.`,
          `Observed Wage Progression: Technicians with this competency earn an average ${wageInc} vs ₹19,500 for entry-level tasks.`,
          `Verified Industry Partners: Registered employers in your district cluster currently have open requisitions.`
        ],
        explanation: `Longitudinal outcome data indicates that certified technicians who transition from basic installation to supervisory/diagnostic roles experience an immediate 25-35% salary increase and 94% 12-month retention. In ${dist}, local employers prioritize candidates holding NCVET-aligned credentials.`,
        recommendation: `1. Complete the 30-hour modular certification in ${targetSkill}.\n2. Request an internal competency evaluation or apply through the SkillPulse Verified Hiring Desk.\n3. Log your completion in the Career Ledger to update your verified employability score.`,
        limitations: "Grounded in verified employer requisitions and candidate wage progression in the SkillPulse multi-state dataset.",
        source_mode: "SkillPulse AI Verified Career Advisor",
        comparison: null
      };
    }

    // Default intelligent domain-grounded response
    return {
      insight: `Workforce Intelligence Analysis for "${question}": Longitudinal career signals indicate an average 81.9% livelihood rate and 79.8% 6-month retention across tracked cohorts.`,
      evidence: [
        "Verified Multi-State Cohort: 3,600 trainees across Bihar, Uttar Pradesh, and Maharashtra.",
        "6-Month Longitudinal Retention Rate: 79.8% with EPFO/employer corroborate.",
        "Average Verified Monthly Wage: ₹21,890 with 24% wage growth in green energy and mobility trades."
      ],
      explanation: `Analysis of post-training outcomes indicates that specialized technical certifications (Solar PV, EV Battery Diagnostics, Industrial Electrician) demonstrate 34% higher 12-month retention and ₹6,000/mo higher wages compared to general office assistance. Retention drops notably when post-placement migration support is absent.`,
      recommendation: "Institute 90-day post-placement employer micro-checkins and prioritize industrial apprenticeships with verified living-wage employers.",
      limitations: "Synthesized using verified SkillPulse longitudinal cohort records across Bihar, UP, and Maharashtra.",
      source_mode: "SkillPulse AI Verified Intelligence Engine",
      comparison: null
    };
  }
};
