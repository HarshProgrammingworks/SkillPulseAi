from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

class VerificationStatus(str, Enum):
    SELF_REPORTED = "Self Reported"
    TRAINING_VERIFIED = "Training Verified"
    ASSESSMENT_VERIFIED = "Assessment Verified"
    EMPLOYER_VERIFIED = "Employer Verified"
    MULTI_VERIFIED = "Multi-Verified"
    PENDING_VERIFICATION = "Pending Verification"
    CONFLICTING_INFORMATION = "Conflicting Information"
    INSUFFICIENT_EVIDENCE = "Insufficient Evidence"

class EmploymentStatus(str, Enum):
    EMPLOYED = "Employed"
    SELF_EMPLOYED = "Self-Employed"
    APPRENTICESHIP = "Apprenticeship"
    FURTHER_EDUCATION = "Further Education"
    UNEMPLOYED = "Unemployed"
    JOB_CHANGED = "Job Changed"
    JOB_EXITED = "Job Exited"
    UNKNOWN = "Unknown"

class RetentionStatus(str, Enum):
    RETAINED_12M = "Retained 12M+"
    RETAINED_6M = "Retained 6M+"
    RETAINED_3M = "Retained 3M+"
    EXITED_EARLY = "Exited <3M"
    NOT_APPLICABLE = "Not Applicable"
    UNKNOWN = "Unknown"

class FollowUpStage(str, Enum):
    STAGE_30D = "30D"
    STAGE_90D = "90D"
    STAGE_180D = "180D"
    STAGE_270D = "270D"
    STAGE_9M = "9M"
    STAGE_12M = "12M"
    LEGACY_30D = "30 Days"
    LEGACY_90D = "90 Days"
    LEGACY_180D = "180 Days"
    LEGACY_365D = "365 Days"

class FollowUpStatus(str, Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    OVERDUE = "Overdue"

class CommChannel(str, Enum):
    WHATSAPP = "WhatsApp"
    SMS = "SMS"
    WEB = "Web"
    IVR = "IVR"
    CALL_CENTRE = "Call Centre"

class CareerEventType(str, Enum):
    ENROLLED = "Enrolled"
    TRAINING_COMPLETED = "Training Completed"
    ASSESSMENT = "Assessment"
    CERTIFIED = "Certified"
    PLACED = "Placed"
    EMPLOYED = "Employed"
    FOLLOWUP_3M = "3-Month Follow-up"
    RETENTION_6M = "6-Month Retention"
    WAGE_PROGRESSION = "Wage Progression"
    CURRENT_STATUS = "Current Career Status"

class CareerEvent(BaseModel):
    id: str
    stage: str
    title: str
    date: str
    description: str
    status: str
    metadata: Dict[str, Any] = Field(default_factory=dict)

class VerificationItem(BaseModel):
    id: str
    field_name: str
    claimed_value: str
    source: str
    date: str
    evidence_type: str
    evidence_notes: str
    status: VerificationStatus
    verified_by: Optional[str] = None
    verification_date: Optional[str] = None

class FollowUpRecord(BaseModel):
    id: str
    stage: str  # Supports 30D, 90D, 180D, 270D, 9M, 12M
    due_date: str
    channel: CommChannel = CommChannel.WHATSAPP
    status: FollowUpStatus
    completed_date: Optional[str] = None
    employment_status: Optional[str] = None
    employer: Optional[str] = None
    job_role: Optional[str] = None
    wage: Optional[int] = None
    job_relevance: Optional[str] = None  # High, Medium, Low
    skill_usage: Optional[str] = None    # Daily, Frequent, Rare
    job_satisfaction: Optional[str] = None # High, Neutral, Low
    training_usefulness: Optional[str] = None
    reason_for_leaving: Optional[str] = None
    additional_training_needed: Optional[str] = None
    consent_given: bool = True
    verification_status: Optional[str] = None
    verification_sources: List[str] = Field(default_factory=list)
    last_updated: Optional[str] = None
    update_source: Optional[str] = None

class Trainee(BaseModel):
    id: str
    name: str
    district: str
    state: str = "Maharashtra"  # Multi-state workforce context: Bihar, Uttar Pradesh, Maharashtra
    gender: str
    age: int
    education: str
    programme: str
    training_centre: str
    batch: str
    enrollment_date: str
    completion_date: str
    certification_status: str  # "Certified", "Appeared", "Pending"
    certification_score: int
    skills_acquired: List[str]
    skills_used: List[str]
    skills_missing: List[str]
    skills_recommended: List[str]
    
    # Outcome and Employment
    employment_status: EmploymentStatus
    employer: Optional[str] = None
    job_role: Optional[str] = None
    joining_date: Optional[str] = None
    current_wage: Optional[int] = None
    starting_wage: Optional[int] = None
    wage_history: List[Dict[str, Any]] = Field(default_factory=list) # [{stage: "Placement", wage: 14000}, ...]
    employment_duration_months: int = 0
    retention_status: RetentionStatus
    retention_risk: str = "Low"  # Low, Medium, High
    skill_relevance: str = "High"  # High, Medium, Low, Mismatch
    current_location: str
    reason_for_leaving: Optional[str] = None
    
    # Verification & Follow-up
    verification_status: VerificationStatus
    verifications: List[VerificationItem] = Field(default_factory=list)
    follow_ups: List[FollowUpRecord] = Field(default_factory=list)
    last_follow_up_date: Optional[str] = None
    consent_status: str = "Consent Active"
    preferred_channel: CommChannel = CommChannel.WHATSAPP
    
    # Longitudinal Career Ledger
    career_events: List[CareerEvent] = Field(default_factory=list)

    # Optional profile fields used by Add Trainee and role-specific views.
    # Existing seeded records leave these empty.
    phone: Optional[str] = None
    email: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[str] = None
    training_provider: Optional[str] = None
    completion_status: Optional[str] = None
    skill_levels: Dict[str, str] = Field(default_factory=dict)
    target_skills: List[str] = Field(default_factory=list)
    experience_years: Optional[float] = None
    preferred_role: Optional[str] = None
    preferred_sector: Optional[str] = None
    preferred_location: Optional[str] = None
    willing_to_relocate: Optional[bool] = None
    skillpulse_id: Optional[str] = None
    date_of_birth: Optional[str] = None
    sector: Optional[str] = None
    skill_profile: List[Dict[str, Any]] = Field(default_factory=list)
    checkpoints: List[Dict[str, Any]] = Field(default_factory=list)
    availability: Optional[str] = None
    wage_expectation: Optional[int] = None

class UpdateOutcomeRequest(BaseModel):
    employment_status: EmploymentStatus
    employer: Optional[str] = None
    job_role: Optional[str] = None
    current_wage: Optional[int] = None
    joining_date: Optional[str] = None
    current_location: Optional[str] = None
    skill_relevance: Optional[str] = None
    retention_status: Optional[RetentionStatus] = None
    reason_for_leaving: Optional[str] = None
    updated_by: Optional[str] = "Govt Skill Officer"

class UpdateVerificationRequest(BaseModel):
    verification_status: VerificationStatus
    notes: Optional[str] = None
    verified_by: Optional[str] = "Directorate Verification Unit"

class CompleteFollowUpRequest(BaseModel):
    follow_up_id: str
    employment_status: str
    employer: Optional[str] = None
    job_role: Optional[str] = None
    wage: Optional[int] = None
    job_relevance: Optional[str] = "High"
    skill_usage: Optional[str] = "Daily"
    job_satisfaction: Optional[str] = "High"
    training_usefulness: Optional[str] = "Very Useful"
    reason_for_leaving: Optional[str] = None
    additional_training_needed: Optional[str] = None
    consent_given: bool = True
    channel_used: CommChannel = CommChannel.WHATSAPP
    stage: Optional[str] = None
    verification_status: Optional[str] = None

class AskAiRequest(BaseModel):
    question: str
    context_district: Optional[str] = None
    context_skill: Optional[str] = None
    context_programme: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = None
    dashboard_metrics: Optional[Dict[str, Any]] = None
    compare_trainee_ids: Optional[List[str]] = None
    tone: Optional[str] = "formal"

class CreateTraineeRequest(BaseModel):
    name: str
    trainee_id: Optional[str] = None
    age: int
    gender: str
    phone: Optional[str] = None
    email: Optional[str] = None
    district: str
    state: str = "Maharashtra"
    education: str
    institution: Optional[str] = None
    graduation_year: Optional[str] = None
    programme: str
    training_provider: Optional[str] = None
    enrollment_date: str
    completion_status: str = "In Progress"
    certification_status: str = "Pending"
    skills_acquired: List[str] = Field(default_factory=list)
    skill_level: Optional[str] = None
    target_skills: List[str] = Field(default_factory=list)
    experience_years: Optional[float] = 0
    employment_status: EmploymentStatus = EmploymentStatus.UNKNOWN
    job_role: Optional[str] = None
    employer: Optional[str] = None
    current_wage: Optional[int] = None
    joining_date: Optional[str] = None
    current_location: Optional[str] = None
    preferred_role: Optional[str] = None
    preferred_sector: Optional[str] = None
    preferred_location: Optional[str] = None
    willing_to_relocate: Optional[bool] = None

class LoginRequest(BaseModel):
    role: str
    identifier: str
    password: str

class MatchRequest(BaseModel):
    job_role: str = ""
    required_skills: List[str] = Field(default_factory=list)
    min_experience_years: float = 0
    education: str = ""
    location: str = ""
    preferred_certification: str = ""
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None

class AiStructuredResponse(BaseModel):
    insight: str
    evidence: List[str]
    explanation: str
    recommendation: str
    limitations: str
    source_mode: str = "SkillPulse AI"
    comparison: Optional[Dict[str, Any]] = None
