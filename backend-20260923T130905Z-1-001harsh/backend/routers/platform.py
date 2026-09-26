"""Jobs, applications, search, and data-quality for the connected prototype."""
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request

from data_store import db
from ecosystem import SECTORS
from geography import GEOGRAPHY
from intelligence import redact_trainee

router = APIRouter(tags=["Platform"])


@router.get("/api/geography")
def geography():
    return {"states": GEOGRAPHY}

STAGES = ["Applied", "Shortlisted", "Interview", "Selected", "Joined"]
PIPELINE = ["Matched", "Shortlisted", "Interview", "Selected", "Joined", "Retained"]


def _visible(trainee, role: str):
    if role == "employer":
        data = redact_trainee(trainee, "employer")
        data["skillpulse_id"] = trainee.skillpulse_id
        data["skill_profile"] = trainee.skill_profile
        data["checkpoints"] = trainee.checkpoints
        data["sector"] = trainee.sector
        data["availability"] = trainee.availability
        data["wage_expectation"] = trainee.wage_expectation
        return data
    return trainee


@router.get("/api/search")
def search(q: str = "", request: Request = None):
    query = (q or "").strip()
    if len(query) < 2:
        return {"trainees": [], "skills": [], "districts": [], "jobs": []}
    role = getattr(getattr(request, "state", None), "user", {}).get("role", "admin")
    people = db.get_trainees(search=query)[:8]
    trainees = []
    for person in people:
        if role == "trainee":
            continue
        trainees.append({
            "id": person.id,
            "skillpulse_id": person.skillpulse_id,
            "name": person.name,
            "district": person.district,
            "state": person.state,
            "skills": person.skills_acquired[:4],
            "type": "trainee",
        })
    skills = sorted({skill for person in db.trainees for skill in person.skills_acquired if query.lower() in skill.lower()})[:8]
    districts = sorted({person.district for person in db.trainees if query.lower() in person.district.lower() or query.lower() in (person.state or "").lower()})[:8]
    jobs = [job for job in db.jobs if query.lower() in job["title"].lower() or query.lower() in job["sector"].lower()][:8]
    return {"trainees": trainees, "skills": skills, "districts": districts, "jobs": jobs}


@router.get("/api/jobs")
def list_jobs(district: Optional[str] = None, sector: Optional[str] = None, skill: Optional[str] = None):
    rows = db.jobs
    if district and district != "All Districts":
        rows = [job for job in rows if job["district"] == district]
    if sector and sector != "All Sectors":
        rows = [job for job in rows if job["sector"] == sector]
    if skill and skill != "All Skills":
        rows = [job for job in rows if any(skill.lower() in item.lower() for item in job["required_skills"])]
    return {"notice": "Synthetic demo openings.", "items": rows[:80]}


@router.post("/api/jobs")
def create_job(payload: Dict[str, Any]):
    job = {
        "id": f"JOB-{len(db.jobs) + 1:04d}",
        "title": payload.get("title") or "Untitled role",
        "description": payload.get("description") or "",
        "required_skills": payload.get("required_skills") or [],
        "qualification": payload.get("qualification") or "",
        "experience_years": payload.get("experience_years") or 0,
        "state": payload.get("state") or "Bihar",
        "district": payload.get("district") or "Patna",
        "location": payload.get("location") or payload.get("district") or "Patna",
        "sector": payload.get("sector") or "Renewable Energy",
        "salary_min": payload.get("salary_min"),
        "salary_max": payload.get("salary_max"),
        "openings": payload.get("openings") or 1,
        "proficiency": payload.get("proficiency") or "Intermediate",
        "timeline": payload.get("timeline") or "30 days",
        "employer_name": payload.get("employer_name") or "Employer",
        "notice": "Created in the prototype. Not a live vacancy.",
    }
    db.jobs.insert(0, job)
    return job


@router.post("/api/jobs/extract-skills")
async def extract_skills(payload: Dict[str, Any]):
    description = (payload.get("description") or "").lower()
    catalogue = [name for row in SECTORS for name, _level in row["skills"]]
    found = [skill for skill in catalogue if skill.lower() in description]
    source = "catalogue keyword match"
    try:
        from gemini_service import gemini_service
        if gemini_service.api_key and description:
            phrased = await gemini_service.phrase_followup(
                "List only skill names from this catalogue that the job needs, comma separated: " + ", ".join(catalogue),
                description[:500],
                "skill_extraction",
            )
            if phrased:
                gemini_found = [skill for skill in catalogue if skill.lower() in phrased.lower()]
                if gemini_found:
                    found = gemini_found
                    source = "SkillPulse AI skill extraction limited to the prototype skill catalogue"
    except Exception:
        pass
    if not found:
        found = catalogue[:3]
        source = "No catalogue skill was named in the description. Showing three related catalogue skills, not invented competencies."
    return {"skills": found, "source": source}


@router.get("/api/applications")
def list_applications(trainee_id: Optional[str] = None, stage: Optional[str] = None, request: Request = None):
    role = getattr(request.state, "user", {}).get("role")
    own = getattr(request.state, "user", {}).get("trainee_id")
    rows = db.applications
    if role == "trainee":
        rows = [row for row in rows if row["trainee_id"] == own]
    elif trainee_id:
        rows = [row for row in rows if row["trainee_id"] == trainee_id]
    if stage and stage not in ("All", "Matched"):
        rows = [row for row in rows if row["status"] == stage]
    return {"items": rows}


@router.post("/api/applications")
def apply(payload: Dict[str, Any], request: Request):
    user = request.state.user
    trainee_id = user.get("trainee_id") if user.get("role") == "trainee" else payload.get("trainee_id")
    trainee = db.get_trainee_by_id(trainee_id or "")
    job = next((item for item in db.jobs if item["id"] == payload.get("job_id")), None)
    if not trainee or not job:
        raise HTTPException(status_code=404, detail="Trainee or job was not found.")
    if any(row["trainee_id"] == trainee.id and row["job_id"] == job["id"] for row in db.applications):
        raise HTTPException(status_code=400, detail="This trainee already applied to that job.")
    record = {
        "id": f"APP-{len(db.applications) + 1:05d}",
        "trainee_id": trainee.id,
        "skillpulse_id": trainee.skillpulse_id,
        "name": trainee.name,
        "job_id": job["id"],
        "job_title": job["title"],
        "status": "Applied",
        "updated_at": datetime.now().strftime("%Y-%m-%d"),
    }
    db.applications.append(record)
    return record


@router.post("/api/applications/{application_id}/stage")
def move_stage(application_id: str, payload: Dict[str, Any]):
    record = next((row for row in db.applications if row["id"] == application_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Application not found.")
    status = payload.get("status")
    if status not in STAGES and status != "Retained":
        raise HTTPException(status_code=400, detail="Unknown stage.")
    record["status"] = status
    record["updated_at"] = datetime.now().strftime("%Y-%m-%d")
    return record


@router.get("/api/employers/overview")
def employer_overview():
    counts = {stage: 0 for stage in PIPELINE}
    counts["Matched"] = min(42, len(db.trainees))
    for row in db.applications:
        if row["status"] in counts:
            counts[row["status"]] += 1
    return {
        "notice": "Synthetic demo hiring activity.",
        "openings": len(db.jobs),
        "matched": counts["Matched"],
        "shortlisted": counts["Shortlisted"],
        "interviews": counts["Interview"],
        "hires": counts["Joined"] + counts["Selected"],
        "retained": counts["Retained"],
        "pipeline": [
            {"stage": "Available", "count": len(db.trainees)},
            {"stage": "Matched", "count": counts["Matched"]},
            {"stage": "Shortlisted", "count": max(counts["Shortlisted"], 18 if db.applications else 0)},
            {"stage": "Interview", "count": counts["Interview"]},
            {"stage": "Selected", "count": counts["Selected"]},
            {"stage": "Joined", "count": counts["Joined"]},
            {"stage": "Retained", "count": counts["Retained"]},
        ],
    }


@router.post("/api/employers/outcomes")
def record_outcome(payload: Dict[str, Any]):
    record = {
        "id": f"OUT-{len(db.employer_outcomes) + 1}",
        "trainee_id": payload.get("trainee_id"),
        "joined": payload.get("joined"),
        "still_employed": payload.get("still_employed"),
        "role_relevant": payload.get("role_relevant"),
        "duration": payload.get("duration"),
        "skill_utilisation": payload.get("skill_utilisation"),
        "feedback": payload.get("feedback"),
        "wage_band": payload.get("wage_band"),
        "checkpoint": payload.get("checkpoint") or "3M",
        "recorded_at": datetime.now().strftime("%Y-%m-%d"),
    }
    db.employer_outcomes.append(record)
    return record


@router.get("/api/quality")
def data_quality():
    missing = [t for t in db.trainees if not t.last_follow_up_date and t.employment_status.value == "Employed"]
    conflicts = [t for t in db.trainees if t.verification_status.value == "Conflicting Information"]
    pending = [t for t in db.trainees if t.verification_status.value == "Pending Verification"]
    self_reported = [t for t in db.trainees if t.verification_status.value == "Self Reported"]
    phones = {}
    duplicates = []
    for trainee in db.trainees:
        phones.setdefault(trainee.phone, []).append(trainee.skillpulse_id)
    for phone, ids in phones.items():
        if phone and len(ids) > 1:
            duplicates.append({"phone": phone, "ids": ids})

    def brief(rows: List[Any]):
        return [{"id": t.id, "skillpulse_id": t.skillpulse_id, "name": t.name, "district": t.district, "status": t.verification_status.value} for t in rows[:25]]

    return {
        "notice": "Counts come from the in-memory prototype dataset.",
        "categories": [
            {"id": "missing", "label": "Missing employment updates", "count": len(missing), "records": brief(missing)},
            {"id": "duplicates", "label": "Duplicate mobile numbers", "count": len(duplicates), "records": duplicates[:25]},
            {"id": "conflicts", "label": "Conflicting information", "count": len(conflicts), "records": brief(conflicts)},
            {"id": "unverified", "label": "Self-reported, not independently verified", "count": len(self_reported), "records": brief(self_reported)},
            {"id": "pending", "label": "Verification backlog", "count": len(pending), "records": brief(pending)},
        ],
    }


@router.get("/api/geo")
def geo(state: Optional[str] = None, skill: Optional[str] = None):
    rows = []
    seen = {}
    for trainee in db.trainees:
        if state and state not in ("All States", "All") and trainee.state != state:
            continue
        if skill and skill not in ("All Skills", "All") and skill not in (trainee.skills_acquired or []):
            continue
        key = (trainee.state, trainee.district)
        bucket = seen.setdefault(key, {"state": trainee.state, "district": trainee.district, "trainees": 0, "employed": 0, "centres": set()})
        bucket["trainees"] += 1
        if trainee.employment_status.value in ("Employed", "Self-Employed", "Apprenticeship"):
            bucket["employed"] += 1
        bucket["centres"].add(trainee.training_centre)
    for bucket in seen.values():
        demand = len([job for job in db.jobs if job["district"] == bucket["district"] and (not skill or skill in job["required_skills"])])
        rows.append({
            "state": bucket["state"],
            "district": bucket["district"],
            "trainees": bucket["trainees"],
            "employed": bucket["employed"],
            "training_centres": len(bucket["centres"]),
            "job_openings": demand,
            "demand": "High" if demand >= 8 else "Medium" if demand >= 3 else "Low",
        })
    rows.sort(key=lambda item: item["trainees"], reverse=True)
    return {"notice": "Synthetic demo geography.", "items": rows}
