"""Extra prototype identities, jobs, and 12-month checkpoints.

Maharashtra records stay. Bihar and a few other states are added so filters,
search, and matching stay populated. Figures are synthetic demo data.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List

from geography import GEOGRAPHY, STATE_CODES, normalize_place
from models import (
    CareerEvent, CommChannel, EmploymentStatus, RetentionStatus, Trainee, VerificationStatus,
)

SECTORS: List[Dict[str, Any]] = [
    {"sector": "Renewable Energy", "programme": "Suryamitra Solar Technician", "skills": [
        ("Solar Installation", "Advanced"), ("Electrical Safety", "Intermediate"), ("PV Maintenance", "Intermediate"), ("Inverter Troubleshooting", "Beginner")
    ], "roles": ["Solar Technician", "PV Maintenance Technician"]},
    {"sector": "Electric Mobility", "programme": "EV Service Technician", "skills": [
        ("EV Service", "Intermediate"), ("Battery Diagnostics", "Intermediate"), ("EV Charging Installation", "Beginner"), ("Motor Controller Repair", "Beginner")
    ], "roles": ["EV Technician", "Charging Station Technician"]},
    {"sector": "IT & Digital Services", "programme": "Digital Skills Associate", "skills": [
        ("Data Entry", "Intermediate"), ("Web Development", "Beginner"), ("Python", "Beginner"), ("Data Analysis", "Beginner"), ("Cloud Support", "Intermediate")
    ], "roles": ["Data Analyst", "Cloud Support Associate"]},
    {"sector": "Healthcare", "programme": "General Duty Assistant", "skills": [
        ("Patient Care", "Intermediate"), ("Vital Signs", "Intermediate"), ("Infection Control", "Beginner")
    ], "roles": ["Healthcare Assistant", "Patient Care Assistant"]},
    {"sector": "Construction", "programme": "Construction Site Technician", "skills": [
        ("Masonry", "Intermediate"), ("Bar Bending", "Beginner"), ("Site Safety", "Intermediate")
    ], "roles": ["Construction Technician", "Site Supervisor Assistant"]},
    {"sector": "Manufacturing", "programme": "CNC & Fitting Technician", "skills": [
        ("CNC Operation", "Intermediate"), ("Fitting", "Intermediate"), ("Quality Inspection", "Beginner")
    ], "roles": ["CNC Operator", "Quality Inspector"]},
    {"sector": "Agriculture & Allied", "programme": "Agri Equipment Technician", "skills": [
        ("Farm Machinery", "Intermediate"), ("Drip Irrigation", "Beginner"), ("Cold Chain Handling", "Beginner")
    ], "roles": ["Agri Technician", "Cold Chain Assistant"]},
    {"sector": "Retail", "programme": "Retail Sales Associate", "skills": [
        ("Retail Sales", "Intermediate"), ("POS Billing", "Intermediate"), ("Inventory Count", "Beginner")
    ], "roles": ["Retail Associate", "Store Supervisor"]},
    {"sector": "Logistics", "programme": "Warehouse Associate", "skills": [
        ("Warehouse Operations", "Intermediate"), ("Pick and Pack", "Intermediate"), ("Dispatch Documentation", "Beginner")
    ], "roles": ["Warehouse Associate", "Dispatch Coordinator"]},
    {"sector": "Automotive", "programme": "Automotive Service Technician", "skills": [
        ("Engine Service", "Intermediate"), ("Vehicle Diagnostics", "Beginner"), ("Workshop Safety", "Intermediate")
    ], "roles": ["Automotive Technician", "Service Advisor Assistant"]},
    {"sector": "Electronics", "programme": "Electronics Assembly Technician", "skills": [
        ("PCB Assembly", "Intermediate"), ("Soldering", "Intermediate"), ("Testing & QA", "Beginner")
    ], "roles": ["Electronics Technician", "Assembly Operator"]},
]

PLACES = [(state, district) for state, districts in GEOGRAPHY.items() for district in districts]
SPOTLIGHT = {
    ("Bihar", "Muzaffarpur"): ["Solar Technician", "Data Entry Operator", "Electrician", "Retail Associate"],
    ("Bihar", "Patna"): ["Data Analyst", "Electrician", "Solar Technician", "Field Technician"],
    ("Uttar Pradesh", "Lucknow"): ["EV Technician", "Data Entry Operator", "Healthcare Assistant", "Solar Technician"],
    ("Uttar Pradesh", "Varanasi"): ["Electrician", "Solar Technician", "Retail Associate", "Machine Operator"],
    ("Maharashtra", "Pune"): ["EV Technician", "Data Analyst", "CNC Operator", "Solar Technician"],
    ("Maharashtra", "Nagpur"): ["Electrician", "Field Technician", "Data Entry Operator", "Solar Technician"],
    ("Maharashtra", "Nashik"): ["CNC Operator", "EV Technician", "Solar Technician", "Electrician"],
}
ROLE_SECTOR = {
    "Solar Technician": 0, "Field Technician": 0, "EV Technician": 1, "Data Entry Operator": 2,
    "Data Analyst": 2, "Healthcare Assistant": 3, "Electrician": 10, "Machine Operator": 5,
    "CNC Operator": 5, "Retail Associate": 7,
}

STATE_CODE = {
    "Maharashtra": "MH", "Bihar": "BR", "Delhi": "DL", "Karnataka": "KA",
    "Tamil Nadu": "TN", "Gujarat": "GJ", "Uttar Pradesh": "UP", "Rajasthan": "RJ",
}

FIRST = ["Aarav", "Ananya", "Rahul", "Neha", "Imran", "Pooja", "Suresh", "Kavita", "Amit", "Rani"]
LAST = ["Kumar", "Sharma", "Yadav", "Singh", "Das", "Verma", "Jha", "Mishra"]
STATUSES = [
    EmploymentStatus.EMPLOYED, EmploymentStatus.EMPLOYED, EmploymentStatus.UNEMPLOYED,
    EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP, EmploymentStatus.FURTHER_EDUCATION,
]
VERIFY = [
    VerificationStatus.MULTI_VERIFIED, VerificationStatus.EMPLOYER_VERIFIED, VerificationStatus.SELF_REPORTED,
    VerificationStatus.PENDING_VERIFICATION, VerificationStatus.CONFLICTING_INFORMATION, VerificationStatus.INSUFFICIENT_EVIDENCE,
]


def _checkpoints(duration: int, status: EmploymentStatus, role: str, employer: str) -> List[Dict[str, Any]]:
    working = status in (EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP)
    rows = []
    for label, months in (("30D", 1), ("90D", 3), ("180D", 6), ("270D", 9), ("9M", 9), ("12M", 12)):
        reached = working and duration >= months
        rows.append({
            "stage": label,
            "months": months,
            "status": "Confirmed" if reached else "Pending",
            "employment_status": status.value if reached else "Not yet due",
            "role": role if reached else None,
            "employer": employer if reached else None,
            "employment_duration": f"{duration} months" if reached else None,
            "role_relevance": "High" if reached else None,
            "skill_utilisation": "Active" if reached else None,
            "retention_status": "Retained through 12 months" if reached and label == "12M" else ("Retained" if reached else "Pending"),
            "verification_status": "Employer Verified" if reached else "Pending Verification",
            "wage_band": "₹15,000–₹25,000" if reached else None,
            "update_source": "Employer confirmation and trainee check-in" if reached else None,
            "last_updated": "2026-03-15" if reached else None,
            "employer_verified": reached,
            "trainee_confirmed": reached,
        })
    return rows


def _profile(skills, sector) -> List[Dict[str, Any]]:
    verify_cycle = ["Verified", "Verified", "Partial", "Gap"]
    rows = []
    for index, (name, level) in enumerate(skills):
        rows.append({
            "name": name,
            "level": level,
            "verification": verify_cycle[index % len(verify_cycle)] if level != "Beginner" else "Gap",
            "acquired_from": sector,
            "assessment_score": 78 - index * 6,
            "related_jobs": [role for item in SECTORS if item["sector"] == sector for role in item["roles"]],
        })
    return rows


def _make(index: int, name: str, phone: str, skillpulse_id: str, state: str, district: str, sector_row: Dict[str, Any], status: EmploymentStatus) -> Trainee:
    skills = [skill for skill, _level in sector_row["skills"]]
    role = sector_row["roles"][index % len(sector_row["roles"])]
    working = status in (EmploymentStatus.EMPLOYED, EmploymentStatus.SELF_EMPLOYED, EmploymentStatus.APPRENTICESHIP)
    duration = [3, 8, 14][index % 3] if working else 0
    wage = 16000 + (index % 8) * 1500 if status == EmploymentStatus.EMPLOYED else None
    enrolled = (datetime(2025, 1, 10) + timedelta(days=index % 120)).strftime("%Y-%m-%d")
    retention = RetentionStatus.NOT_APPLICABLE
    if duration >= 12:
        retention = RetentionStatus.RETAINED_12M
    elif duration >= 6:
        retention = RetentionStatus.RETAINED_6M
    elif duration >= 3:
        retention = RetentionStatus.RETAINED_3M
    employer = f"{district} {sector_row['sector']} Unit" if status == EmploymentStatus.EMPLOYED else None
    trainee = Trainee(
        id=f"TRN-{STATE_CODE.get(state, 'IN')}-2025-{index:04d}",
        name=name,
        district=district,
        state=state,
        gender="Female" if index % 2 == 0 else "Male",
        age=20 + (index % 10),
        education="ITI Technical Trade" if index % 3 else "12th Vocational",
        programme=sector_row["programme"],
        training_centre=f"{district} Skill Centre",
        batch="2025-Q1" if index % 2 == 0 else "2025-Q2",
        enrollment_date=enrolled,
        completion_date=enrolled,
        certification_status="Certified" if index % 5 else "Pending",
        certification_score=70 + (index % 25),
        skills_acquired=skills,
        skills_used=skills[:2] if status == EmploymentStatus.EMPLOYED else [],
        skills_missing=[skills[-1]] if skills else [],
        skills_recommended=[skills[-1]] if skills else [],
        employment_status=status,
        employer=employer,
        job_role=role if status == EmploymentStatus.EMPLOYED else None,
        joining_date=enrolled if status == EmploymentStatus.EMPLOYED else None,
        current_wage=wage,
        starting_wage=wage - 1500 if wage else None,
        wage_history=[{"stage": "Placement", "wage": wage}] if wage else [],
        employment_duration_months=duration,
        retention_status=retention,
        retention_risk="Low" if duration >= 6 else "Medium",
        skill_relevance="High" if status == EmploymentStatus.EMPLOYED else "Unknown",
        current_location=district,
        verification_status=VERIFY[index % len(VERIFY)],
        preferred_channel=CommChannel.WHATSAPP,
        career_events=[
            CareerEvent(id=f"EV-{index}-1", stage="Education", title=f"Completed schooling in {district}", date="2022-05-01", description="Field of study recorded on the trainee profile.", status="Completed"),
            CareerEvent(id=f"EV-{index}-2", stage="Training", title=sector_row["programme"], date=enrolled, description=f"Training centre: {district} Skill Centre.", status="Completed"),
            CareerEvent(id=f"EV-{index}-3", stage="Certification", title="Trade certificate", date=enrolled, description="Issuing body: prototype skill mission.", status="Certified" if index % 5 else "Pending"),
        ],
        phone=phone,
        skillpulse_id=skillpulse_id,
        sector=sector_row["sector"],
        skill_profile=_profile(sector_row["skills"], sector_row["sector"]),
        checkpoints=_checkpoints(duration, status, role, employer or ""),
        availability="Immediate" if status != EmploymentStatus.EMPLOYED else "Employed",
        wage_expectation=18000 + (index % 6) * 1000,
        institution=f"{district} ITI",
        graduation_year="2024",
        completion_status="Completed",
        preferred_role=role,
        preferred_sector=sector_row["sector"],
        preferred_location=district,
        willing_to_relocate=index % 3 == 0,
        experience_years=round(duration / 12, 1),
    )
    return trainee


def expand_store(db) -> None:
    # Ensure all existing trainees have normalized locations
    for trainee in db.trainees:
        trainee.state, trainee.district = normalize_place(trainee.state, trainee.district)

    # Populate jobs if empty or insufficient
    if not db.jobs:
        job_id = 1
        for state, district in PLACES:
            for s_idx in range(min(3, len(SECTORS))):
                sector_row = SECTORS[s_idx]
                role = sector_row["roles"][0]
                skills = [name for name, _level in sector_row["skills"]]
                db.jobs.append({
                    "id": f"JOB-{job_id:04d}",
                    "title": role,
                    "description": f"{role} for {sector_row['sector']} work in {district}, {state}. Needs {', '.join(skills[:3])}.",
                    "required_skills": skills,
                    "qualification": "ITI or Vocational Diploma",
                    "experience_years": 0,
                    "state": state,
                    "district": district,
                    "location": f"{district}, {state}",
                    "sector": sector_row["sector"],
                    "salary_min": 16000,
                    "salary_max": 28000,
                    "openings": 2 + (job_id % 4),
                    "proficiency": "Intermediate",
                    "timeline": "Immediate / 30 days",
                    "employer_name": f"{district} {sector_row['sector']} Hub",
                    "notice": "SkillPulse demo opening.",
                })
                job_id += 1

    # Populate organisations if empty
    if not db.organisations:
        org_id = 1
        for state, district in PLACES:
            for s_idx in range(len(SECTORS)):
                sector_row = SECTORS[s_idx]
                skills = [name for name, _level in sector_row["skills"]]
                db.organisations.append({
                    "id": f"EMP-{org_id:04d}",
                    "name": f"{district} {sector_row['sector']} Enterprises",
                    "industry": sector_row["sector"],
                    "contact_person": "Talent Acquisition Head",
                    "email": f"hiring.{org_id}@skillpulse.demo",
                    "phone": f"97{org_id:08d}"[-10:],
                    "state": state,
                    "district": district,
                    "address": f"Industrial Growth Area, {district}",
                    "location": f"{district}, {state}",
                    "organisation_type": "Private Limited",
                    "required_skills": skills,
                    "workforce_requirement": 5 + (org_id % 7),
                    "verification_status": "Employer Verified",
                    "active_jobs": 3,
                    "matched_talent": 8,
                    "hires": 2,
                    "outcomes": "Longitudinal 12M tracking enabled",
                })
                org_id += 1

    # Applications for demo pipelines
    if not db.applications and db.jobs:
        for trainee in db.trainees[:40]:
            job = next((item for item in db.jobs if item["district"] == trainee.district), db.jobs[0])
            db.applications.append({
                "id": f"APP-{trainee.skillpulse_id or trainee.id}",
                "trainee_id": trainee.id,
                "skillpulse_id": trainee.skillpulse_id,
                "job_id": job["id"],
                "job_title": job["title"],
                "status": "Shortlisted" if trainee.employment_status == EmploymentStatus.EMPLOYED else "Applied",
                "updated_at": datetime.now().strftime("%Y-%m-%d"),
            })
