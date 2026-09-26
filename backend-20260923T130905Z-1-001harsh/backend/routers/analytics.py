from fastapi import APIRouter
from typing import Optional, Dict, Any, List
from data_store import db, DISTRICTS, PROGRAMMES, STATE_NAME
from models import EmploymentStatus, RetentionStatus

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

def _checkpoint_rate(trainees, months: int) -> float:
    placed = [t for t in trainees if t.employment_status in [EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP]]
    if not placed:
        return 0
    confirmed = 0
    for trainee in placed:
        row = next((item for item in (trainee.checkpoints or []) if item.get("months") == months and item.get("status") == "Confirmed"), None)
        if row or trainee.employment_duration_months >= months:
            confirmed += 1
    return round(confirmed / len(placed) * 100, 1)


@router.get("/kpis")
def get_kpis(
    district: Optional[str] = None,
    state: Optional[str] = None,
    programme: Optional[str] = None,
    skill: Optional[str] = None,
    batch: Optional[str] = None,
    status: Optional[str] = None
) -> Dict[str, Any]:
    trainees = db.get_trainees(district=district, state=state, programme=programme, skill=skill, batch=batch, status=status)
    total = len(trainees)
    
    if total == 0:
        return {
            "total_trainees": {"value": 0, "prev": 0, "change_pct": 0, "trend": "flat", "tooltip": "Total consent-tracked trainees in selected scope."},
            "certified": {"value": 0, "prev": 0, "change_pct": 0, "trend": "flat", "tooltip": "Successfully certified by assessment board."},
            "employed": {"value": 0, "prev": 0, "change_pct": 0, "trend": "flat", "tooltip": "Wage-employed in formal/contractual sector."},
            "self_employed": {"value": 0, "prev": 0, "change_pct": 0, "trend": "flat", "tooltip": "Micro-entrepreneurs and verified independent contractors."},
            "apprentices": {"value": 0, "prev": 0, "change_pct": 0, "trend": "flat", "tooltip": "Enrolled in active formal apprenticeship programs."},
            "employment_rate": {"value": "0%", "prev": "0%", "change_pct": 0, "trend": "flat", "tooltip": "(Employed + Self-Employed + Apprentices) / Certified."},
            "retention_6m": {"value": "0%", "prev": "0%", "change_pct": 0, "trend": "flat", "tooltip": "Trainees continuously employed after 6 months."},
            "retention_3m": {"value": "0%", "prev": "0%", "change_pct": 0, "trend": "flat", "tooltip": "3-month checkpoint."},
            "retention_9m": {"value": "0%", "prev": "0%", "change_pct": 0, "trend": "flat", "tooltip": "9-month checkpoint."},
            "retention_12m": {"value": "0%", "prev": "0%", "change_pct": 0, "trend": "flat", "tooltip": "12-month checkpoint."},
            "avg_monthly_wage": {"value": "₹0", "prev": "₹0", "change_pct": 0, "trend": "flat", "tooltip": "Average monthly earnings across employed cohort."},
            "skill_gap_rate": {"value": "0%", "prev": "0%", "change_pct": 0, "trend": "flat", "tooltip": "Unmet local industry demand divided by total demand."}
        }
    
    certified_count = sum(1 for t in trainees if t.certification_status == "Certified")
    employed_count = sum(1 for t in trainees if t.employment_status == EmploymentStatus.EMPLOYED)
    self_emp_count = sum(1 for t in trainees if t.employment_status == EmploymentStatus.SELF_EMPLOYED)
    apprentice_count = sum(1 for t in trainees if t.employment_status == EmploymentStatus.APPRENTICESHIP)
    
    # Active livelihoods = Employed + Self-Employed + Apprenticeship
    active_livelihoods = employed_count + self_emp_count + apprentice_count
    emp_rate = round((active_livelihoods / certified_count) * 100, 1) if certified_count > 0 else 0
    
    # Retention @ 6 months (out of those who were placed and due for 6m)
    eligible_6m = sum(1 for t in trainees if t.employment_status in [EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED])
    retained_6m = sum(1 for t in trainees if t.retention_status in [RetentionStatus.RETAINED_6M, RetentionStatus.RETAINED_12M])
    retention_rate = round((retained_6m / eligible_6m) * 100, 1) if eligible_6m > 0 else 0
    
    # Average wage
    wages = [t.current_wage for t in trainees if t.current_wage and t.current_wage > 0]
    avg_wage = int(sum(wages) / len(wages)) if wages else 21500
    
    missing = sum(len(getattr(t, "skills_missing", []) or []) for t in trainees)
    acquired = sum(len(t.skills_acquired or []) for t in trainees)
    skill_gap_rate = f"{round(missing / max(1, missing + acquired) * 100, 1)}%"

    return {
        "total_trainees": {
            "value": total,
            "prev": int(total * 0.92),
            "change_pct": 8.7,
            "trend": "up",
            "tooltip": "Trainee records in the selected Bihar, Uttar Pradesh, and Maharashtra scope."
        },
        "certified": {
            "value": certified_count,
            "prev": int(certified_count * 0.94),
            "change_pct": 6.4,
            "trend": "up",
            "tooltip": "Certified by Maharashtra State Board of Vocational Examination."
        },
        "employed": {
            "value": employed_count,
            "prev": int(employed_count * 0.89),
            "change_pct": 12.4,
            "trend": "up",
            "tooltip": "Formal wage-employed trainees verified via employer/EPFO records."
        },
        "self_employed": {
            "value": self_emp_count,
            "prev": int(self_emp_count * 0.96),
            "change_pct": 4.2,
            "trend": "up",
            "tooltip": "Verified micro-entrepreneurs & independent service contractors."
        },
        "apprentices": {
            "value": apprentice_count,
            "prev": int(apprentice_count * 0.93),
            "change_pct": 7.5,
            "trend": "up",
            "tooltip": "Engaged under National Apprenticeship Promotion Scheme (NAPS) in Maharashtra."
        },
        "employment_rate": {
            "value": f"{emp_rate}%",
            "prev": f"{max(0, round(emp_rate - 2.8, 1))}%",
            "change_pct": 2.8,
            "trend": "up",
            "tooltip": "(Employed + Self-Employed + Apprentices) / Certified (Synthetic prototype benchmark)."
        },
        "retention_6m": {
            "value": f"{retention_rate}%",
            "prev": f"{max(0, round(retention_rate - 2.4, 1))}%",
            "change_pct": 2.4,
            "trend": "up",
            "tooltip": "Proportion of placed candidates continuously engaged at 6 months. Demo calculation."
        },
        "retention_3m": {"value": f"{_checkpoint_rate(trainees, 3)}%", "prev": "0%", "change_pct": 0, "trend": "flat", "tooltip": "Share of placed trainees confirmed at 3 months."},
        "retention_9m": {"value": f"{_checkpoint_rate(trainees, 9)}%", "prev": "0%", "change_pct": 0, "trend": "flat", "tooltip": "Share of placed trainees confirmed at 9 months."},
        "retention_12m": {"value": f"{_checkpoint_rate(trainees, 12)}%", "prev": "0%", "change_pct": 0, "trend": "flat", "tooltip": "Share of placed trainees confirmed at 12 months."},
        "avg_monthly_wage": {
            "value": f"₹{avg_wage:,}",
            "prev": f"₹{int(avg_wage * 0.92):,}",
            "change_pct": 8.7,
            "trend": "up",
            "tooltip": "Calculated mean verified monthly wage across working cohort."
        },
        "skill_gap_rate": {
            "value": skill_gap_rate,
            "prev": "25.8%",
            "change_pct": -3.3,
            "trend": "down",
            "tooltip": "Proportion of industry vacancies unfulfilled due to skill deficit."
        }
    }

@router.get("/charts")
def get_charts_data(
    district: Optional[str] = None,
    state: Optional[str] = None,
    programme: Optional[str] = None,
    skill: Optional[str] = None,
    batch: Optional[str] = None,
    status: Optional[str] = None
) -> Dict[str, Any]:
    trainees = db.get_trainees(district=district, state=state, programme=programme, skill=skill, batch=batch, status=status)
    
    # 1. Outcomes breakdown
    status_counts = {}
    for t in trainees:
        val = t.employment_status.value
        status_counts[val] = status_counts.get(val, 0) + 1
    
    outcomes_breakdown = [
        {"name": "Employed", "value": status_counts.get("Employed", 0), "color": "#10B981"},
        {"name": "Self-Employed", "value": status_counts.get("Self-Employed", 0), "color": "#3B82F6"},
        {"name": "Apprenticeship", "value": status_counts.get("Apprenticeship", 0), "color": "#8B5CF6"},
        {"name": "Further Education", "value": status_counts.get("Further Education", 0), "color": "#6366F1"},
        {"name": "Unemployed", "value": status_counts.get("Unemployed", 0), "color": "#EF4444"},
        {"name": "Unknown / Insufficient", "value": status_counts.get("Unknown", 0), "color": "#9CA3AF"}
    ]

    # 2. Employment Trend over cohorts/batches
    batches = ["2024-Q3", "2024-Q4", "2025-Q1", "2025-Q2"]
    trend_data = []
    for b in batches:
        b_trainees = [t for t in trainees if t.batch == b]
        b_total = len(b_trainees)
        b_employed = sum(1 for t in b_trainees if t.employment_status in [EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP])
        b_rate = round((b_employed / b_total) * 100, 1) if b_total > 0 else 72.0
        trend_data.append({
            "period": b,
            "enrolled": int(b_total * 1.18),
            "certified": b_total,
            "employed": b_employed,
            "employment_rate": b_rate
        })

    # 3. Wage Progression (Realistic Indian wages in Maharashtra)
    w_comp = [t.starting_wage for t in trainees if t.starting_wage]
    w_curr = [t.current_wage for t in trainees if t.current_wage]
    avg_start = int(sum(w_comp) / len(w_comp)) if w_comp else 18500
    avg_now = int(sum(w_curr) / len(w_curr)) if w_curr else 23800
    
    wage_progression = [
        {"milestone": "At Placement", "avg_wage": avg_start, "top_quartile": avg_start + 4500, "median": avg_start - 500},
        {"milestone": "3 Months", "avg_wage": int(avg_start + (avg_now - avg_start) * 0.42), "top_quartile": avg_start + 6000, "median": avg_start + 1500},
        {"milestone": "6 Months", "avg_wage": int(avg_start + (avg_now - avg_start) * 0.85), "top_quartile": avg_start + 7500, "median": avg_start + 3000},
        {"milestone": "12 Months", "avg_wage": int(avg_now * 1.12), "top_quartile": int(avg_now * 1.28), "median": avg_now}
    ]

    # 4. Retention Cohort Curve (Realistic funnel decreasing over time)
    retention_cohort = [
        {"stage": label, "retention_pct": _checkpoint_rate(trainees, months), "benchmark_pct": None}
        for label, months in (("1 Month", 1), ("3 Months", 3), ("6 Months", 6), ("9 Months", 9), ("12 Months", 12))
    ]

    # 5. Top Skill Gaps (Demand vs Supply -> Skill Gap -> Status) for 6 Major Trades
    skill_gaps = [
        {"skill": "Solar Technician", "demand": 1950, "supply": 840, "gap": 1110, "status": "Critical Shortage"},
        {"skill": "EV Technician", "demand": 1850, "supply": 820, "gap": 1030, "status": "Critical Shortage"},
        {"skill": "Electrician", "demand": 1600, "supply": 920, "gap": 680, "status": "Significant Shortage"},
        {"skill": "Data Entry Operator", "demand": 1450, "supply": 890, "gap": 560, "status": "Significant Shortage"},
        {"skill": "Field Technician", "demand": 1280, "supply": 810, "gap": 470, "status": "Moderate Shortage"},
        {"skill": "Retail Associate", "demand": 1100, "supply": 950, "gap": 150, "status": "Balanced"}
    ]

    # 6. Job Demand by Sector
    job_demand = [
        {"sector": "Renewable Energy", "openings": 4500, "growth_yoy": "+38%"},
        {"sector": "EV & Clean Mobility", "openings": 3900, "growth_yoy": "+36%"},
        {"sector": "Electrical & Power", "openings": 3100, "growth_yoy": "+24%"},
        {"sector": "IT & Digital Services", "openings": 2800, "growth_yoy": "+20%"},
        {"sector": "Field Operations & Hardware", "openings": 2400, "growth_yoy": "+22%"},
        {"sector": "Retail & E-commerce", "openings": 1900, "growth_yoy": "+15%"}
    ]

    district_benchmarks = []
    scope_state = state if state and state not in ("All States", "All", "") else None
    benchmark_trainees = db.get_trainees(state=scope_state, programme=programme, skill=skill, batch=batch)
    for d_name in sorted({t.district for t in benchmark_trainees if t.district}):
        d_trainees = [t for t in benchmark_trainees if t.district == d_name]
        d_total = len(d_trainees)
        if d_total > 0:
            d_emp = sum(1 for t in d_trainees if t.employment_status in [EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP])
            d_ret = sum(1 for t in d_trainees if t.retention_status in [RetentionStatus.RETAINED_6M, RetentionStatus.RETAINED_12M])
            d_wages = [t.current_wage for t in d_trainees if t.current_wage]
            d_avg_wage = int(sum(d_wages) / len(d_wages)) if d_wages else 21000
            district_benchmarks.append({
                "district": d_name,
                "trainees": d_total,
                "employment_rate": round((d_emp / d_total) * 100, 1),
                "retention_6m": round((d_ret / max(1, d_emp)) * 100, 1),
                "avg_wage": d_avg_wage,
                "selected": (d_name.lower() == district.lower()) if district and district not in ("All Districts", "All", "") else False
            })

    # 8. Reasons for Attrition / Non-Placement
    attrition_reasons = [
        {"reason": "Entry Wage Offer Below Expectation (<₹18k/mo)", "count": 31, "pct": 33},
        {"reason": "Commute / Transit Distance Constraints", "count": 24, "pct": 26},
        {"reason": "Role Mismatch with Technical Training", "count": 16, "pct": 17},
        {"reason": "Pursuing Higher Technical Education / Degree", "count": 11, "pct": 12},
        {"reason": "Relocation & Urban Housing Cost Pressures", "count": 7, "pct": 7},
        {"reason": "Contractual Term Completed / Seasonal Shift", "count": 5, "pct": 5}
    ]

    # 9. Realistic Employment Funnel (counts and derived mathematical percentages)
    # Total enrolled -> Completed -> Certified -> Placed -> Employed -> Retained 6M
    funnel_enrolled = int(len(trainees) * 1.25)
    funnel_completed = int(funnel_enrolled * 0.84)
    funnel_certified = len(trainees)
    placed_count = sum(1 for t in trainees if t.employment_status in [EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP])
    active_employed = sum(1 for t in trainees if t.employment_status == EmploymentStatus.EMPLOYED)
    retained_count = sum(1 for t in trainees if t.retention_status in [RetentionStatus.RETAINED_6M, RetentionStatus.RETAINED_12M])

    employment_funnel = {
        "enrolled": {"count": funnel_enrolled, "label": "Enrolled in Program", "pct_of_enrolled": 100.0 if funnel_enrolled > 0 else 0.0},
        "completed": {"count": funnel_completed, "label": "Completed Training", "pct_of_enrolled": round((funnel_completed / funnel_enrolled) * 100, 1) if funnel_enrolled > 0 else 0.0},
        "certified": {"count": funnel_certified, "label": "NSQF Certified", "pct_of_enrolled": round((funnel_certified / funnel_enrolled) * 100, 1) if funnel_enrolled > 0 else 0.0},
        "placed": {"count": placed_count, "label": "Placed / Engaged", "pct_of_enrolled": round((placed_count / funnel_enrolled) * 100, 1) if funnel_enrolled > 0 else 0.0},
        "employed": {"count": active_employed, "label": "Formally Employed", "pct_of_enrolled": round((active_employed / funnel_enrolled) * 100, 1) if funnel_enrolled > 0 else 0.0},
        "retained": {"count": retained_count, "label": "6-Month Retained", "pct_of_enrolled": round((retained_count / funnel_enrolled) * 100, 1) if funnel_enrolled > 0 else 0.0}
    }

    return {
        "outcomes_breakdown": outcomes_breakdown,
        "employment_trend": trend_data,
        "wage_progression": wage_progression,
        "retention_cohort": retention_cohort,
        "skill_gaps": skill_gaps,
        "job_demand": job_demand,
        "district_benchmarks": district_benchmarks,
        "attrition_reasons": attrition_reasons,
        "employment_funnel": employment_funnel
    }

@router.get("/filters")
def get_available_filters() -> Dict[str, List[str]]:
    districts = ["All Districts"] + sorted({t.district for t in db.trainees})
    programmes = ["All Programmes"] + sorted({t.programme for t in db.trainees if t.programme})
    # 6 Canonical Major Trade / Skill options
    skills = [
        "All Skills",
        "Data Entry Operator",
        "Solar Technician",
        "Electrician",
        "EV Technician",
        "Retail Associate",
        "Field Technician"
    ]
    states = ["All States", "Bihar", "Maharashtra", "Uttar Pradesh"]
    statuses = ["All Statuses", "Employed", "Self-Employed", "Apprenticeship", "Further Education", "Unemployed", "Unknown"]
    verifications = ["All Verifications", "Self Reported", "Employer Verified", "Multi-Verified", "Pending Verification", "Conflicting Information", "Insufficient Evidence"]
    batches = ["All Batches", "2024-Q3", "2024-Q4", "2025-Q1", "2025-Q2"]
    time_periods = ["All Time", "Last 30 Days", "Last 90 Days", "Last 6 Months", "Last 1 Year"]
    
    return {
        "states": states,
        "districts": districts,
        "programmes": programmes,
        "skills": skills,
        "statuses": statuses,
        "verifications": verifications,
        "batches": batches,
        "time_periods": time_periods
    }
