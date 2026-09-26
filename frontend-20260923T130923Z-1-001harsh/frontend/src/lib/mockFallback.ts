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

  getFollowUps: (params?: any) => {
    let items = mockData.followups?.items || [];

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
        items = items.filter((f: any) => f.channel === params.channel);
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

    return {
      total,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      summary: mockData.followups?.summary || { pending: 18, completed: 86, overdue: 6, response_rate: 82.4 },
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
    if (mockData.employers_overview) {
      return mockData.employers_overview;
    }
    return {
      notice: "Synthetic demo hiring activity across connected state sectors.",
      openings: 27,
      matched: 42,
      shortlisted: 31,
      interviews: 8,
      hires: 14,
      retained: 12,
      pipeline: [
        { stage: "Available", count: 3600 },
        { stage: "Matched", count: 42 },
        { stage: "Shortlisted", count: 31 },
        { stage: "Interview", count: 8 },
        { stage: "Selected", count: 14 },
        { stage: "Joined", count: 14 },
        { stage: "Retained", count: 12 }
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

  generateReport: (params: { report_type: string; state?: string; district?: string; programme?: string; time_period?: string }) => {
    const type = params.report_type || "employment_outcome";
    if (mockData.sample_reports && mockData.sample_reports[type]) {
      const base = mockData.sample_reports[type];
      return {
        ...base,
        id: `REP-${Date.now().toString().slice(-6)}`,
        generated_at: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        filters: {
          report_type: type,
          state: params.state || "All States",
          district: params.district || "All Districts",
          programme: params.programme || "All Programmes",
          time_period: params.time_period || "Last 6 Months"
        }
      };
    }

    return {
      id: `REP-${Date.now().toString().slice(-6)}`,
      title: "Executive Workforce Intelligence Report",
      generated_at: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      authority: "State Skill Development Mission / Department of Skills, Employment & Innovation",
      notice: "Demonstration Prototype Data — Synthetic Dataset for SIH Evaluation",
      filters: params,
      kpis: [
        { label: "Total Tracked Trainees", value: 3600 },
        { label: "Certified Trainees", value: 2880 },
        { label: "Active Livelihoods Rate", value: "81.9%" },
        { label: "6-Month Retention", value: "79.8%" },
        { label: "Average Monthly Wage", value: "₹21,890" },
        { label: "Catalogue Net Gap", value: "12,860" }
      ],
      key_findings: [
        "Tracked livelihood rate in this scope is 81.9% across multi-verified records.",
        "6-Month retention rate averages 79.8% with longitudinal EPF and employer check-in verification.",
        "Green energy and automotive manufacturing exhibit highest wage growth at 3-month and 6-month milestones."
      ],
      sections: {
        executive_summary: "This report provides empirical workforce intelligence across Bihar, Uttar Pradesh, and Maharashtra cohorts.",
        limitations: "Synthesized prototype evaluation document based on longitudinal cohort tracking."
      },
      ai_executive_summary: {
        insight: "Sustained Longitudinal Career Retention via Skill-Aligned Placements",
        evidence: ["81.9% Livelihood Rate", "79.8% 6-Month Retention", "₹21,890 Mean Wage"],
        explanation: "Longitudinal signals indicate that candidates placed in direct trade-matching roles demonstrate 34% higher 12-month retention.",
        recommendation: "Prioritize specialized technical certifications with post-placement micro-checkins.",
        limitations: "Demonstration figures validated against prototype records.",
        source_mode: "SkillPulse AI Verified Synthesis"
      },
      sample_cohort: (mockData.trainees || []).slice(0, 10).map((t: any) => ({
        id: t.id,
        name: t.name,
        district: t.district,
        programme: t.programme,
        status: t.employment_status,
        wage: t.current_wage ? `₹${t.current_wage.toLocaleString()}` : "N/A",
        verification: t.verification_status || "Verified"
      }))
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
