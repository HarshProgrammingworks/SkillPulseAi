"""Grounding, SkillMap calculations, and candidate matching.

Gap labels are computed from supply and demand already stored in the
Maharashtra prototype catalogue (routers.skillmap._district_metrics()) and from
the trainee cohort. Missing cells stay 'Data unavailable'.
"""
import re
from typing import Any, Dict, List, Optional

from data_store import PROGRAMME_PRIMARY_SKILLS, PROGRAMMES, STATE_NAME, db
from models import EmploymentStatus

def _district_metrics():
    # Imported lazily so skillmap can call this module without a circular import.
    from routers.skillmap import DISTRICT_METRICS
    return DISTRICT_METRICS

from geography import GEOGRAPHY as _GEO
DISTRICT_NAMES = [name for names in _GEO.values() for name in names]

# Growth rates aligned with the 6 major economic Trade / Skill areas
SKILL_GROWTH = {
    "Solar Technician": {"growth_yoy": 38, "trend": "Growing", "sector": "Renewable Energy", "occupation": "Solar Installation Specialist"},
    "EV Technician": {"growth_yoy": 36, "trend": "Emerging", "sector": "EV & Clean Mobility", "occupation": "EV Diagnostics & Battery Technician"},
    "Electrician": {"growth_yoy": 24, "trend": "Growing", "sector": "Electrical & Power", "occupation": "Domestic & Industrial Electrician"},
    "Field Technician": {"growth_yoy": 22, "trend": "Growing", "sector": "Field Operations & Hardware", "occupation": "Field Service & Telecom Technician"},
    "Retail Associate": {"growth_yoy": 15, "trend": "Stable", "sector": "Retail & E-commerce", "occupation": "Retail Sales Associate"},
    "Data Entry Operator": {"growth_yoy": -5, "trend": "Declining", "sector": "IT & Digital Services", "occupation": "Data Entry & Office Operator"},
}

# Statewide observation already present in AI insights. District split is not in the dataset.
LEGACY_ROWS = [
    {
        "district": None,
        "skill": "Data Entry Operator",
        "demand": 650,
        "supply": 1200,
        "wage_avg": 15000,
        "note": "Statewide figure used in skilling insights.",
    }
]

WAGE_PROGRESSION = [
    {"milestone": "Initial placement (median)", "wage": 18500},
    {"milestone": "6 months (median)", "wage": 23800},
    {"milestone": "12 months (median)", "wage": 26800},
]

SKILL_WAGE_NOTES = [
    {"skill": "Solar Technician", "district": "Muzaffarpur", "wage_avg": 24500},
    {"skill": "EV Technician", "district": "Pune", "wage_avg": 28500},
    {"skill": "Electrician", "district": "Lucknow", "wage_avg": 22000},
    {"skill": "Field Technician", "district": "Patna", "wage_avg": 21500},
]

DATA_NOTE = (
    "Synthetic demonstration data for Bihar, Uttar Pradesh, and Maharashtra. "
    "These figures are not official government statistics."
)


def classify_gap(supply: Optional[float], demand: Optional[float]) -> str:
    if supply is None or demand is None:
        return "Data unavailable"
    gap = demand - supply
    if demand <= 0:
        return "Potential Oversupply" if supply > 0 else "Data unavailable"
    if gap < 0:
        return "Potential Oversupply"
    ratio = gap / demand
    if ratio >= 0.35:
        return "High Gap"
    if ratio >= 0.15:
        return "Moderate Gap"
    return "Low Gap"


def training_recommendation(label: str) -> str:
    if label in ("High Gap", "Moderate Gap"):
        return "Priority Training"
    if label == "Potential Oversupply":
        return "Lower Current Demand / Consider Reskilling"
    if label == "Low Gap":
        return "Maintain current training capacity"
    return "Insufficient data to recommend"


def _skill_meta(skill: str) -> Dict[str, Any]:
    meta = SKILL_GROWTH.get(skill, {})
    programme = next((p for p in PROGRAMMES if p["primary_skill"] == skill), None)
    return {
        "skill": skill,
        "occupation": meta.get("occupation") or (programme["primary_skill"] if programme else skill),
        "sector": meta.get("sector") or (programme["sector"] if programme else "Data unavailable"),
        "growth_yoy": meta.get("growth_yoy"),
        "trend": meta.get("trend") or "Data unavailable",
    }


def market_rows() -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for district, metrics in _district_metrics().items():
        for item in metrics.get("top_skills", []):
            meta = _skill_meta(item["skill"])
            supply = item.get("supply")
            demand = item.get("demand")
            gap = (demand - supply) if supply is not None and demand is not None else None
            label = classify_gap(supply, demand)
            wage_note = next(
                (w for w in SKILL_WAGE_NOTES if w["skill"] == item["skill"] and w["district"] == district),
                None,
            )
            rows.append({
                **meta,
                "district": district,
                "supply": supply,
                "demand": demand,
                "gap": gap,
                "gap_label": label,
                "recommendation": training_recommendation(label),
                "wage_avg": wage_note["wage_avg"] if wage_note else metrics.get("avg_wage"),
                "wage_source": "skill note in prototype catalogue" if wage_note else "district average (skill-specific wage unavailable)",
                "source": "SkillPulse Maharashtra prototype labour catalogue",
            })
    for legacy in LEGACY_ROWS:
        meta = _skill_meta(legacy["skill"])
        label = classify_gap(legacy["supply"], legacy["demand"])
        rows.append({
            **meta,
            "district": legacy["district"],
            "supply": legacy["supply"],
            "demand": legacy["demand"],
            "gap": legacy["demand"] - legacy["supply"],
            "gap_label": label,
            "recommendation": training_recommendation(label),
            "wage_avg": legacy["wage_avg"],
            "wage_source": legacy["note"],
            "source": "Existing AI insight observation (statewide)",
        })
    return rows


def cohort_skill_counts() -> List[Dict[str, Any]]:
    buckets: Dict[tuple, Dict[str, int]] = {}
    for trainee in db.trainees:
        skill = PROGRAMME_PRIMARY_SKILLS.get(trainee.programme, "Unmapped programme")
        key = (trainee.district, skill)
        bucket = buckets.setdefault(key, {"trained": 0, "certified": 0, "employed": 0})
        bucket["trained"] += 1
        if (trainee.certification_status or "").lower() == "certified":
            bucket["certified"] += 1
        if trainee.employment_status in (
            EmploymentStatus.EMPLOYED,
            EmploymentStatus.SELF_EMPLOYED,
            EmploymentStatus.APPRENTICESHIP,
        ):
            bucket["employed"] += 1
    rows = []
    for (district, skill), counts in sorted(buckets.items()):
        meta = _skill_meta(skill)
        rows.append({"district": district, "skill": skill, **meta, **counts})
    return rows


def _matches_filters(row: Dict[str, Any], district: Optional[str], sector: Optional[str], role: Optional[str], skill: Optional[str]) -> bool:
    if district and district not in ("All Districts", "All") and row.get("district") not in (None, district):
        return False
    if sector and sector not in ("All Sectors", "All") and row.get("sector") != sector:
        return False
    if role and role not in ("All Roles", "All") and row.get("occupation") != role:
        return False
    if skill and skill not in ("All Skills", "All") and row.get("skill") != skill:
        return False
    return True


def build_intelligence(district: Optional[str] = None, sector: Optional[str] = None, role: Optional[str] = None, skill: Optional[str] = None) -> Dict[str, Any]:
    rows = [r for r in market_rows() if _matches_filters(r, district, sector, role, skill)]
    cohort = [c for c in cohort_skill_counts() if _matches_filters(c, district, sector, role, skill)]

    def _sum(key: str) -> int:
        return int(sum(r[key] for r in rows if isinstance(r.get(key), (int, float))))

    supply_total = _sum("supply")
    demand_total = _sum("demand")
    trained = sum(c["trained"] for c in cohort)
    certified = sum(c["certified"] for c in cohort)

    by_district = []
    names = list(DISTRICT_NAMES)
    if district and district not in ("All Districts", "All") and district not in names:
        names.append(district)
    for name in names:
        if district and district not in ("All Districts", "All") and name != district:
            continue
        d_rows = [r for r in rows if r.get("district") == name]
        d_cohort = [c for c in cohort if c.get("district") == name]
        metrics = _district_metrics().get(name, {})
        by_district.append({
            "district": name,
            "catalogue_supply": sum(r["supply"] for r in d_rows) if d_rows else None,
            "catalogue_demand": sum(r["demand"] for r in d_rows) if d_rows else None,
            "tracked_trained": sum(c["trained"] for c in d_cohort),
            "tracked_certified": sum(c["certified"] for c in d_cohort),
            "employment_rate": metrics.get("employment_rate"),
            "retention_6m": metrics.get("retention_6m"),
            "avg_wage": metrics.get("avg_wage"),
            "workforce_supply": metrics.get("workforce_supply"),
            "job_demand": metrics.get("job_demand"),
        })

    concentration = []
    for row in rows:
        if not row.get("supply"):
            continue
        share = round(row["supply"] / supply_total * 100, 1) if supply_total else None
        concentration.append({
            "skill": row["skill"],
            "district": row["district"] or "Statewide",
            "supply": row["supply"],
            "share_pct": share,
        })
    concentration.sort(key=lambda item: item["supply"], reverse=True)

    gaps = []
    for row in rows:
        gaps.append({
            "skill": row["skill"],
            "occupation": row["occupation"],
            "sector": row["sector"],
            "district": row["district"] or "Statewide",
            "supply": row["supply"],
            "demand": row["demand"],
            "gap": row["gap"],
            "gap_label": row["gap_label"],
            "recommendation": row["recommendation"],
        })
    gaps.sort(key=lambda item: (item["gap"] is None, -(item["gap"] or 0)))

    future = []
    seen = set()
    for row in rows:
        if row["skill"] in seen:
            continue
        seen.add(row["skill"])
        future.append({
            "skill": row["skill"],
            "occupation": row["occupation"],
            "trend": row["trend"],
            "growth_yoy": row["growth_yoy"],
            "priority": row["recommendation"],
        })

    wages = []
    for row in rows:
        wages.append({
            "skill": row["skill"],
            "occupation": row["occupation"],
            "district": row["district"] or "Statewide",
            "wage_avg": row["wage_avg"],
            "wage_min": None,
            "wage_max": None,
            "range_note": "A published wage range is not in the prototype catalogue for this row.",
            "source": row["wage_source"],
        })

    cohort_wages = _cohort_wage_stats(district, skill)

    mobility = _mobility(rows, district)

    return {
        "notice": DATA_NOTE,
        "state": STATE_NAME,
        "filters": {
            "districts": ["All Districts", *[name for names in __import__("geography").GEOGRAPHY.values() for name in names]],
            "sectors": ["All Sectors", *sorted({r["sector"] for r in market_rows() if r.get("sector")})],
            "roles": ["All Roles", *sorted({r["occupation"] for r in market_rows()})],
            "skills": ["All Skills", *sorted({r["skill"] for r in market_rows()})],
        },
        "summary": {
            "catalogue_supply": supply_total,
            "catalogue_demand": demand_total,
            "net_gap": demand_total - supply_total,
            "tracked_trained": trained,
            "tracked_certified": certified,
            "gap_label": classify_gap(supply_total, demand_total),
        },
        "supply": {
            "by_district": by_district,
            "skill_distribution": [
                {"skill": r["skill"], "district": r["district"] or "Statewide", "supply": r["supply"], "sector": r["sector"]}
                for r in rows
            ],
            "tracked_cohort": cohort,
            "concentration": concentration[:12],
        },
        "demand": {
            "by_skill": [
                {"skill": r["skill"], "occupation": r["occupation"], "district": r["district"] or "Statewide", "demand": r["demand"], "sector": r["sector"], "trend": r["trend"]}
                for r in sorted(rows, key=lambda item: item["demand"] or 0, reverse=True)
            ],
            "by_sector": _sum_by(rows, "sector", "demand"),
            "by_district": _sum_by([r for r in rows if r.get("district")], "district", "demand"),
        },
        "gaps": gaps,
        "future": {
            "items": future,
            "emerging": [f for f in future if f["trend"] == "Emerging"],
            "growing": [f for f in future if f["trend"] == "Growing"],
            "declining": [f for f in future if f["trend"] == "Declining"],
            "priorities": [f for f in future if f["priority"] == "Priority Training"],
        },
        "wages": {
            "catalogue": wages,
            "progression": WAGE_PROGRESSION,
            "cohort": cohort_wages,
            "by_district": [
                {"district": name, "avg_wage": _district_metrics()[name]["avg_wage"]}
                for name in DISTRICT_NAMES
                if not district or district in ("All Districts", "All") or name == district
            ],
        },
        "mobility": mobility,
        "training": [
            {
                "skill": g["skill"],
                "district": g["district"],
                "supply": g["supply"],
                "demand": g["demand"],
                "gap_label": g["gap_label"],
                "recommendation": g["recommendation"],
            }
            for g in gaps
        ],
    }


def _sum_by(rows: List[Dict[str, Any]], key: str, value: str) -> List[Dict[str, Any]]:
    totals: Dict[str, int] = {}
    for row in rows:
        totals[row[key]] = totals.get(row[key], 0) + int(row.get(value) or 0)
    return [{"name": name, "value": total} for name, total in sorted(totals.items(), key=lambda item: item[1], reverse=True)]


def _cohort_wage_stats(district: Optional[str], skill: Optional[str]) -> List[Dict[str, Any]]:
    grouped: Dict[str, List[int]] = {}
    for trainee in db.trainees:
        if district and district not in ("All Districts", "All") and trainee.district != district:
            continue
        primary = PROGRAMME_PRIMARY_SKILLS.get(trainee.programme)
        if skill and skill not in ("All Skills", "All") and primary != skill:
            continue
        if trainee.current_wage:
            grouped.setdefault(primary or "Unmapped", []).append(trainee.current_wage)
    stats = []
    for name, wages in grouped.items():
        stats.append({
            "skill": name,
            "count": len(wages),
            "wage_avg": int(sum(wages) / len(wages)),
            "wage_min": min(wages),
            "wage_max": max(wages),
            "source": "Tracked prototype cohort wages, not an official wage survey",
        })
    stats.sort(key=lambda item: item["wage_avg"], reverse=True)
    return stats


def _mobility(rows: List[Dict[str, Any]], origin_filter: Optional[str]) -> List[Dict[str, Any]]:
    by_skill: Dict[str, List[Dict[str, Any]]] = {}
    for row in rows:
        if row.get("district") and row.get("demand") is not None and row.get("supply") is not None:
            by_skill.setdefault(row["skill"], []).append(row)

    paths = []
    origins = DISTRICT_NAMES
    if origin_filter and origin_filter not in ("All Districts", "All"):
        origins = [origin_filter]
    for skill, skill_rows in by_skill.items():
        ranked = sorted(skill_rows, key=lambda item: (item["demand"] - item["supply"]), reverse=True)
        best = ranked[0]
        for origin in origins:
            origin_row = next((r for r in skill_rows if r["district"] == origin), None)
            if not origin_row:
                paths.append({
                    "origin": origin,
                    "skill": skill,
                    "opportunity": "Data unavailable",
                    "destination": None,
                    "note": f"No catalogue row for {skill} in {origin}.",
                })
                continue
            destination = best["district"] if best["district"] != origin else None
            origin_gap = origin_row["demand"] - origin_row["supply"]
            dest_gap = (best["demand"] - best["supply"]) if destination else origin_gap
            if destination and dest_gap > origin_gap:
                note = (
                    f"Unmet demand for {skill} is {origin_gap:,} in {origin} and {dest_gap:,} in {destination}. "
                    "Other listed districts may have more openings. This is not an instruction to relocate."
                )
                opportunity = "Stronger openings elsewhere in the prototype catalogue"
            else:
                note = f"Within the prototype catalogue, {origin} is not behind another listed district on unmet demand for {skill}."
                opportunity = "Local openings are comparable or stronger"
                destination = origin
            paths.append({
                "origin": origin,
                "skill": skill,
                "occupation": origin_row["occupation"],
                "opportunity": opportunity,
                "destination": destination,
                "origin_gap": origin_gap,
                "destination_gap": dest_gap,
                "note": note,
            })
    return paths


def cohort_profile(district: str) -> Dict[str, Any]:
    trainees = [t for t in db.trainees if t.district == district]
    total = len(trainees)
    employed = [
        t for t in trainees
        if t.employment_status in (EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP)
    ]
    certified = [t for t in trainees if (t.certification_status or "").lower() == "certified"]
    wages = [t.current_wage for t in trainees if t.current_wage]
    retained = [t for t in employed if "6M" in (t.retention_status.value if hasattr(t.retention_status, "value") else str(t.retention_status)) or "12M" in str(t.retention_status)]
    metrics = _district_metrics().get(district, {})
    skills = []
    for item in metrics.get("top_skills", []):
        label = classify_gap(item.get("supply"), item.get("demand"))
        skills.append({**item, "gap_label": label, "recommendation": training_recommendation(label)})
    return {
        "district": district,
        "catalogue": {
            "economic_profile": {
                "Pune": "Automotive, electric mobility, and IT corridor",
                "Nashik": "Precision tooling, agro-processing, and cold chain",
                "Nagpur": "Manufacturing, logistics, and IT services in Nagpur",
            }.get(district),
            "workforce_supply": metrics.get("workforce_supply"),
            "job_demand": metrics.get("job_demand"),
            "net_gap": metrics.get("net_gap"),
            "gap_level": metrics.get("gap_level"),
            "employment_rate_pct": metrics.get("employment_rate"),
            "retention_6m_pct": metrics.get("retention_6m"),
            "avg_monthly_wage_inr": metrics.get("avg_wage"),
            "top_skills": skills,
            "top_occupations": metrics.get("top_occupations"),
            "recommended_training": metrics.get("recommended_training"),
            "mobility_outflow": metrics.get("mobility_outflow"),
        },
        "tracked_cohort": {
            "records": total,
            "certified": len(certified),
            "employed_or_apprentice_or_self_employed": len(employed),
            "employment_rate_pct": round(len(employed) / total * 100, 1) if total else None,
            "retained_6m_or_12m_among_employed": len(retained),
            "avg_recorded_wage_inr": int(sum(wages) / len(wages)) if wages else None,
            "note": "Counts are from the in-app trainee dataset, not the larger catalogue totals.",
        },
    }


def trainee_analysis_profile(trainee) -> Dict[str, Any]:
    return {
        "id": trainee.id,
        "name": trainee.name,
        "district": trainee.district,
        "state": trainee.state,
        "age": trainee.age,
        "gender": trainee.gender,
        "education": trainee.education,
        "institution": trainee.institution,
        "programme": trainee.programme,
        "training_centre": trainee.training_centre,
        "certification_status": trainee.certification_status,
        "certification_score": trainee.certification_score,
        "skills_acquired": trainee.skills_acquired,
        "skills_used": trainee.skills_used,
        "skills_missing": trainee.skills_missing,
        "skills_recommended": trainee.skills_recommended,
        "target_skills": trainee.target_skills,
        "employment_status": trainee.employment_status.value,
        "employer": trainee.employer,
        "job_role": trainee.job_role,
        "current_wage_inr": trainee.current_wage,
        "starting_wage_inr": trainee.starting_wage,
        "wage_history": trainee.wage_history,
        "retention_status": trainee.retention_status.value,
        "skill_relevance": trainee.skill_relevance,
        "current_location": trainee.current_location,
        "preferred_role": trainee.preferred_role,
        "preferred_sector": trainee.preferred_sector,
        "preferred_location": trainee.preferred_location,
        "willing_to_relocate": trainee.willing_to_relocate,
        "experience_years": trainee.experience_years if trainee.experience_years is not None else round(trainee.employment_duration_months / 12, 1),
    }


def _districts_in_text(question: str) -> List[str]:
    found = []
    lowered = question.lower()
    for name in DISTRICT_NAMES:
        if name.lower() in lowered:
            found.append(name)
    return found


def _trainees_in_text(question: str, explicit_ids: Optional[List[str]] = None) -> List[Any]:
    found = []
    seen = set()
    ids = list(explicit_ids or [])
    ids.extend(re.findall(r"TRN-MH-\d{4}-\d{4}", question, flags=re.IGNORECASE))
    for raw in ids:
        trainee = db.get_trainee_by_id(raw.upper())
        if trainee and trainee.id not in seen:
            found.append(trainee)
            seen.add(trainee.id)
    lowered = question.lower()
    for trainee in db.trainees:
        if trainee.id in seen:
            continue
        if trainee.name and trainee.name.lower() in lowered:
            found.append(trainee)
            seen.add(trainee.id)
    return found


def is_comparison(question: str, districts: List[str], trainees: List[Any]) -> bool:
    lowered = f" {question.lower()} "
    markers = (" compare ", " comparison ", " vs ", " vs. ", " versus ", " against ", " difference between ", " differ ")
    if any(marker in lowered for marker in markers):
        return True
    return len(districts) >= 2 or len(trainees) >= 2


def build_grounding(
    question: str,
    selected_district: Optional[str] = None,
    selected_skill: Optional[str] = None,
    selected_programme: Optional[str] = None,
    dashboard_metrics: Optional[Dict[str, Any]] = None,
    compare_trainee_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    districts = _districts_in_text(question)
    trainees = _trainees_in_text(question, compare_trainee_ids)
    comparison = is_comparison(question, districts, trainees)

    # A district filter must not replace entities named in the question.
    if comparison and len(districts) < 2 and len(trainees) < 2:
        # Comparison was requested but only one known entity was detected.
        targets = districts or ([selected_district] if selected_district in DISTRICT_NAMES else [])
    else:
        targets = districts

    entity_profiles = {name: cohort_profile(name) for name in (targets if targets else [])}
    if comparison and len(targets) >= 2:
        pass
    elif not comparison and selected_district in DISTRICT_NAMES and selected_district not in entity_profiles:
        entity_profiles[selected_district] = cohort_profile(selected_district)

    trainee_profiles = [trainee_analysis_profile(t) for t in trainees]
    if comparison and len(trainee_profiles) == 1:
        trainee_profiles.append({
            "name": "Second trainee",
            "note": "A second trainee could not be matched in the dataset. Say that this profile is unavailable.",
        })

    return {
        "platform": "SkillPulse AI",
        "state": STATE_NAME,
        "data_note": DATA_NOTE,
        "question": question,
        "comparison_required": comparison,
        "comparison_targets": {
            "districts": targets,
            "trainees": [t.get("id") or t.get("name") for t in trainee_profiles],
        },
        "response_rules": (
            "Answer the exact question. If comparison_required is true, write a separate block for EVERY listed district "
            "and EVERY listed trainee before the comparison. Include metrics, strengths, skill gaps, and employment only "
            "when those fields exist. If a field is missing, write 'Data unavailable'. Do not invent districts, people, "
            "or statistics. Do not answer using only the selected filter district when other entities are listed."
        ),
        "selected_filter": {
            "district": selected_district,
            "skill": selected_skill,
            "programme": selected_programme,
            "note": "This is the screen filter. It is not a substitute for entities named in the question.",
        },
        "entity_profiles": entity_profiles,
        "trainee_profiles": trainee_profiles,
        "skill_gap_table": build_intelligence(district=None)["gaps"],
        "dashboard_metrics": dashboard_metrics or {},
        "unavailable_if_not_listed": [
            "Official government statistics",
            "Districts outside the nine supported districts",
            "Any metric not present in entity_profiles, trainee_profiles, skill_gap_table, or dashboard_metrics",
        ],
    }


def redact_trainee(trainee, role: str) -> Dict[str, Any]:
    data = trainee.dict() if hasattr(trainee, "dict") else trainee.model_dump()
    if role == "employer":
        for key in ("phone", "email", "verifications", "follow_ups", "consent_status"):
            data.pop(key, None)
        data["contact_note"] = "Phone, email, and verification notes are hidden from employer accounts."
    return data


def _education_rank(value: str) -> int:
    text = (value or "").lower()
    order = [
        ("10th", 1),
        ("12th", 2),
        ("iti", 3),
        ("polytechnic", 4),
        ("diploma", 4),
        ("graduate", 5),
        ("bsc", 5),
        ("bcom", 5),
        ("ba", 5),
        ("be", 6),
        ("btech", 6),
    ]
    rank = 0
    for token, score in order:
        if token in text:
            rank = max(rank, score)
    return rank


def match_candidates(requirements: Dict[str, Any]) -> Dict[str, Any]:
    required_skills = [s.strip().lower() for s in requirements.get("required_skills") or [] if s and s.strip()]
    role = (requirements.get("job_role") or "").strip().lower()
    education = requirements.get("education") or ""
    location = (requirements.get("location") or "").strip().lower()
    certification = (requirements.get("preferred_certification") or "").strip().lower()
    min_years = float(requirements.get("min_experience_years") or 0)
    salary_min = requirements.get("salary_min")
    salary_max = requirements.get("salary_max")

    results = []
    for trainee in db.trainees:
        skills = [s.lower() for s in (trainee.skills_acquired or [])]
        primary = (PROGRAMME_PRIMARY_SKILLS.get(trainee.programme) or "").lower()
        if primary:
            skills.append(primary)
        skill_hits = [s for s in required_skills if any(s in owned or owned in s for owned in skills)]
        skills_score = (len(skill_hits) / len(required_skills)) if required_skills else (0.5 if not role else (1.0 if role and trainee.job_role and role in trainee.job_role.lower() else 0.4))

        edu_score = 1.0 if not education else (1.0 if _education_rank(trainee.education) >= _education_rank(education) else 0.35)
        years = trainee.experience_years if trainee.experience_years is not None else trainee.employment_duration_months / 12
        exp_score = 1.0 if years >= min_years else (0.0 if min_years else 1.0)
        if min_years and years < min_years:
            exp_score = round(min(years / min_years, 1), 2) if min_years else 0

        cert_text = (trainee.certification_status or "").lower()
        if not certification:
            cert_score = 1.0 if cert_text == "certified" else 0.6
        else:
            cert_score = 1.0 if certification in cert_text or cert_text == "certified" else 0.2

        if not location or location in ("all", "all districts", "all states", "bihar", "uttar pradesh", "maharashtra"):
            location_score = 1.0
        elif location == (trainee.district or "").lower() or location == (trainee.state or "").lower() or location == (trainee.current_location or "").lower():
            location_score = 1.0
        elif trainee.willing_to_relocate:
            location_score = 0.7
        else:
            location_score = 0.25

        parts = {
            "skills": round(skills_score * 100),
            "education": round(edu_score * 100),
            "experience": round(exp_score * 100),
            "certification": round(cert_score * 100),
            "location": round(location_score * 100),
        }
        # Equal weights. Labeled as prototype matching logic.
        overall = round(sum(parts.values()) / 5)
        if salary_min and trainee.current_wage and trainee.current_wage > (salary_max or 10**9):
            note = "Recorded wage is above the stated maximum."
        elif salary_max and trainee.current_wage and trainee.current_wage < (salary_min or 0):
            note = "Recorded wage is below the stated minimum. Wage is not part of the percentage."
        else:
            note = "Wage is shown for context and is not part of the percentage."

        profile = redact_trainee(trainee, "employer")
        results.append({
            "trainee_id": trainee.id,
            "name": trainee.name,
            "match_pct": overall,
            "breakdown": parts,
            "why": [
                f"Skills match {parts['skills']}% ({len(skill_hits)} of {len(required_skills) or 0} required skills found)." if required_skills else "No required skills were specified, so skills used a neutral score.",
                f"Education match {parts['education']}%.",
                f"Experience match {parts['experience']}% against {min_years} years.",
                f"Certification match {parts['certification']}%.",
                f"Location match {parts['location']}%.",
                note,
            ],
            "profile": {
                "district": trainee.district,
                "education": trainee.education,
                "programme": trainee.programme,
                "certification_status": trainee.certification_status,
                "skills_acquired": trainee.skills_acquired,
                "experience_years": round(years, 1),
                "employment_status": trainee.employment_status.value,
                "job_role": trainee.job_role,
                "preferred_role": trainee.preferred_role,
                "preferred_location": trainee.preferred_location,
                "willing_to_relocate": trainee.willing_to_relocate,
                "current_wage": trainee.current_wage,
            },
        })
    results.sort(key=lambda item: item["match_pct"], reverse=True)
    return {
        "scoring": "Synthetic/demo matching logic. Each of skills, education, experience, certification, and location contributes equally. Wage is not scored.",
        "notice": DATA_NOTE,
        "count": len(results),
        "candidates": results[:25],
    }
