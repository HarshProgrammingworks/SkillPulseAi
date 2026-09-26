from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
from datetime import datetime
from data_store import db, DISTRICTS, STATE_NAME
from gemini_service import gemini_service
from models import EmploymentStatus, RetentionStatus

router = APIRouter(prefix="/api/reports", tags=["Reports"])

REPORT_TYPES = [
    {"id": "employment_outcome", "name": "Employment Outcome", "desc": "Placement, self-employment, and wage continuity across Bihar, Uttar Pradesh, and Maharashtra."},
    {"id": "skill_gap", "name": "Skill Gap & Labour Market Deficit Report", "desc": "Industry demand versus trained supply across the three-state prototype dataset."},
    {"id": "district", "name": "District Performance Benchmark Report", "desc": "Comparative outcome analysis across the supported districts."},
    {"id": "wage_progression", "name": "Wage Progression & Skilling ROI Report", "desc": "Placement wages, 3-month increments, 6-month earnings, and sector skill premiums in Maharashtra."},
    {"id": "retention", "name": "Retention & Attrition Analysis Report", "desc": "3, 6, and 12-month survival curves, root cause attrition, and risk predictions across cohorts."},
    {"id": "training_effectiveness", "name": "Training Effectiveness & Quality Report", "desc": "Evaluation of Maharashtra skilling providers based on real-world career longevity and employer verification."}
]

@router.get("/types")
def get_report_types():
    return REPORT_TYPES

@router.get("/generate")
async def generate_report(
    report_type: str = Query("employment_outcome"),
    state: Optional[str] = "All States",
    district: Optional[str] = "All Districts",
    programme: Optional[str] = "All Programmes",
    time_period: Optional[str] = "Last 6 Months"
) -> Dict[str, Any]:
    trainees = db.get_trainees(
        state=state if state and state not in ("All States", "All") else None,
        district=district if district != "All Districts" else None,
        programme=programme if programme != "All Programmes" else None
    )
    total = len(trainees)
    emp_count = sum(1 for t in trainees if t.employment_status in [EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP])
    emp_rate = round((emp_count / total) * 100, 1) if total > 0 else 74.5
    
    retained_6m = sum(1 for t in trainees if t.retention_status in [RetentionStatus.RETAINED_6M, RetentionStatus.RETAINED_12M])
    ret_rate = round((retained_6m / max(1, emp_count)) * 100, 1)
    
    wages = [t.current_wage for t in trainees if t.current_wage]
    avg_wage = int(sum(wages) / len(wages)) if wages else 23500

    report_title = next((r["name"] for r in REPORT_TYPES if r["id"] == report_type), "Executive Workforce Intelligence Report")
    
    context = {
        "report_type": report_title,
        "state": state or "Bihar, Uttar Pradesh, Maharashtra",
        "district": district or "All supported districts",
        "programme": programme,
        "time_period": time_period,
        "total_cohort": total,
        "employment_rate": f"{emp_rate}%",
        "retention_6m": f"{ret_rate}%",
        "avg_wage": f"₹{avg_wage:,}",
        "verification_rate": "77.4%",
        "is_synthetic_demo": True
    }
    
    from geography import GEOGRAPHY
    from intelligence import build_intelligence, cohort_profile

    intelligence = build_intelligence()
    if district and district not in ("All Districts", "All"):
        comparison_names = [district]
    elif state and state not in ("All States", "All", None, ""):
        comparison_names = list(GEOGRAPHY.get(state, []))
    else:
        comparison_names = [name for names in GEOGRAPHY.values() for name in names]
    district_comparison = [cohort_profile(name) for name in comparison_names]
    ai_summary = None
    ai_error = None
    try:
        ai_summary = await gemini_service.ask_analytics(
            f"Write an executive summary for the {report_title} covering {district or state or 'Bihar, Uttar Pradesh, and Maharashtra'} during {time_period}. Use only the supplied figures.",
            {
                **context,
                "district_comparison": district_comparison,
                "skill_gaps": intelligence["gaps"][:8],
                "training": intelligence["training"][:8],
                "comparison_required": False,
            }
        )
    except HTTPException as exc:
        ai_error = exc.detail if isinstance(exc.detail, str) else "Gemini could not complete the narrative."

    employed = [t for t in trainees if t.employment_status in [EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP]]
    certified = [t for t in trainees if (t.certification_status or "").lower() == "certified"]
    sections = {
        "executive_summary": (
            f"This {report_title} covers {total} tracked trainee records"
            f"{' in ' + district if district and district != 'All Districts' else ' across Bihar, Uttar Pradesh, and Maharashtra'}. "
            f"Recorded livelihoods: {emp_rate}%. Six-month retention among employed records: {ret_rate}%. "
            f"Average recorded wage: ₹{avg_wage:,}. These are prototype calculations, not official statistics."
        ),
        "employment_overview": {
            "tracked_records": total,
            "livelihood_count": len(employed),
            "livelihood_rate_pct": emp_rate,
            "certified_records": len(certified),
            "retention_6m_pct": ret_rate,
            "avg_monthly_wage_inr": avg_wage,
        },
        "workforce_analysis": intelligence["supply"]["by_district"],
        "skill_gap_analysis": intelligence["gaps"][:10],
        "district_comparison": district_comparison,
        "employer_demand": intelligence["demand"]["by_skill"][:8],
        "wage_insights": {
            "cohort_average_inr": avg_wage,
            "progression": intelligence["wages"]["progression"],
            "by_district": intelligence["wages"]["by_district"],
        },
        "training_recommendations": intelligence["training"][:8],
        "key_findings": [
            f"Tracked livelihood rate in this scope is {emp_rate}%, from {len(employed)} of {total} records.",
            f"Catalogue net gap across listed skill rows is {intelligence['summary']['net_gap']:,} (demand minus supply).",
            "Priority Training is assigned only where the calculated gap label is High Gap or Moderate Gap.",
        ],
        "limitations": (
            "Synthetic demo data for Bihar, Uttar Pradesh, and Maharashtra. "
            "Not an official government publication. Wage ranges are omitted where the catalogue does not contain them."
        ),
    }

    return {
        "id": f"REP-MH-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "title": report_title,
        "generated_at": datetime.now().strftime("%d %B %Y, %H:%M:%S"),
        "authority": "Maharashtra State Innovation Society / Department of Skills & Entrepreneurship",
        "notice": "Demonstration Prototype Data — Synthetic Dataset for SIH Evaluation",
        "filters": {
            "report_type": report_type,
            "state": STATE_NAME,
            "district": district,
            "programme": programme,
            "time_period": time_period
        },
        "kpis": [
            {"label": "Total Tracked Trainees", "value": total},
            {"label": "Certified Trainees", "value": len(certified)},
            {"label": "Active Livelihoods Rate", "value": f"{emp_rate}%"},
            {"label": "6-Month Retention", "value": f"{ret_rate}%"},
            {"label": "Average Monthly Wage", "value": f"₹{avg_wage:,}"},
            {"label": "Catalogue Net Gap", "value": f"{intelligence['summary']['net_gap']:,}"},
        ],
        "key_findings": sections["key_findings"],
        "sections": sections,
        "ai_error": ai_error,
        "ai_executive_summary": ai_summary.model_dump() if ai_summary is not None and hasattr(ai_summary, "model_dump") else (ai_summary.dict() if ai_summary is not None else None),
        "sample_cohort": [
            {"id": t.id, "name": t.name, "district": t.district, "programme": t.programme, "status": t.employment_status.value, "wage": f"₹{t.current_wage:,}" if t.current_wage else "N/A", "verification": t.verification_status.value}
            for t in trainees[:10]
        ]
    }
