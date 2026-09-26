export type VerificationStatus =
  | "Self Reported"
  | "Training Verified"
  | "Assessment Verified"
  | "Employer Verified"
  | "Multi-Verified"
  | "Pending Verification"
  | "Conflicting Information"
  | "Insufficient Evidence";

export type EmploymentStatus =
  | "Employed"
  | "Self-Employed"
  | "Apprenticeship"
  | "Further Education"
  | "Unemployed"
  | "Job Changed"
  | "Job Exited"
  | "Unknown";

export type RetentionStatus =
  | "Retained 12M+"
  | "Retained 6M+"
  | "Retained 3M+"
  | "Exited <3M"
  | "Not Applicable"
  | "Unknown";

export type FollowUpStage = "30 Days" | "90 Days" | "180 Days" | "365 Days";
export type FollowUpStatus = "Pending" | "Completed" | "Overdue";
export type CommChannel = "WhatsApp" | "SMS" | "Web" | "IVR" | "Call Centre";

export interface CareerEvent {
  id: string;
  stage: string;
  title: string;
  date: string;
  description: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface VerificationItem {
  id: string;
  field_name: string;
  claimed_value: string;
  source: string;
  date: string;
  evidence_type: string;
  evidence_notes: string;
  status: VerificationStatus;
  verified_by?: string;
  verification_date?: string;
}

export interface FollowUpRecord {
  id: string;
  stage: FollowUpStage;
  due_date: string;
  channel: CommChannel;
  status: FollowUpStatus;
  completed_date?: string;
  employment_status?: string;
  employer?: string;
  job_role?: string;
  wage?: number;
  job_relevance?: string;
  skill_usage?: string;
  job_satisfaction?: string;
  training_usefulness?: string;
  reason_for_leaving?: string;
  additional_training_needed?: string;
  consent_given: boolean;
  verification_status?: string;
  verification_sources?: string[];
  last_updated?: string;
  update_source?: string;
}

export interface Trainee {
  id: string;
  name: string;
  district: string;
  state: string;
  gender: string;
  age: number;
  education: string;
  programme: string;
  training_centre: string;
  batch: string;
  enrollment_date: string;
  completion_date: string;
  certification_status: string;
  certification_score: number;
  skills_acquired: string[];
  skills_used: string[];
  skills_missing: string[];
  skills_recommended: string[];
  
  employment_status: EmploymentStatus;
  employer?: string;
  job_role?: string;
  joining_date?: string;
  current_wage?: number;
  starting_wage?: number;
  wage_history: { stage: string; wage: number; date?: string }[];
  employment_duration_months: number;
  retention_status: RetentionStatus;
  retention_risk: "Low" | "Medium" | "High";
  skill_relevance: string;
  current_location: string;
  reason_for_leaving?: string;
  
  verification_status: VerificationStatus;
  verifications: VerificationItem[];
  follow_ups: FollowUpRecord[];
  last_follow_up_date?: string;
  consent_status: string;
  preferred_channel: CommChannel;
  career_events: CareerEvent[];
  phone?: string;
  email?: string;
  institution?: string;
  graduation_year?: string;
  training_provider?: string;
  completion_status?: string;
  target_skills?: string[];
  experience_years?: number;
  preferred_role?: string;
  preferred_sector?: string;
  preferred_location?: string;
  willing_to_relocate?: boolean;
  skillpulse_id?: string;
  sector?: string;
  skill_profile?: { name: string; level: string; verification: string; acquired_from?: string; assessment_score?: number; related_jobs?: string[] }[];
  checkpoints?: {
    stage: string;
    status: string;
    employment_status?: string;
    role?: string;
    employer?: string;
    employment_duration?: string;
    role_relevance?: string;
    skill_utilisation?: string;
    retention_status?: string;
    verification_status?: string;
    verification_sources?: string[];
    verification_history?: { source: string; date: string; status: string }[];
    last_verification_date?: string;
    wage_band?: string;
    update_source?: string;
    last_updated?: string;
    employer_verified?: boolean;
    trainee_confirmed?: boolean;
    long_term_outcome?: boolean;
  }[];
}

export interface KpiCardData {
  value: string | number;
  prev: string | number;
  change_pct: number;
  trend: "up" | "down" | "flat";
  tooltip: string;
}

export interface DashboardKpis {
  total_trainees: KpiCardData;
  certified: KpiCardData;
  employed: KpiCardData;
  self_employed: KpiCardData;
  apprentices: KpiCardData;
  employment_rate: KpiCardData;
  retention_6m: KpiCardData;
  retention_3m?: KpiCardData;
  retention_9m?: KpiCardData;
  retention_12m?: KpiCardData;
  avg_monthly_wage: KpiCardData;
  skill_gap_rate: KpiCardData;
}

export interface ChartDatasets {
  outcomes_breakdown: { name: string; value: number; color: string }[];
  employment_trend: { period: string; enrolled: number; certified: number; employed: number; employment_rate: number }[];
  wage_progression: { milestone: string; avg_wage: number; top_quartile: number; median: number }[];
  retention_cohort: { stage: string; retention_pct: number; benchmark_pct: number }[];
  skill_gaps: { skill: string; demand: number; supply: number; gap: number; status: string }[];
  job_demand: { sector: string; openings: number; growth_yoy: string }[];
  district_benchmarks: { district: string; trainees: number; employment_rate: number; retention_6m: number; avg_wage: number }[];
  attrition_reasons: { reason: string; count: number; pct: number }[];
}

export interface DistrictInfo {
  name: string;
  lat: number;
  lng: number;
  division: string;
  workforce_supply: number;
  job_demand: number;
  net_gap: number;
  gap_level: string;
  employment_rate: number;
  retention_6m: number;
  avg_wage: number;
  layer_values: Record<string, any>;
}

export interface DistrictDetail {
  workforce_supply: number;
  job_demand: number;
  net_gap: number;
  gap_level: string;
  employment_rate: number;
  retention_6m: number;
  avg_wage: number;
  top_skills: { skill: string; demand: number; supply: number; gap: number }[];
  top_occupations: string[];
  recommended_training: string;
  mobility_outflow: { destination: string; share: string }[];
  layer_values: Record<string, any>;
}

export type AiTone = "formal" | "friendly";

export interface AiStructuredResponse {
  insight: string;
  evidence: string[];
  explanation: string;
  recommendation: string;
  limitations: string;
  source_mode: string;
  comparison?: {
    entities?: { name: string; metrics?: string; strengths?: string; skill_gaps?: string; employment?: string }[];
    differences?: string;
    reasons?: string;
    implications?: string;
  } | null;
}

export interface AiInsightCard {
  id: string;
  category: string;
  tag: string;
  observation: string;
  supporting_data: { metric: string; value: string; alert?: boolean; positive?: boolean }[];
  possible_explanation: string;
  suggested_action: string;
}

export interface ReportData {
  id: string;
  title: string;
  generated_at: string;
  authority: string;
  filters: Record<string, string>;
  kpis: { label: string; value: string | number }[];
  key_findings: string[];
  ai_executive_summary: AiStructuredResponse;
  sample_cohort: { id: string; name: string; district: string; programme: string; status: string; wage: any; verification: string }[];
  sections?: Record<string, any>;
  ai_error?: string | null;
  notice?: string;
}
