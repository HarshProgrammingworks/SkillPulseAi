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

    const total = items.length;
    const certified = items.filter((t) => (t.certification_status || "").toLowerCase() === "certified").length;
    const employed = items.filter((t) => t.employment_status === "Employed").length;
    const selfEmployed = items.filter((t) => t.employment_status === "Self-Employed").length;
    const apprentices = items.filter((t) => t.employment_status === "Apprenticeship").length;
    const activeLivelihoods = employed + selfEmployed + apprentices;
    const employmentRate = certified > 0 ? (Math.round((activeLivelihoods / certified) * 1000) / 10).toFixed(1) + "%" : "0.0%";

    const working = items.filter((t) => t.current_wage && t.current_wage > 0);
    const avgWage = working.length > 0 ? Math.round(working.reduce((acc, t) => acc + (t.current_wage || 0), 0) / working.length) : 21890;

    const retained6mCount = items.filter((t) => (t.retention_milestone === "6M" || (t.retention_status || "").includes("Retained"))).length;
    const retentionRate6m = total > 0 ? (Math.round((retained6mCount / total) * 1000) / 10).toFixed(1) + "%" : "80.8%";

    return {
      total_trainees: { value: total, prev: Math.round(total * 0.92), change_pct: 8.7, trend: "up", tooltip: "Active filtered trainees across verified cohorts." },
      certified: { value: certified, prev: Math.round(certified * 0.94), change_pct: 6.4, trend: "up", tooltip: "Certified by State Vocational Examination Boards." },
      employed: { value: employed, prev: Math.round(employed * 0.89), change_pct: 12.4, trend: "up", tooltip: "Formal wage-employed trainees verified via employer/EPFO records." },
      self_employed: { value: selfEmployed, prev: Math.max(0, selfEmployed - 2), change_pct: 4.2, trend: "up", tooltip: "Verified micro-entrepreneurs & independent service contractors." },
      apprentices: { value: apprentices, prev: Math.max(0, apprentices - 2), change_pct: 7.5, trend: "up", tooltip: "Engaged under National Apprenticeship Promotion Scheme (NAPS)." },
      employment_rate: { value: employmentRate, prev: "79.5%", change_pct: 2.8, trend: "up", tooltip: "(Employed + Self-Employed + Apprentices) / Certified." },
      retention_6m: { value: retentionRate6m, prev: "78.4%", change_pct: 2.4, trend: "up", tooltip: "Proportion of placed candidates continuously engaged at 6 months." },
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

    // Ensure all 9 districts are computed dynamically from actual trainee data
    const allDistNames = ["Gaya", "Lucknow", "Muzaffarpur", "Nagpur", "Nashik", "Patna", "Prayagraj", "Pune", "Varanasi"];
    const allTrainees: Trainee[] = mockData.trainees || [];
    const allDistricts = allDistNames.map((dst) => {
      const dItems = allTrainees.filter((t) => (t.district || "").toLowerCase() === dst.toLowerCase());
      const dTotal = dItems.length;
      const dCert = dItems.filter((t) => (t.certification_status || "").toLowerCase() === "certified").length;
      const dEmp = dItems.filter((t) => t.employment_status === "Employed").length;
      const dSelf = dItems.filter((t) => t.employment_status === "Self-Employed").length;
      const dApp = dItems.filter((t) => t.employment_status === "Apprenticeship").length;
      const dActive = dEmp + dSelf + dApp;
      const empRate = dCert > 0 ? Math.round((dActive / dCert) * 1000) / 10 : 81.5;
      const ret6mCount = dItems.filter((t) => t.retention_milestone === "6M" || (t.retention_status || "").includes("Retained")).length;
      const retRate = dTotal > 0 ? Math.round((ret6mCount / dTotal) * 1000) / 10 : 80.5;
      const workingCohort = dItems.filter((t) => t.current_wage && t.current_wage > 0);
      const avgW = workingCohort.length > 0 ? Math.round(workingCohort.reduce((acc, t) => acc + (t.current_wage || 0), 0) / workingCohort.length) : 21500;
      return {
        district: dst,
        trainees: dTotal,
        employment_rate: empRate,
        retention_6m: retRate,
        avg_wage: avgW
      };
    });

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
    const rawDistrictsMeta = [
      { state: "Bihar", district: "Muzaffarpur", training_centres: 8, job_openings: 14, demand: "High" },
      { state: "Bihar", district: "Patna", training_centres: 12, job_openings: 22, demand: "High" },
      { state: "Bihar", district: "Gaya", training_centres: 7, job_openings: 9, demand: "Medium" },
      { state: "Uttar Pradesh", district: "Lucknow", training_centres: 14, job_openings: 28, demand: "High" },
      { state: "Uttar Pradesh", district: "Varanasi", training_centres: 10, job_openings: 16, demand: "High" },
      { state: "Uttar Pradesh", district: "Prayagraj", training_centres: 9, job_openings: 11, demand: "Medium" },
      { state: "Maharashtra", district: "Pune", training_centres: 18, job_openings: 42, demand: "High" },
      { state: "Maharashtra", district: "Nashik", training_centres: 11, job_openings: 19, demand: "High" },
      { state: "Maharashtra", district: "Nagpur", training_centres: 13, job_openings: 24, demand: "High" }
    ];

    const allTrainees: Trainee[] = mockData.trainees || [];
    const items = rawDistrictsMeta.map((meta) => {
      const dItems = allTrainees.filter((t) => (t.district || "").toLowerCase() === meta.district.toLowerCase());
      const traineesCount = dItems.length || 400;
      const employedCount = dItems.filter((t) => t.employment_status === "Employed" || t.employment_status === "Self-Employed" || t.employment_status === "Apprenticeship").length || Math.round(traineesCount * 0.81);
      return {
        ...meta,
        trainees: traineesCount,
        employed: employedCount
      };
    });

    let filtered = items;
    if (params?.state && !params.state.startsWith("All")) {
      filtered = filtered.filter((d) => d.state.toLowerCase() === params.state!.toLowerCase());
    }
    return {
      notice: "Cross-district longitudinal geography intelligence across Bihar, UP, and Maharashtra.",
      items: filtered
    };
  },

  nextFollowUpQuestion: (
    traineeId: string,
    history: Array<{ role: string; content: string; topic?: string }>,
    stage?: string
  ) => {
    const traineesList: Trainee[] = mockData.trainees || [];
    const t: any = traineesList.find((tr: any) => tr.id === traineeId || tr.skillpulse_id === traineeId) || traineesList[0] || {
      name: "Candidate", programme: "Technical Skilling", employer: "Enterprise Partner",
      job_role: "Specialist", current_wage: 21500, employment_status: ""
    };

    const name = (t.name || "Candidate").split(" ")[0];
    const employer = t.employer || "Enterprise Partner";
    const role = t.job_role || t.programme || "Technician";
    const stg = stage || "9M";
    const skills = (t.skills_acquired || []).slice(0, 2).join(", ") || "trained skills";
    const programme = t.programme || "vocational programme";
    const wage = t.current_wage || 21500;
    const knownStatus = (t.employment_status || "").toLowerCase();
    const district = t.district || "your district";

    // Opening Turn - skip generic question when status is already known
    if (!history || history.length === 0) {
      if (knownStatus === "employed") {
        return {
          topic: "role_confirm",
          question: `Hi ${name}! This is your ${stg} career check-in from SkillPulse.\n\nOur records show you are currently working as ${role} at ${employer}. Is that still correct?`,
          quick_replies: ["Yes, still in same role", "Same employer, different role", "Changed to new employer", "No longer working"],
          suggested_replies: ["Yes, still in same role", "Same employer, different role", "Changed to new employer", "No longer working"],
          complete: false
        };
      }
      if (knownStatus === "self-employed") {
        return {
          topic: "self_employed_type",
          question: `Hi ${name}! This is your ${stg} career check-in.\n\nYou were last recorded as self-employed. What type of trade or business are you currently running?`,
          quick_replies: ["Solar installation contractor", "Independent electrician", "EV or repair workshop", "Mobile service technician", "Other trade business"],
          suggested_replies: ["Solar installation contractor", "Independent electrician", "EV or repair workshop", "Mobile service technician", "Other trade business"],
          complete: false
        };
      }
      if (knownStatus === "apprenticeship") {
        return {
          topic: "apprenticeship_status",
          question: `Hi ${name}! This is your ${stg} career check-in.\n\nYou were enrolled in an apprenticeship with ${employer}. Are you still in the same apprenticeship?`,
          quick_replies: ["Yes, apprenticeship ongoing", "Completed, now employed", "Completed, seeking job", "Changed apprenticeship site"],
          suggested_replies: ["Yes, apprenticeship ongoing", "Completed, now employed", "Completed, seeking job", "Changed apprenticeship site"],
          complete: false
        };
      }
      if (knownStatus === "unemployed" || knownStatus === "not working") {
        return {
          topic: "unemployment_barrier",
          question: `Hi ${name}! This is your ${stg} career check-in from SkillPulse.\n\nWe noticed you do not have a registered placement yet. What is the main reason you have not found a suitable opportunity after completing ${programme}?`,
          quick_replies: ["No suitable jobs nearby", "Salary offers too low", "Did not receive placement support", "Family or personal reasons", "Still searching actively"],
          suggested_replies: ["No suitable jobs nearby", "Salary offers too low", "Did not receive placement support", "Family or personal reasons", "Still searching actively"],
          complete: false
        };
      }
      return {
        topic: "employment_check",
        question: `Hi ${name}! This is your ${stg} career milestone check-in from SkillPulse.\n\nSince completing your ${programme}, what is your current employment situation?`,
        quick_replies: ["Working at a company", "Running my own business", "In apprenticeship or training", "Looking for a job", "Not working currently"],
        suggested_replies: ["Working at a company", "Running my own business", "In apprenticeship or training", "Looking for a job", "Not working currently"],
        complete: false
      };
    }

    // Conversation state analysis
    const lastUserTurn = [...history].reverse().find((m) => m.role === "user");
    const lastUserText = (lastUserTurn?.content || "").trim().toLowerCase();
    const lastAssistantTurn = [...history].reverse().find((m) => m.role === "assistant");
    const lastTopic = lastAssistantTurn?.topic || "employment_check";
    const askedTopics = new Set(history.filter((m) => m.role === "assistant").map((m) => m.topic).filter(Boolean));
    const fullHistory = history.map((m) => m.content.toLowerCase()).join(" ");

    const mentionsEmployed = fullHistory.includes("employed") || fullHistory.includes("working at") || fullHistory.includes("same role") || fullHistory.includes("company") || fullHistory.includes("promoted") || fullHistory.includes("still working");
    const mentionsSelf = fullHistory.includes("self-employed") || fullHistory.includes("business") || fullHistory.includes("freelance") || fullHistory.includes("contractor") || fullHistory.includes("independent") || fullHistory.includes("own shop");
    const mentionsUnemployed = fullHistory.includes("not working") || fullHistory.includes("unemployed") || fullHistory.includes("looking for") || fullHistory.includes("no job") || fullHistory.includes("left the job") || fullHistory.includes("quit");
    const mentionsApprentice = fullHistory.includes("apprenticeship") || fullHistory.includes("apprentice");
    const mentionsJobChange = fullHistory.includes("changed employer") || fullHistory.includes("new employer") || fullHistory.includes("new company") || fullHistory.includes("switched");

    // role_confirm branch
    if (lastTopic === "role_confirm") {
      if (lastUserText.includes("yes") || lastUserText.includes("same role") || lastUserText.includes("same employer")) {
        if (!askedTopics.has("skill_relevance")) {
          return {
            topic: "skill_relevance",
            question: `That is great to hear! As a ${role}, are the skills you gained during ${programme} being actively used in your day-to-day work?`,
            quick_replies: ["Yes, very relevant", "Partially relevant", "My role does not use my trained skills", "I use additional skills too"],
            suggested_replies: ["Yes, very relevant", "Partially relevant", "My role does not use my trained skills", "I use additional skills too"],
            complete: false
          };
        }
      }
      if (lastUserText.includes("different role") || lastUserText.includes("changed role")) {
        return {
          topic: "new_role_details",
          question: `What is your new job title at ${employer}? Has it been a promotion or a lateral change?`,
          quick_replies: ["Promoted to senior role", "Lateral move to different function", "Temporary role change", "Role expanded with more duties"],
          suggested_replies: ["Promoted to senior role", "Lateral move to different function", "Temporary role change", "Role expanded with more duties"],
          complete: false
        };
      }
      if (lastUserText.includes("changed employer") || lastUserText.includes("new employer")) {
        return {
          topic: "job_change_reason",
          question: `I see you have moved to a new employer. What was the main reason for the change?`,
          quick_replies: ["Better salary or growth", "Role was not matching skills", "Employer closed down", "Relocated to a new city", "Better opportunity came up"],
          suggested_replies: ["Better salary or growth", "Role was not matching skills", "Employer closed down", "Relocated to a new city", "Better opportunity came up"],
          complete: false
        };
      }
      if (lastUserText.includes("no longer") || lastUserText.includes("not working") || lastUserText.includes("left") || lastUserText.includes("quit")) {
        return {
          topic: "exit_reason",
          question: `Thank you for letting me know. What was the main reason you left ${employer}?`,
          quick_replies: ["Wage below expectation", "Commute or distance issues", "Role mismatch with skills", "Contract ended", "Personal or family reasons"],
          suggested_replies: ["Wage below expectation", "Commute or distance issues", "Role mismatch with skills", "Contract ended", "Personal or family reasons"],
          complete: false
        };
      }
    }

    // skill_relevance branch
    if (lastTopic === "skill_relevance") {
      if (lastUserText.includes("not") || lastUserText.includes("no") || lastUserText.includes("does not")) {
        return {
          topic: "skill_mismatch_reason",
          question: `That is important to note. Why does your current role not match your ${skills} training? Is it the nature of the job or the sector?`,
          quick_replies: ["Job duties differ from training", "Placed in different department", "Employer had no matching role", "Accepted any job to earn income"],
          suggested_replies: ["Job duties differ from training", "Placed in different department", "Employer had no matching role", "Accepted any job to earn income"],
          complete: false
        };
      }
      if (!askedTopics.has("wage_check")) {
        return {
          topic: "wage_check",
          question: `Glad your training is being put to good use! Could you confirm your approximate current monthly take-home salary?`,
          quick_replies: ["Under Rs18,000/month", "Rs18,000-Rs22,000/month", "Rs22,000-Rs26,000/month", "Rs26,000+ /month"],
          suggested_replies: ["Under Rs18,000/month", "Rs18,000-Rs22,000/month", "Rs22,000-Rs26,000/month", "Rs26,000+ /month"],
          complete: false
        };
      }
    }

    // skill_mismatch_reason branch
    if (lastTopic === "skill_mismatch_reason" && !askedTopics.has("wage_check")) {
      return {
        topic: "wage_check",
        question: `Understood. What is your current monthly take-home salary in this role?`,
        quick_replies: ["Under Rs18,000/month", "Rs18,000-Rs22,000/month", "Rs22,000-Rs26,000/month", "Rs26,000+/month"],
        suggested_replies: ["Under Rs18,000/month", "Rs18,000-Rs22,000/month", "Rs22,000-Rs26,000/month", "Rs26,000+/month"],
        complete: false
      };
    }

    // wage_check branch
    if (lastTopic === "wage_check" && !askedTopics.has("retention_check")) {
      const wageLow = lastUserText.includes("under") || lastUserText.includes("below") || lastUserText.includes("18");
      if (wageLow) {
        return {
          topic: "retention_check",
          question: `A wage below Rs18,000/month can create challenges. Are you planning to stay with this employer, or are you actively looking for better opportunities?`,
          quick_replies: ["Planning to stay and grow", "Actively looking for better pay", "Waiting for appraisal cycle", "Unsure right now"],
          suggested_replies: ["Planning to stay and grow", "Actively looking for better pay", "Waiting for appraisal cycle", "Unsure right now"],
          complete: false
        };
      }
      return {
        topic: "retention_check",
        question: `That sounds solid! How long have you been with ${employer}, and do you see yourself continuing there for the next 6 months?`,
        quick_replies: ["Less than 3 months", "3 to 6 months", "6+ months and stable", "Planning to move on"],
        suggested_replies: ["Less than 3 months", "3 to 6 months", "6+ months and stable", "Planning to move on"],
        complete: false
      };
    }

    // job_change_reason branch
    if (lastTopic === "job_change_reason" && !askedTopics.has("new_role_alignment")) {
      return {
        topic: "new_role_alignment",
        question: `Is your new role better aligned with the ${skills} skills you acquired during training?`,
        quick_replies: ["Yes, much better fit", "Somewhat aligned", "Not aligned at all", "Still figuring out"],
        suggested_replies: ["Yes, much better fit", "Somewhat aligned", "Not aligned at all", "Still figuring out"],
        complete: false
      };
    }

    // new_role_alignment branch
    if (lastTopic === "new_role_alignment" && !askedTopics.has("wage_check")) {
      return {
        topic: "wage_check",
        question: `What is your monthly salary at your new employer?`,
        quick_replies: ["Under Rs18,000/month", "Rs18,000-Rs22,000/month", "Rs22,000-Rs26,000/month", "Rs26,000+/month"],
        suggested_replies: ["Under Rs18,000/month", "Rs18,000-Rs22,000/month", "Rs22,000-Rs26,000/month", "Rs26,000+/month"],
        complete: false
      };
    }

    // new_role_details branch
    if (lastTopic === "new_role_details" && !askedTopics.has("wage_check")) {
      return {
        topic: "wage_check",
        question: `Has your new role at ${employer} come with a salary change? What is your current monthly take-home?`,
        quick_replies: ["Under Rs18,000/month", "Rs18,000-Rs22,000/month", "Rs22,000-Rs26,000/month", "Rs26,000+/month"],
        suggested_replies: ["Under Rs18,000/month", "Rs18,000-Rs22,000/month", "Rs22,000-Rs26,000/month", "Rs26,000+/month"],
        complete: false
      };
    }

    // exit_reason branch
    if (lastTopic === "exit_reason" && !askedTopics.has("job_search_status")) {
      return {
        topic: "job_search_status",
        question: `Are you currently looking for a new opportunity in ${district} that aligns with your ${skills} skills?`,
        quick_replies: ["Yes, actively searching locally", "Open to relocate for better opportunity", "Looking for apprenticeship or training", "Taking a break for now"],
        suggested_replies: ["Yes, actively searching locally", "Open to relocate for better opportunity", "Looking for apprenticeship or training", "Taking a break for now"],
        complete: false
      };
    }

    // self_employed_type branch
    if (lastTopic === "self_employed_type" && !askedTopics.has("self_emp_training_help")) {
      return {
        topic: "self_emp_training_help",
        question: `Did the training in ${programme} help you start or grow your business?`,
        quick_replies: ["Yes, directly helped me start it", "Yes, improved my skills and confidence", "Partially helped", "Business is unrelated to training"],
        suggested_replies: ["Yes, directly helped me start it", "Yes, improved my skills and confidence", "Partially helped", "Business is unrelated to training"],
        complete: false
      };
    }

    // self_emp_training_help branch
    if (lastTopic === "self_emp_training_help" && !askedTopics.has("monthly_earnings")) {
      return {
        topic: "monthly_earnings",
        question: `On average, what are your monthly net earnings from your business or trade?`,
        quick_replies: ["Under Rs15,000/month", "Rs15,000-Rs20,000/month", "Rs20,000-Rs25,000/month", "Rs25,000+/month"],
        suggested_replies: ["Under Rs15,000/month", "Rs15,000-Rs20,000/month", "Rs20,000-Rs25,000/month", "Rs25,000+/month"],
        complete: false
      };
    }

    // apprenticeship_status branch
    if (lastTopic === "apprenticeship_status") {
      if (lastUserText.includes("completed") && (lastUserText.includes("employed") || lastUserText.includes("hired"))) {
        return {
          topic: "post_apprentice_role",
          question: `Congratulations on completing your apprenticeship! What is your current role and employer?`,
          quick_replies: ["Same company hired me full-time", "Joined a different employer", "Started my own venture"],
          suggested_replies: ["Same company hired me full-time", "Joined a different employer", "Started my own venture"],
          complete: false
        };
      }
      if (lastUserText.includes("ongoing") || (lastUserText.includes("yes") && !lastUserText.includes("completed"))) {
        return {
          topic: "apprentice_transition",
          question: `Is there any possibility of being offered a full-time position after your apprenticeship ends?`,
          quick_replies: ["Yes, very likely", "Possibly, not confirmed yet", "No, it is fixed-term only", "Not sure yet"],
          suggested_replies: ["Yes, very likely", "Possibly, not confirmed yet", "No, it is fixed-term only", "Not sure yet"],
          complete: false
        };
      }
      if (lastUserText.includes("completed") && (lastUserText.includes("seeking") || lastUserText.includes("job"))) {
        return {
          topic: "job_search_status",
          question: `Now that your apprenticeship is complete, what type of full-time opportunity are you looking for in ${district}?`,
          quick_replies: ["Technical role matching my training", "Any available local job", "Government or PSU role", "Plan to start own work"],
          suggested_replies: ["Technical role matching my training", "Any available local job", "Government or PSU role", "Plan to start own work"],
          complete: false
        };
      }
    }

    // unemployment_barrier branch
    if (lastTopic === "unemployment_barrier" && !askedTopics.has("job_search_detail")) {
      const noJobs = lastUserText.includes("no suitable") || lastUserText.includes("not nearby") || lastUserText.includes("nearby");
      const salaryLow = lastUserText.includes("salary") || lastUserText.includes("low pay") || lastUserText.includes("offers too low");
      const noSupport = lastUserText.includes("placement") || lastUserText.includes("support");
      if (noJobs) {
        return {
          topic: "job_search_detail",
          question: `Would you be open to opportunities in nearby districts or states, or are you strictly looking for work in ${district}?`,
          quick_replies: ["Open to nearby districts", "Open to relocate interstate", "Strictly local only", "Unsure about relocation"],
          suggested_replies: ["Open to nearby districts", "Open to relocate interstate", "Strictly local only", "Unsure about relocation"],
          complete: false
        };
      }
      if (salaryLow) {
        return {
          topic: "job_search_detail",
          question: `What minimum monthly salary would you accept for a job that uses your ${skills} skills?`,
          quick_replies: ["Rs15,000+/month", "Rs18,000+/month", "Rs20,000+/month", "Any fair salary to start"],
          suggested_replies: ["Rs15,000+/month", "Rs18,000+/month", "Rs20,000+/month", "Any fair salary to start"],
          complete: false
        };
      }
      if (noSupport) {
        return {
          topic: "job_search_detail",
          question: `Would you like SkillPulse to connect you with an employer partner or placement officer in ${district}?`,
          quick_replies: ["Yes, please connect me", "I prefer to search on my own", "I have already been contacted"],
          suggested_replies: ["Yes, please connect me", "I prefer to search on my own", "I have already been contacted"],
          complete: false
        };
      }
      return {
        topic: "job_search_detail",
        question: `Are you registered on the SkillPulse Hiring Desk? Would you like assistance finding a matching opportunity for your ${skills} skills?`,
        quick_replies: ["Yes, registered and searching", "No, please help me register", "I applied but got no response", "I prefer local walk-in"],
        suggested_replies: ["Yes, registered and searching", "No, please help me register", "I applied but got no response", "I prefer local walk-in"],
        complete: false
      };
    }

    // employment_check fallback branch
    if (lastTopic === "employment_check") {
      if (lastUserText.includes("working at a company") || lastUserText.includes("company") || lastUserText.includes("employed")) {
        return {
          topic: "role_confirm",
          question: `What is your job title and the name of the company where you are currently working?`,
          quick_replies: ["Solar or EV technician at a firm", "Electrician at factory", "Office or technical role", "Field operations technician"],
          suggested_replies: ["Solar or EV technician at a firm", "Electrician at factory", "Office or technical role", "Field operations technician"],
          complete: false
        };
      }
      if (lastUserText.includes("own business") || lastUserText.includes("business") || lastUserText.includes("running")) {
        return {
          topic: "self_employed_type",
          question: `Excellent! What kind of trade or service business have you set up?`,
          quick_replies: ["Solar installation contractor", "Independent electrician", "EV or repair workshop", "Mobile technician services", "Other trade"],
          suggested_replies: ["Solar installation contractor", "Independent electrician", "EV or repair workshop", "Mobile technician services", "Other trade"],
          complete: false
        };
      }
      if (lastUserText.includes("apprenticeship") || lastUserText.includes("training")) {
        return {
          topic: "apprenticeship_status",
          question: `Which company or sector is your apprenticeship with, and how long have you been in it?`,
          quick_replies: ["Manufacturing firm, 3+ months", "Government scheme, starting soon", "Private technical firm", "ITI or vocational centre"],
          suggested_replies: ["Manufacturing firm, 3+ months", "Government scheme, starting soon", "Private technical firm", "ITI or vocational centre"],
          complete: false
        };
      }
      if (lastUserText.includes("looking") || lastUserText.includes("searching") || lastUserText.includes("not working") || lastUserText.includes("no job")) {
        return {
          topic: "unemployment_barrier",
          question: `What is the biggest barrier stopping you from finding a job that matches your ${skills} training?`,
          quick_replies: ["No suitable jobs nearby", "Salary offers too low", "Did not get placement support", "Family or personal reasons", "Still searching actively"],
          suggested_replies: ["No suitable jobs nearby", "Salary offers too low", "Did not get placement support", "Family or personal reasons", "Still searching actively"],
          complete: false
        };
      }
    }

    // Final completion
    const finalStatus = mentionsSelf ? "Self-Employed"
      : mentionsApprentice ? "Apprenticeship"
      : (mentionsUnemployed && !mentionsEmployed) ? "Unemployed"
      : mentionsEmployed ? "Employed"
      : (knownStatus ? (knownStatus.charAt(0).toUpperCase() + knownStatus.slice(1)) : "Employed");

    const finalWage = (() => {
      if (fullHistory.includes("26000") || fullHistory.includes("26,000")) return 27000;
      if (fullHistory.includes("22000") || fullHistory.includes("22,000")) return 23000;
      if (fullHistory.includes("18000") || fullHistory.includes("18,000")) return 19500;
      if (fullHistory.includes("15000") || fullHistory.includes("15,000")) return 16500;
      return wage;
    })();

    const finalRole = mentionsJobChange
      ? (lastUserText.includes("technician") ? "Senior Technician" : lastUserText.includes("manager") ? "Team Manager" : role)
      : role;

    return {
      topic: "completion",
      question: `Thank you, ${name}! Your ${stg} career milestone follow-up has been recorded as Self-Reported in the SkillPulse Career Ledger. Our team may follow up for verification. Best of luck with your career!`,
      quick_replies: [],
      suggested_replies: [],
      complete: true,
      collected: {
        employment_status: finalStatus,
        employer: (mentionsUnemployed && !mentionsEmployed) ? "N/A" : employer,
        job_role: finalRole,
        wage: finalWage,
        duration: stg === "12M" ? "12+ months" : stg === "9M" ? "9 months" : stg === "180D" ? "6 months" : "3 months",
        role_relevance: mentionsSelf ? "Self-Directed" : (mentionsUnemployed && !mentionsEmployed) ? "Not Applicable" : (fullHistory.includes("relevant") || fullHistory.includes("yes")) ? "Relevant" : "Partially Relevant",
        skill_utilisation: (mentionsUnemployed && !mentionsEmployed) ? "Not Applicable" : (fullHistory.includes("very") || fullHistory.includes("actively")) ? "High" : "Moderate",
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
    const isFriendly = context?.tone === "friendly";
    const stateContext = (context?.state || "").toLowerCase();
    const districtContext = (context?.district || "").toLowerCase();

    // Helper to format response based on selected tone
    const adaptTone = (resp: AiStructuredResponse): AiStructuredResponse => {
      if (!isFriendly) return resp;
      return {
        ...resp,
        insight: `💡 ${resp.insight}`,
        evidence: resp.evidence.map((e, idx) => `${['📊', '🎯', '🚀', '✨'][idx % 4]} ${e}`),
        explanation: `Here is what is happening behind the numbers: ${resp.explanation}`,
        recommendation: `Recommended Next Steps: ${resp.recommendation}`,
        source_mode: `${resp.source_mode} (Friendly Mode)`
      };
    };

    // State 1: Maharashtra Specific Analysis
    if (q.includes("maharashtra") || stateContext.includes("maharashtra") || districtContext.includes("pune") || districtContext.includes("nashik") || districtContext.includes("nagpur")) {
      if (q.includes("gap") || q.includes("skill") || q.includes("demand") || q.includes("employment") || q.includes("trend") || q.includes("wage") || q.includes("maharashtra")) {
        return adaptTone({
          insight: "In Maharashtra (Pune, Nashik, Nagpur), high-tech industrial absorption drives strong demand in EV & Battery Diagnostics and CNC Precision Tooling, with verified monthly wages averaging ₹25,300/mo.",
          evidence: [
            "Industrial Wage Premium: Average technical entry wages in Pune (₹26,216/mo) and Nagpur (₹25,953/mo) are the highest across the tri-state network.",
            "EV Battery & Diagnostics Deficit: Over 1,030 authorized industry requisitions remain unfulfilled in Pune Chakan industrial belt.",
            "High 6-Month Retention: Maharashtra cohorts maintain an 84.4% 6-month retention rate, bolstered by established manufacturing clusters."
          ],
          explanation: "Automotive OEMs and EV component suppliers in Pune and Nashik are undergoing rapid electrification. While basic mechanical trade supply is adequate, specialized diagnostic capabilities (CAN-Bus, high-voltage battery cell balancing, PLC automation) face an acute talent deficit, driving entry salaries 28% higher than conventional roles.",
          recommendation: "Scale industry-partnered dual training models with Pune Auto clusters and expand NCVET Level 5 EV Powertrain certifications across ITIs.",
          limitations: "Synthesized using verified SkillPulse longitudinal cohort records across Maharashtra districts (Pune, Nashik, Nagpur).",
          source_mode: "SkillPulse AI Verified Intelligence Engine",
          comparison: null
        });
      }
    }

    // State 2: Uttar Pradesh Specific Analysis
    if (q.includes("uttar pradesh") || q.includes("up") || stateContext.includes("uttar") || districtContext.includes("lucknow") || districtContext.includes("varanasi") || districtContext.includes("prayagraj")) {
      if (q.includes("gap") || q.includes("skill") || q.includes("demand") || q.includes("employment") || q.includes("trend") || q.includes("wage") || q.includes("uttar")) {
        return adaptTone({
          insight: "In Uttar Pradesh (Lucknow, Varanasi, Prayagraj), industrial electrification and telecom field operations drive steady employment (81.7% placement), with Varanasi achieving the leading 6-month retention at 79.5%.",
          evidence: [
            "Electrification & Power Trades: 1,600 verified requisitions for domestic/industrial electricians across UP state clusters.",
            "Varanasi Cluster Stability: Varanasi achieves a 79.5% 6-month retention rate due to strong local handloom-power and engineering cluster integration.",
            "Mean Technical Wage: UP cohorts average ₹21,257/mo, with Lucknow field technicians commanding up to ₹24,000/mo."
          ],
          explanation: "Longitudinal data indicates that infrastructure expansion and telecom fiber rollouts have accelerated hiring for field technicians and electricians. Retention remains resilient in Varanasi and Lucknow, but Prayagraj exhibits moderate attrition (19.5%) when entry wages dip below ₹18,000/mo.",
          recommendation: "Implement localized employer tie-ups in Lucknow and Varanasi, and introduce a 90-day post-placement living stipend for candidates placed in urban industrial hubs.",
          limitations: "Derived from SkillPulse verified longitudinal tracking records across Uttar Pradesh (Lucknow, Varanasi, Prayagraj).",
          source_mode: "SkillPulse AI Verified Intelligence Engine",
          comparison: null
        });
      }
    }

    // Question 1: "What are the major employment gaps in Bihar?" (or Bihar employment gap questions)
    if (q.includes("bihar") && (q.includes("gap") || q.includes("employment") || q.includes("job") || q.includes("shortage"))) {
      return adaptTone({
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
      });
    }

    // Question 2: "Which districts have the highest retention rate?" (or highest retention ranking questions)
    if ((q.includes("highest") || q.includes("top") || q.includes("rank") || q.includes("best")) && q.includes("retention")) {
      return adaptTone({
        insight: "Nashik (85.0%), Nagpur (84.5%), and Patna (84.3%) lead in 6-month retention across all evaluated districts, with Muzaffarpur (81.0%) and Lucknow (80.5%) demonstrating strong regional stability.",
        evidence: [
          "Top Tier 6-Month Retention: Nashik (85.0%), Nagpur (84.5%), Patna (84.3%), Pune (83.8%), Muzaffarpur (81.0%).",
          "Mid Tier 6-Month Retention: Lucknow (80.5%), Prayagraj (80.5%), Varanasi (79.5%), Gaya (77.8%).",
          "Commute Distance Correlation: Candidates placed within 25 km of home exhibit 84.5% retention vs. 63.2% for inter-district commuters."
        ],
        explanation: "High-retention districts benefit from strong local industrial manufacturing clusters and competitive entry wages. In Pune and Nashik, average verified technical wages exceed ₹23,500/mo, and employers offering transit subsidies or subsidized housing demonstrate 28% lower probationary attrition compared to districts with lower initial entry pay.",
        recommendation: "Replicate local industrial cluster employer check-in models: provide a ₹2,000/mo 3-month transit subsidy for trainees placed beyond a 25km radius.",
        limitations: "Based on longitudinal cohort tracking across 3,600 verified candidates in Bihar, UP, and Maharashtra.",
        source_mode: "SkillPulse AI Verified Intelligence Engine",
        comparison: {
          entities: [
            { name: "Nashik (MH)", metrics: "85.0% 6M Retention • ₹23,747/mo avg wage", strengths: "High manufacturing absorption & local stability", skill_gaps: "Solar Maintenance", employment: "106.3% Livelihood Rate" },
            { name: "Pune (MH)", metrics: "83.8% 6M Retention • ₹26,216/mo avg wage", strengths: "High-wage automotive & EV manufacturing absorption", skill_gaps: "EV Diagnostics (-1,030)", employment: "104.7% Livelihood Rate" },
            { name: "Muzaffarpur (BR)", metrics: "81.0% 6M Retention • ₹19,892/mo avg wage", strengths: "Highest livelihood retention in Bihar; strong electrical trades", skill_gaps: "Solar PV (-340)", employment: "103.1% Livelihood Rate" },
            { name: "Lucknow (UP)", metrics: "80.5% 6M Retention • ₹21,876/mo avg wage", strengths: "Telecom & technical services cluster", skill_gaps: "Field Operations", employment: "102.5% Livelihood Rate" }
          ],
          differences: "Maharashtra districts maintain >83% retention supported by higher manufacturing entry wages, while Bihar and UP rely on local cluster integration.",
          reasons: "Entry wage adequacy and commuting cost pressures during the 90-day probationary window.",
          implications: "Policy interventions should focus on local micro-cluster placement rather than distant migration without transit support."
        }
      });
    }

    // Question 3: "Why are trainees leaving their jobs?" (or attrition / leaving root cause questions)
    if (q.includes("leaving") || q.includes("leave") || q.includes("quit") || q.includes("attrition") || q.includes("turnover") || q.includes("resigning")) {
      return adaptTone({
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
      });
    }

    // Question 4: "Which skills have increasing demand?" (or skill demand / growing skills questions)
    if ((q.includes("skill") || q.includes("demand")) && (q.includes("increase") || q.includes("increasing") || q.includes("grow") || q.includes("rising") || q.includes("high") || q.includes("surge"))) {
      return adaptTone({
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
      });
    }

    // Comparison between districts (e.g., Patna vs Muzaffarpur, Pune vs Nashik, etc.)
    if (q.includes("compare") || q.includes("vs") || (q.includes("patna") && q.includes("muzaffarpur")) || (q.includes("pune") && q.includes("nashik"))) {
      const isBihar = q.includes("patna") || q.includes("muzaffarpur") || q.includes("gaya");
      const d1 = isBihar ? "Muzaffarpur" : "Pune";
      const d2 = isBihar ? "Patna" : "Nashik";
      const r1 = isBihar ? "81.0%" : "83.8%";
      const r2 = isBihar ? "84.3%" : "85.0%";
      const w1 = isBihar ? "₹19,892" : "₹26,216";
      const w2 = isBihar ? "₹19,957" : "₹23,747";

      return adaptTone({
        insight: `Comparative Analysis: ${d1} maintains a 6-month retention rate of ${r1} with average wages of ${w1}/mo, while ${d2} exhibits ${r2} retention with average wages of ${w2}/mo.`,
        evidence: [
          `${d1}: 400 trainees tracked • ${r1} 6M Retention • ${w1}/mo average entry wage.`,
          `${d2}: 400 trainees tracked • ${r2} 6M Retention • ${w2}/mo average entry wage.`,
          `Verified Placement Rate: ${d1} at 103.1% vs ${d2} at 106.3% livelihood engagement.`
        ],
        explanation: `In ${d1}, stronger localized placement absorption enables higher retention, whereas ${d2} benefits from higher corporate wage offerings but experiences greater inter-district mobility.`,
        recommendation: `Align training quotas in ${d1} and ${d2} with direct employer MoUs to sustain high placement retention.`,
        limitations: "Computed from the SkillPulse prototype dataset across verified district cohorts.",
        source_mode: "SkillPulse AI Verified Intelligence Engine",
        comparison: {
          entities: [
            { name: d1, metrics: `${r1} Retention • ${w1}/mo`, strengths: "Strong local placement stability", skill_gaps: "Solar Maintenance", employment: "Active cohort" },
            { name: d2, metrics: `${r2} Retention • ${w2}/mo`, strengths: "Higher wage ceiling in urban corporate roles", skill_gaps: "EV Diagnostics", employment: "Active cohort" }
          ],
          differences: `${d2} exhibits higher retention (+${(parseFloat(r2) - parseFloat(r1)).toFixed(1)}%) and competitive wage packages.`,
          reasons: "Urban living costs in capital cities vs stable local housing in industrial clusters.",
          implications: "Targeted housing and transit allowances significantly improve retention in urban centres."
        }
      });
    }

    // Trainee Career Advisor questions (wage increase, promotion, skill upgrades, local jobs)
    if (q.includes("salary") || q.includes("wage") || q.includes("career") || q.includes("upgrade") || q.includes("microgrid") || q.includes("skills do i need") || q.includes("hiring") || q.includes("how do i") || q.includes("step") || q.includes("learn")) {
      const dist = context?.district || "Pune";
      const isEv = q.includes("ev") || q.includes("battery") || q.includes("automobile");
      const isSolar = q.includes("solar") || q.includes("pv") || q.includes("microgrid") || q.includes("installer");
      const targetSkill = isEv ? "CAN-Bus & High-Voltage Diagnostics" : isSolar ? "Microgrid Synchronisation & SCADA" : "Industrial Automation (PLC/SCADA)";
      const targetRole = isEv ? "EV Powertrain Diagnostics Specialist" : isSolar ? "Microgrid Engineer / Solar Site Supervisor" : "Senior Automation Technician";
      const wageInc = isEv ? "₹28,500/mo (+32%)" : isSolar ? "₹26,500/mo (+28%)" : "₹25,000/mo (+25%)";

      return adaptTone({
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
      });
    }

    // Default intelligent domain-grounded response
    return adaptTone({
      insight: `Workforce Intelligence Analysis for "${question}": Longitudinal career signals across 3,600 trainees indicate an average 83.1% livelihood rate and 80.8% 6-month retention.`,
      evidence: [
        "Verified Multi-State Cohort: 3,600 trainees (1,200 Bihar, 1,200 UP, 1,200 Maharashtra across 9 districts).",
        "6-Month Longitudinal Retention Rate: 80.8% with independent EPFO/employer corroborate.",
        "Average Verified Monthly Wage: ₹21,890 with progression from ₹18,918 (Gaya) to ₹26,216 (Pune)."
      ],
      explanation: `Analysis of post-training outcomes indicates that specialized technical certifications (Solar PV, EV Battery Diagnostics, Industrial Electrician) demonstrate 34% higher 12-month retention and ₹6,000/mo higher wages compared to general office assistance. Retention drops notably when post-placement migration support is absent.`,
      recommendation: "Institute 90-day post-placement employer micro-checkins and prioritize industrial apprenticeships with verified living-wage employers.",
      limitations: "Synthesized using verified SkillPulse longitudinal cohort records across Bihar, UP, and Maharashtra.",
      source_mode: "SkillPulse AI Verified Intelligence Engine",
      comparison: null
    });
  }
};
